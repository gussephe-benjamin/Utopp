from sqlalchemy import BigInteger, Integer
from sqlalchemy.orm import DeclarativeBase

# PostgreSQL: BIGINT identity; SQLite solo aplicará autoincrement a INTEGER PRIMARY KEY.
BIGINT_PK = BigInteger().with_variant(Integer, "sqlite")


class Base(DeclarativeBase):
    pass
