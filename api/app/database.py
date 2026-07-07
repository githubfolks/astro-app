from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Determine environment: 'development' (default) or 'production'
app_env = os.getenv("APP_ENV", "development")
env_file = f".env.{app_env}"

# Load the specific env file
# override=False (default) ensures that system environment variables (like from Docker) 
# take precedence over values in the .env file.
load_dotenv(env_file)

# Configured for PostgreSQL
# Use environment variable for Docker/Production, fallback to localhost for local dev
SQLALCHEMY_DATABASE_URL = os.getenv(
    "SQLALCHEMY_DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/app_db?options=-csearch_path%3Daadikarta_db"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Validate pooled connections before use so the first request after a DB
    # restart or idle-timeout doesn't fail on a stale connection.
    pool_pre_ping=True,
    pool_recycle=1800,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
