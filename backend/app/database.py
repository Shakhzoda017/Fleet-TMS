import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# In production, set DATABASE_URL to a Postgres connection string
# (e.g. postgresql+psycopg2://user:pass@host/dbname). Falls back to a local
# SQLite file for development so nothing extra is required to run this
# locally.
DB_PATH = Path(__file__).resolve().parent.parent / "tms.db"
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL") or f"sqlite:///{DB_PATH}"

# Some providers (Neon, old-style Heroku URLs) hand out "postgres://",
# which SQLAlchemy's psycopg2 dialect doesn't accept - normalize it.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
