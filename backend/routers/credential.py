from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from db.encryption import encrypt_dict, decrypt_dict
from models.credentials import Credentials
from schemas.credentials import CredentialCreate, CredentialResponse
from schemas.pagination import Paginated
from routers.auth import get_current_user

router = APIRouter(tags=["Credential"])


def _to_response(cred: Credentials) -> CredentialResponse:
    return CredentialResponse(
        id=cred.id,
        user_id=cred.user_id,
        title=cred.title,
        platform=cred.platform,
        data=decrypt_dict(cred.data),
    )


@router.get("/credential", response_model=Paginated[CredentialResponse])
async def get_all_credentials(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    total = (
        await db.execute(
            select(func.count()).select_from(Credentials).where(Credentials.user_id == user_id)
        )
    ).scalar_one()
    rows = (
        (
            await db.execute(
                select(Credentials)
                .where(Credentials.user_id == user_id)
                .order_by(Credentials.id.desc())
                .offset(offset)
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return Paginated[CredentialResponse](
        items=[_to_response(c) for c in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/credential/{cred_id}", response_model=CredentialResponse)
async def get_credential(
    cred_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    cred = (
        await db.execute(
            select(Credentials).where(
                Credentials.id == cred_id,
                Credentials.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credentials not found")
    return _to_response(cred)


@router.post("/credential", response_model=CredentialResponse)
async def create_credential(
    cred: CredentialCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    new_cred = Credentials(
        title=cred.title,
        platform=cred.platform,
        data=encrypt_dict(cred.data),
        user_id=user_id,
    )
    db.add(new_cred)
    await db.commit()
    await db.refresh(new_cred)
    return _to_response(new_cred)


@router.delete("/credential/{cred_id}")
async def delete_credential(
    cred_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    cred = (
        await db.execute(
            select(Credentials).where(
                Credentials.id == cred_id,
                Credentials.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credentials not found")
    await db.delete(cred)
    await db.commit()
    return {"message": "Credentials Deleted"}
