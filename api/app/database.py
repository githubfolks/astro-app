from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Default to SQLite for ease of use, but configured for PostgreSQL
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"
# SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/astroapp"
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
