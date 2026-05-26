from typing import Dict

from pydantic import BaseModel, ConfigDict, field_validator

from schemas.platform import PlatformType
from schema_cred_data.email_cred_val import EmailCredential
from schema_cred_data.tele_cred_val import TelegramCredential


class CredentialBase(BaseModel):
    title: str
    platform: PlatformType


class CredentialCreate(CredentialBase):
    """Inbound payload — `data` is validated per platform and stays a plain dict here.
    Encryption happens in the route handler before persisting.
    """

    data: Dict

    @field_validator("data")
    @classmethod
    def validate_data(cls, v, info):
        platform = info.data.get("platform")

        if platform == PlatformType.TELEGRAM:
            return TelegramCredential(**v).model_dump()
        if platform == PlatformType.EMAIL:
            return EmailCredential(**v).model_dump()
        if platform == PlatformType.SLACK:
            return v
        raise ValueError("Unsupported platform")


class CredentialResponse(CredentialBase):
    """Outbound shape — `data` is the decrypted dict, populated by the route handler."""

    id: int
    user_id: int
    data: Dict

    model_config = ConfigDict(from_attributes=True)
