import os
import logging
import time
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy import event
from sqlalchemy.orm import sessionmaker

_backend_root = Path(__file__).resolve().parents[2]
_repo_root = Path(__file__).resolve().parents[3]
for _env_path in (_repo_root / ".env", _backend_root / ".env"):
    if _env_path.exists():
        load_dotenv(_env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida")

logger = logging.getLogger("utopp.db")
_slow_query_ms = int(os.getenv("SLOW_QUERY_MS", "250"))

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "40")),
    pool_timeout=int(os.getenv("DB_POOL_TIMEOUT", "30")),
    pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),
)


@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.perf_counter()


@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    started_at = getattr(context, "_query_start_time", None)
    if started_at is None:
        return
    elapsed_ms = (time.perf_counter() - started_at) * 1000
    if elapsed_ms >= _slow_query_ms:
        logger.warning(
            "slow_query elapsed_ms=%.2f rowcount=%s statement=%s",
            elapsed_ms,
            cursor.rowcount,
            statement.replace("\n", " ")[:400],
        )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
