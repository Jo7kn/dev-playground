from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.yvoazekjcbjoumbfuclq:l4AXedZFe8t40NtA@aws-1-eu-central-1.pooler.supabase.com:6543/postgres")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    api_key = Column(String(255), unique=True, index=True)
    name = Column(String(100))
    password_hash = Column(String(255), nullable=True)

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    reply = Column(Text)
    intent = Column(String(50), default="unknown")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Ensure schema includes password_hash for existing deployments.
inspector = inspect(engine)
if "users" in inspector.get_table_names():
    cols = [c["name"] for c in inspector.get_columns("users")]
    if "password_hash" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

__all__ = ['get_db', 'SessionLocal', 'User', 'Conversation', 'engine', 'Base']
