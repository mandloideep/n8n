import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from jwt import PyJWTError
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.limiter import limiter
from db.database import get_db
from models.refresh_token import RefreshToken
from models.user import User
from schemas.user import UserCreate, UserLogin, UserResponse

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 14
# Brief window allowing two concurrent tabs to both refresh once after the
# original cookie expired without flagging the second call as token theft.
REFRESH_REUSE_GRACE_SECONDS = 10
ACCESS_COOKIE_NAME = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/auth"
_IS_PROD = settings.ENV == "production"

_password_hasher = PasswordHasher()
# Real argon2 hash used by the timing-equalising path in signin. Generated
# once at import so an unknown-email signin still spends the same ~100ms.
_DUMMY_PASSWORD_HASH = _password_hasher.hash("__not_a_real_password__")
router = APIRouter(tags=["Auth"])


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        _password_hasher.verify(hashed_password, plain_password)
        return True
    except (VerifyMismatchError, InvalidHashError):
        return False


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _encode_access(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": _now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _encode_refresh(jti: str) -> str:
    payload = {
        "jti": jti,
        "type": "refresh",
        "exp": _now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _set_access_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=_IS_PROD,
        samesite="strict",
        path="/",
    )


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        httponly=True,
        secure=_IS_PROD,
        samesite="strict",
        path=REFRESH_COOKIE_PATH,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key=ACCESS_COOKIE_NAME, path="/")
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


async def _issue_token_pair(
    response: Response,
    db: AsyncSession,
    user_id: int,
    family_id: str | None = None,
) -> None:
    """Mint both cookies and persist the refresh-token row."""
    jti = uuid.uuid4().hex
    family = family_id or uuid.uuid4().hex
    now = _now()
    db.add(
        RefreshToken(
            jti=jti,
            user_id=user_id,
            family_id=family,
            expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            created_at=now,
        )
    )
    await db.commit()
    _set_access_cookie(response, _encode_access(user_id))
    _set_refresh_cookie(response, _encode_refresh(jti))


def get_current_user(request: Request) -> int:
    token = request.cookies.get(ACCESS_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(sub)
    except (PyJWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/signup", response_model=UserResponse)
@limiter.limit("3/hour")
async def signup(
    request: Request,
    response: Response,
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = (
        await db.execute(select(User).where(User.email == user.email))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # argon2 is intentionally CPU-expensive — offload so the event loop
    # stays responsive under signup load.
    hashed_pwd = await asyncio.to_thread(hash_password, user.password)
    new_user = User(email=user.email, password=hashed_pwd, name=user.name)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    await _issue_token_pair(response, db, new_user.id)

    return {
        "user": {
            "id": new_user.id,
            "email": new_user.email,
        }
    }


@router.post("/signin")
@limiter.limit("5/minute")
async def signin(
    request: Request,
    response: Response,
    user: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    db_user = (
        await db.execute(select(User).where(User.email == user.email))
    ).scalar_one_or_none()

    # Always run argon2 verification (even on missing user) so timing
    # doesn't leak whether an email exists — and offload so the event loop
    # stays responsive.
    if db_user is None:
        await asyncio.to_thread(verify_password, user.password, _DUMMY_PASSWORD_HASH)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    valid = await asyncio.to_thread(verify_password, user.password, db_user.password)
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await _issue_token_pair(response, db, db_user.id)

    return {
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
        }
    }


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Rotate the refresh token. Detects reuse (token replay) and revokes the
    whole family on theft. A short grace window tolerates legitimate
    concurrent refreshes from multiple tabs.
    """
    raw = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        payload = jwt.decode(raw, SECRET_KEY, algorithms=[ALGORITHM])
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    jti = payload.get("jti")
    if not jti:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    row = (
        await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
    ).scalar_one_or_none()
    if not row or row.revoked or row.expires_at < _now():
        raise HTTPException(status_code=401, detail="Refresh token expired or revoked")

    now = _now()
    if row.used_at is not None:
        # Token already rotated. Either a legitimate concurrent refresh
        # (within the grace window) or a stolen replay.
        if (now - row.used_at).total_seconds() > REFRESH_REUSE_GRACE_SECONDS:
            await db.execute(
                update(RefreshToken)
                .where(RefreshToken.family_id == row.family_id)
                .values(revoked=True)
            )
            await db.commit()
            _clear_auth_cookies(response)
            raise HTTPException(status_code=401, detail="Refresh token reuse detected")
        await _issue_token_pair(response, db, row.user_id, family_id=row.family_id)
        return {"status": "ok"}

    # Normal rotation: mark this row used, mint the new pair.
    new_jti = uuid.uuid4().hex
    row.used_at = now
    row.replaced_by = new_jti
    db.add(
        RefreshToken(
            jti=new_jti,
            user_id=row.user_id,
            family_id=row.family_id,
            expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            created_at=now,
        )
    )
    await db.commit()
    _set_access_cookie(response, _encode_access(row.user_id))
    _set_refresh_cookie(response, _encode_refresh(new_jti))
    return {"status": "ok"}


@router.post("/signout")
async def signout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    # Revoke every refresh-token family for the current user. Accept either an
    # access cookie or a still-valid refresh cookie so signout works even if
    # the access token has just expired.
    user_id: int | None = None
    access = request.cookies.get(ACCESS_COOKIE_NAME)
    if access:
        try:
            payload = jwt.decode(access, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") == "access":
                user_id = int(payload.get("sub"))
        except (PyJWTError, ValueError, TypeError):
            user_id = None
    if user_id is None:
        raw = request.cookies.get(REFRESH_COOKIE_NAME)
        if raw:
            try:
                payload = jwt.decode(raw, SECRET_KEY, algorithms=[ALGORITHM])
                if payload.get("type") == "refresh":
                    row = (
                        await db.execute(
                            select(RefreshToken).where(
                                RefreshToken.jti == payload.get("jti")
                            )
                        )
                    ).scalar_one_or_none()
                    if row:
                        user_id = row.user_id
            except PyJWTError:
                user_id = None

    if user_id is not None:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
            .values(revoked=True)
        )
        await db.commit()

    _clear_auth_cookies(response)
    return {"message": "Signed out"}


@router.get("/me")
async def me(
    user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = (
        await db.execute(select(User).where(User.id == user_id))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
        }
    }
