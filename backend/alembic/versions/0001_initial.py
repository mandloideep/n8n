"""initial schema

Bootstrap migration. Creates the four original tables (users, workflows,
credentials, executions) by emitting CREATE TABLE for *just those* tables —
not every model registered on Base.metadata. Without that filter, any model
added in a later migration (e.g. refresh_tokens in 0002) would also be
created here and collide with its own migration.

Revision ID: 0001
Revises:
Create Date: 2026-05-25
"""

from typing import Sequence, Union

from alembic import op

from db.database import Base
import models.user  # noqa: F401
import models.workflow  # noqa: F401
import models.credentials  # noqa: F401
import models.execution  # noqa: F401

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Pin this migration to the tables it was ORIGINALLY supposed to create.
# New tables in later migrations must NOT appear here.
_INITIAL_TABLES = ("users", "workflows", "credentials", "executions")


def upgrade() -> None:
    bind = op.get_bind()
    tables = [Base.metadata.tables[name] for name in _INITIAL_TABLES]
    Base.metadata.create_all(bind=bind, tables=tables)


def downgrade() -> None:
    bind = op.get_bind()
    tables = [Base.metadata.tables[name] for name in _INITIAL_TABLES]
    Base.metadata.drop_all(bind=bind, tables=tables)
