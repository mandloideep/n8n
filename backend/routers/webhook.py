import json
import logging

from fastapi import HTTPException, Depends, APIRouter, Request
from sqlalchemy.orm import Session
from db.database import get_db
from models.workflow import Workflow
from schemas.workflow import WorkflowResponse
from executor.executor import execute_workflow
from routers.auth import get_current_user
from core.limiter import limiter
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Webhook"])


@router.api_route("/webhook/{webhook_path}", methods=["GET", "POST"])
@limiter.limit("60/minute")
async def webhook_handler_by_path(
    request: Request,
    webhook_path: str,
    db: Session = Depends(get_db),
):
    """
    Public webhook handler. Triggers a workflow by its unique 12-char path.
    Anonymous; the path itself is the secret.
    """
    workflow_data = db.query(Workflow).filter(Workflow.webhook_path == webhook_path).first()
    if not workflow_data:
        raise HTTPException(status_code=404, detail="Webhook not found")

    if not workflow_data.enabled:
        raise HTTPException(status_code=400, detail="Workflow is disabled")

    return await _execute_webhook(workflow_data, request, db)


@router.post("/webhook/test/{workflow_id}")
async def test_webhook(
    workflow_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """
    Authenticated test-mode execution. Owner-only.
    """
    workflow_data = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == user_id,
    ).first()
    if not workflow_data:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return await _execute_webhook(workflow_data, request, db, test_mode=True)


async def _execute_webhook(
    workflow_data: Workflow,
    request: Request,
    db: Session,
    test_mode: bool = False,
):
    body = {}
    query_params = dict(request.query_params)

    if request.method == "POST":
        try:
            body = await request.json()
        except (json.JSONDecodeError, ValueError):
            body = {}

    initial_context = {
        "webhook": {
            "method": request.method,
            "body": body,
            "query": query_params,
            "headers": dict(request.headers),
            "path": str(request.url.path),
        },
        "test_mode": test_mode,
    }

    workflow_schema = WorkflowResponse.model_validate(workflow_data)

    execution_start = datetime.now(timezone.utc)

    try:
        result = await execute_workflow(workflow_schema, db, initial_context)

        workflow_data.last_executed_at = datetime.now(timezone.utc)
        db.commit()

        execution_end = datetime.now(timezone.utc)
        execution_time_ms = (execution_end - execution_start).total_seconds() * 1000

        return {
            "workflow_id": workflow_data.id,
            "webhook_path": workflow_data.webhook_path,
            "status": "success",
            "test_mode": test_mode,
            "execution_time_ms": round(execution_time_ms, 2),
            "result": result,
        }

    except Exception:
        execution_end = datetime.now(timezone.utc)
        execution_time_ms = (execution_end - execution_start).total_seconds() * 1000

        logger.exception(
            "workflow_execution_failed",
            extra={
                "workflow_id": workflow_data.id,
                "test_mode": test_mode,
                "execution_time_ms": round(execution_time_ms, 2),
            },
        )

        raise HTTPException(
            status_code=500,
            detail={
                "workflow_id": workflow_data.id,
                "status": "failed",
                "test_mode": test_mode,
                "execution_time_ms": round(execution_time_ms, 2),
                "error": "Workflow execution failed",
            },
        )
