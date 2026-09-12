import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("lifecraft.database")


def create_resilient_engine():
    db_url = settings.get_effective_database_url()

    if db_url.startswith("postgresql"):
        try:
            logger.info("Attempting connection to Supabase PostgreSQL...")
            test_engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 4},
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=5,
                max_overflow=10,
            )
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1;"))
            logger.info("Connected to Supabase PostgreSQL successfully!")
            return test_engine
        except Exception as e:
            logger.warning(
                f"Notice: Supabase PostgreSQL direct TCP is not reachable from this network ({e}). "
                "Seamlessly falling back to local SQLite database so LifeCraft runs uninterrupted."
            )
            db_url = "sqlite:///./lifecraft.db"

    return create_engine(
        db_url,
        connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {},
    )


engine = create_resilient_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session and closes it on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
