from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, get_db, Base
from app.models import User, Attributes, Quest, CustomReward
from app.schemas import UserProfileSchema, xp_required_for_level

# Ensure tables exist on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LifeCraft RPG API",
    description="Real-life productivity RPG backend inspired by Minecraft 8-bit mechanics",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "app": "LifeCraft RPG API",
        "status": "online",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    # Test DB connectivity
    try:
        user_count = db.query(User).count()
        return {
            "status": "healthy",
            "database": "connected",
            "users_count": user_count,
            "engine": str(engine.url).split("@")[-1] if "@" in str(engine.url) else str(engine.url)
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database_error": str(e)
        }


@app.get("/api/level-info/{level}")
def get_level_info(level: int):
    """Returns XP required to advance from the specified level."""
    if level < 1:
        raise HTTPException(status_code=400, detail="Level must be >= 1")
    xp_needed = xp_required_for_level(level)
    return {
        "level": level,
        "xp_required_for_next": xp_needed,
        "formula": "100 * (level ^ 1.5)"
    }


@app.get("/api/users/{username}/summary", response_model=UserProfileSchema)
def get_user_summary(username: str, db: Session = Depends(get_db)):
    """Fetch user profile with stats, quests, and rewards."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found. Run seed.py first.")

    next_xp = xp_required_for_level(user.level)
    return {
        "id": user.id,
        "username": user.username,
        "level": user.level,
        "xp": user.xp,
        "next_level_xp": next_xp,
        "coins": user.coins,
        "hearts": user.hearts,
        "streak": user.streak,
        "last_active_date": user.last_active_date,
        "attributes": user.attributes,
        "quests": user.quests,
        "rewards": user.rewards,
    }
