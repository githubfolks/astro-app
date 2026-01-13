from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Determine environment: 'development' (default) or 'production'
app_env = os.getenv("APP_ENV", "development")
env_file = f".env.{app_env}"

# Load the specific env file (override=True so it takes precedence over .env if both exist)
load_dotenv(env_file, override=True)

# Configured for PostgreSQL
# Use environment variable for Docker/Production, fallback to localhost for local dev
SQLALCHEMY_DATABASE_URL = os.getenv(
    "SQLALCHEMY_DATABASE_URL", 
    "postgresql://admin:password123@localhost:5432/postgres?options=-csearch_path%3Dastroapp"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
