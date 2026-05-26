import asyncio
import logging
import smtplib
from collections import defaultdict, deque
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy import select
from sqlalchemy.orm import Session
from telegram import Bot

from db.encryption import decrypt_dict
from models.credentials import Credentials
from schema_cred_data.email_cred_val import EmailCredential
from schema_cred_data.tele_cred_val import TelegramCredential
from schemas.workflow import WorkflowResponse

logger = logging.getLogger(__name__)


# -------- Node Implementations -------- #

async def trigger_node(node_data: dict, context: dict, db: Session = None):
    logger.info("trigger_node_activated", extra={"node_data": node_data})
    return {"triggered": True}


def _load_credentials(db: Session, cred_id: int) -> dict:
    stmt = select(Credentials).where(Credentials.id == cred_id)
    result = db.execute(stmt).scalars().first()
    if not result:
        raise ValueError("Credential not found")
    return decrypt_dict(result.data)


def get_email_credentials(db: Session, cred_id: int) -> EmailCredential:
    return EmailCredential(**_load_credentials(db, cred_id))


def get_telegram_credentials(db: Session, cred_id: int) -> TelegramCredential:
    return TelegramCredential(**_load_credentials(db, cred_id))


async def email_node(node_data: dict, context: dict, db: Session):
    credential_id = node_data.get("credential_id")
    if not credential_id:
        raise ValueError("credential_id is required for email node")

    creds = get_email_credentials(db, credential_id)

    from_email = creds.from_email
    app_password = creds.app_password
    to_email = node_data.get("to_email")
    subject = node_data.get("subject", "No Subject")
    message = node_data.get("body", "")

    def _send_email():
        msg = MIMEMultipart()
        msg["From"] = from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(message, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        try:
            server.starttls()
            server.login(from_email, app_password)
            server.sendmail(from_email, to_email, msg.as_string())
        finally:
            server.quit()

    try:
        await asyncio.to_thread(_send_email)
        logger.info("email_sent", extra={"to": to_email})
        return {"email_status": "sent", "to": to_email}
    except Exception:
        logger.exception("email_send_failed", extra={"to": to_email})
        return {"email_status": "failed"}


async def telegram_node(node_data: dict, context: dict, db: Session):
    credential_id = node_data.get("credential_id")
    if not credential_id:
        raise ValueError("credential_id is required for telegram node")

    creds = get_telegram_credentials(db, credential_id)

    raw_chat = node_data.get("chat_id")
    try:
        chat_id = int(raw_chat) if raw_chat is not None else None
    except (TypeError, ValueError):
        raise ValueError("chat_id must be an integer")
    if chat_id is None:
        raise ValueError("chat_id is required for telegram node")

    message = node_data.get("message", "")

    try:
        bot = Bot(token=creds.access_token)
        await bot.send_message(chat_id=chat_id, text=message)
        logger.info("telegram_sent", extra={"chat_id": chat_id})
        return {"telegram_status": "sent", "chat_id": chat_id}
    except Exception:
        logger.exception("telegram_send_failed", extra={"chat_id": chat_id})
        return {"telegram_status": "failed"}


# -------- Workflow Executor -------- #

async def execute_workflow(workflow_data: WorkflowResponse, db: Session, initial_context: dict = None):
    node_map = {
        "trigger": trigger_node,
        "email": email_node,
        "telegram": telegram_node,
    }

    if not workflow_data.nodes:
        return {"status": "completed", "message": "No nodes to execute"}

    nodes = {node.id: node for node in workflow_data.nodes}
    connections = workflow_data.connections or []

    graph = defaultdict(list)
    in_degree = {node.id: 0 for node in workflow_data.nodes}

    for conn in connections:
        graph[conn.source].append(conn.target)
        in_degree[conn.target] += 1

    queue = deque([nid for nid, deg in in_degree.items() if deg == 0])

    if not queue:
        raise ValueError("No start node found (check workflow connections)")

    context = initial_context.copy() if initial_context else {}
    executed_nodes = []

    while queue:
        node_id = queue.popleft()
        node = nodes[node_id]

        node_type = node.platform
        node_data = dict(node.data) if node.data else {}

        if getattr(node, "credential_id", None):
            node_data["credential_id"] = node.credential_id

        logger.info("node_executing", extra={"node_id": node_id, "platform": node_type})

        handler = node_map.get(node_type)
        if not handler:
            logger.warning("node_no_handler", extra={"platform": node_type})
            executed_nodes.append({"id": node_id, "name": node.name, "status": "skipped"})
            continue

        try:
            result = await handler(node_data, context, db)
            context.update(result or {})
            executed_nodes.append({"id": node_id, "name": node.name, "status": "success"})
        except Exception as e:
            logger.exception("node_execution_failed", extra={"node_id": node_id, "node_name": node.name})
            executed_nodes.append({
                "id": node_id,
                "name": node.name,
                "status": "error",
                "error": str(e),
            })
            # Continue to downstream nodes — caller can inspect executed_nodes for failures.

        for neighbor in graph[node_id]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return {
        "status": "completed",
        "executed_nodes": executed_nodes,
        "context": {k: v for k, v in context.items() if k != "webhook"},
    }
