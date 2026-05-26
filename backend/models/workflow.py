from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
from datetime import datetime, timezone
import uuid


def _utcnow():
    return datetime.now(timezone.utc)


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    nodes = Column(JSON, nullable=True)
    connections = Column(JSON, nullable=True)
    webhook_path = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    last_executed_at = Column(DateTime, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="workflows")

    def generate_webhook_path(self):
        """Generate a unique webhook path for this workflow"""
        return f"{uuid.uuid4().hex[:12]}"
