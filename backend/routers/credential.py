from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

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
def get_all_credentials(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    base = db.query(Credentials).filter(Credentials.user_id == user_id)
    total = base.count()
    rows = base.order_by(Credentials.id.desc()).offset(offset).limit(limit).all()
    return Paginated[CredentialResponse](
        items=[_to_response(c) for c in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/credential/{cred_id}", response_model=CredentialResponse)
def get_credential(
    cred_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    cred = db.query(Credentials).filter(
        Credentials.id == cred_id,
        Credentials.user_id == user_id,
    ).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credentials not found")
    return _to_response(cred)


@router.post("/credential", response_model=CredentialResponse)
def create_credential(
    cred: CredentialCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    new_cred = Credentials(
        title=cred.title,
        platform=cred.platform,
        data=encrypt_dict(cred.data),
        user_id=user_id,
    )
    db.add(new_cred)
    db.commit()
    db.refresh(new_cred)
    return _to_response(new_cred)


@router.delete("/credential/{cred_id}")
def delete_credential(
    cred_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    cred = db.query(Credentials).filter(
        Credentials.id == cred_id,
        Credentials.user_id == user_id,
    ).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credentials not found")
    db.delete(cred)
    db.commit()
    return {"message": "Credentials Deleted"}
