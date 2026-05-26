from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from jwt import PyJWTError
from sqlalchemy.orm import Session

from core.config import settings
from core.limiter import limiter
from db.database import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, UserResponse

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
COOKIE_NAME = "access_token"
_IS_PROD = settings.ENV == "production"

_password_hasher = PasswordHasher()
router = APIRouter(tags=["Auth"])


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        _password_hasher.verify(hashed_password, plain_password)
        return True
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=_IS_PROD,
        samesite="strict",
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


def get_current_user(request: Request) -> int:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(sub)
    except (PyJWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/signup", response_model=UserResponse)
@limiter.limit("3/hour")
def signup(request: Request, response: Response, user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_pwd = hash_password(user.password)
    new_user = User(email=user.email, password=hashed_pwd, name=user.name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id)})
    _set_auth_cookie(response, token)

    return {
        "user": {
            "id": new_user.id,
            "email": new_user.email,
        }
    }


@router.post("/signin")
@limiter.limit("5/minute")
def signin(request: Request, response: Response, user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(data={"sub": str(db_user.id)})
    _set_auth_cookie(response, token)

    return {
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
        }
    }


@router.post("/signout")
def signout(response: Response):
    _clear_auth_cookie(response)
    return {"message": "Signed out"}


@router.get("/me")
def me(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
        }
    }
