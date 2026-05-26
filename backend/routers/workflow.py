from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db
from models.workflow import Workflow
from models.user import User
from schemas.workflow import WorkflowCreate, WorkflowResponse, WorkflowUpdate
from schemas.pagination import Paginated

from routers.auth import get_current_user


router = APIRouter(tags=["Workflow"])


# Create workflow
@router.post("/workflow", response_model=WorkflowResponse)
async def create_workflow(
    workflow: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_workflow = Workflow(**workflow.model_dump(), user_id=user_id)
    new_workflow.webhook_path = new_workflow.generate_webhook_path()
    db.add(new_workflow)
    await db.commit()
    await db.refresh(new_workflow)
    return new_workflow


# Get all workflows
@router.get("/workflow", response_model=Paginated[WorkflowResponse])
async def get_all_workflows(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    total = (
        await db.execute(
            select(func.count()).select_from(Workflow).where(Workflow.user_id == user_id)
        )
    ).scalar_one()
    items = (
        (
            await db.execute(
                select(Workflow)
                .where(Workflow.user_id == user_id)
                .order_by(Workflow.id.desc())
                .offset(offset)
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return Paginated[WorkflowResponse](items=items, total=total, limit=limit, offset=offset)


# Get workflow by ID
@router.get("/workflow/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    wf = (
        await db.execute(
            select(Workflow).where(
                Workflow.id == workflow_id,
                Workflow.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


# Update workflow
@router.put("/workflow/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    db_wf = (
        await db.execute(
            select(Workflow).where(
                Workflow.id == workflow_id,
                Workflow.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if not db_wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    for key, value in workflow.model_dump(exclude_unset=True).items():
        setattr(db_wf, key, value)

    await db.commit()
    await db.refresh(db_wf)
    return db_wf


# Delete workflow
@router.delete("/workflow/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    wf = (
        await db.execute(
            select(Workflow).where(
                Workflow.id == workflow_id,
                Workflow.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    await db.delete(wf)
    await db.commit()
    return {"message": "Workflow deleted successfully"}
