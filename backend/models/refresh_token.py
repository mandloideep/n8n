from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from db.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    jti = Column(String(64), primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    family_id = Column(String(64), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    replaced_by = Column(String(64), nullable=True)
    revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
