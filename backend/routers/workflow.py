from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from db.database import get_db
from models.workflow import Workflow
from models.user import User
from schemas.workflow import WorkflowCreate, WorkflowResponse, WorkflowUpdate
from schemas.pagination import Paginated

from routers.auth import get_current_user


router = APIRouter(tags=["Workflow"])

# Create workflow
@router.post("/workflow", response_model=WorkflowResponse)
def create_workflow(
    workflow: WorkflowCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_workflow = Workflow(**workflow.model_dump(), user_id=user_id)
    new_workflow.webhook_path = new_workflow.generate_webhook_path()
    db.add(new_workflow)
    db.commit()
    db.refresh(new_workflow)
    return new_workflow


# Get all workflows
@router.get("/workflow", response_model=Paginated[WorkflowResponse])
def get_all_workflows(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    base = db.query(Workflow).filter(Workflow.user_id == user_id)
    total = base.count()
    items = base.order_by(Workflow.id.desc()).offset(offset).limit(limit).all()
    return Paginated[WorkflowResponse](items=items, total=total, limit=limit, offset=offset)


# Get workflow by ID
@router.get("/workflow/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    wf = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == user_id,
    ).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


# Update workflow
@router.put("/workflow/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: int,
    workflow: WorkflowUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    db_wf = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == user_id,
    ).first()
    if not db_wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    for key, value in workflow.model_dump(exclude_unset=True).items():
        setattr(db_wf, key, value)

    db.commit()
    db.refresh(db_wf)
    return db_wf


# Delete workflow
@router.delete("/workflow/{workflow_id}")
def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    wf = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == user_id,
    ).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    db.delete(wf)
    db.commit()
    return {"message": "Workflow deleted successfully"}
