import logging
import requests
from datetime import date
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

logger = logging.getLogger("lifecraft.main")

from app.config import settings
from app.database import engine, get_db, Base
from app.models import User, Attributes, Quest, CustomReward
from app.schemas import (
    UserProfileSchema,
    UserRegisterSchema,
    UserLoginSchema,
    TokenResponseSchema,
    LeaderboardEntrySchema,
    xp_required_for_level,
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
    supabase_create_user,
    supabase_authenticate_user,
)
from app.defaults import DEFAULT_QUESTS, DEFAULT_REWARDS

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


def format_user_summary(user: User) -> dict:
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


@app.get("/")
def read_root():
    return {
        "app": "LifeCraft RPG API",
        "status": "online",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": "supabase" if "supabase" in str(engine.url) else "sqlite"
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
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


# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/auth/register", response_model=TokenResponseSchema)
def register(data: UserRegisterSchema, db: Session = Depends(get_db)):
    username = data.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(data.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Player '{username}' already exists. Choose a different name or login.")

    # 1. Register in Supabase GoTrue Auth
    sb_created, sb_user_data, sb_msg = supabase_create_user(username, data.password)

    # 2. Provision local player profile
    hashed = hash_password(data.password)
    user = User(
        username=username,
        hashed_password=hashed,
        level=1,
        xp=0.0,
        coins=20,
        hearts=10.0,
        streak=1,
        last_active_date=date.today(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize Attributes
    attrs = Attributes(
        user_id=user.id,
        strength=10,
        intelligence=15,
        discipline=12,
    )
    db.add(attrs)

    # Initialize default quests
    for q in DEFAULT_QUESTS:
        quest = Quest(
            user_id=user.id,
            title=q["title"],
            type=q["type"],
            category=q["category"],
            attribute_target=q.get("attribute_target"),
            xp_reward=q["xp_reward"],
            coin_reward=q["coin_reward"],
            is_completed=False,
        )
        db.add(quest)

    # Initialize default rewards
    for r in DEFAULT_REWARDS:
        reward = CustomReward(
            user_id=user.id,
            title=r["title"],
            coin_cost=r["coin_cost"],
        )
        db.add(reward)

    db.commit()
    db.refresh(user)

    # 3. Authenticate to retrieve Supabase JWT token
    sb_auth_ok, sb_auth_data, _ = supabase_authenticate_user(username, data.password)
    if sb_auth_ok and sb_auth_data and "access_token" in sb_auth_data:
        token = sb_auth_data["access_token"]
    else:
        token = create_access_token({"sub": user.username})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_summary(user),
    }


@app.post("/api/auth/login", response_model=TokenResponseSchema)
def login(data: UserLoginSchema, db: Session = Depends(get_db)):
    username = data.username.strip()

    # 1. First authenticate with Supabase GoTrue Auth
    sb_auth_ok, sb_auth_data, sb_err = supabase_authenticate_user(username, data.password)
    if sb_auth_ok and sb_auth_data and "access_token" in sb_auth_data:
        token = sb_auth_data["access_token"]
        user = db.query(User).filter(User.username == username).first()
        if not user:
            # Auto-provision local character for Supabase user
            user = User(
                username=username,
                hashed_password=hash_password(data.password),
                level=1,
                xp=0.0,
                coins=20,
                hearts=10.0,
                streak=1,
                last_active_date=date.today(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            attrs = Attributes(user_id=user.id, strength=10, intelligence=15, discipline=12)
            db.add(attrs)
            for q in DEFAULT_QUESTS:
                db.add(Quest(user_id=user.id, is_completed=False, **q))
            for r in DEFAULT_REWARDS:
                db.add(CustomReward(user_id=user.id, **r))
            db.commit()
            db.refresh(user)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": format_user_summary(user),
        }

    # 2. Fallback to local authentication
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail=sb_err or "Invalid username or password in Supabase Auth"
        )

    # Sync to Supabase Auth in background if missing
    supabase_create_user(username, data.password)
    token = create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_summary(user),
    }


@app.get("/api/auth/me", response_model=UserProfileSchema)
def get_me(current_user: User = Depends(get_current_user)):
    return format_user_summary(current_user)


# --- SUPABASE SCORE SYNC & LEADERBOARD ---

def sync_user_score_to_supabase(username: str, score: int, level: int, streak: int):
    """Sync or update player score in Supabase 'leaderboard' table."""
    supabase_url = settings.SUPABASE_URL
    secret_key = settings.SUPABASE_SECRET_KEY
    if not supabase_url or not secret_key:
        return
    try:
        requests.post(
            f"{supabase_url}/rest/v1/leaderboard?on_conflict=username",
            headers={
                "apikey": secret_key,
                "Authorization": f"Bearer {secret_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            },
            json={
                "username": username,
                "score": score,
                "level": level,
                "streak": streak
            },
            timeout=4
        )
    except Exception as e:
        logger.debug(f"Failed to sync score to Supabase: {e}")


@app.get("/api/leaderboard", response_model=List[LeaderboardEntrySchema])
def get_leaderboard(db: Session = Depends(get_db)):
    """
    Fetch live rankings directly from Supabase 'leaderboard' table ordered by score descending.
    """
    supabase_url = settings.SUPABASE_URL
    pub_key = settings.SUPABASE_PUBLISHABLE_KEY

    # 1. Fetch from Supabase PostgreSQL table via PostgREST
    if supabase_url and pub_key:
        try:
            resp = requests.get(
                f"{supabase_url}/rest/v1/leaderboard?select=*&order=score.desc",
                headers={"apikey": pub_key},
                timeout=4
            )
            if resp.status_code == 200:
                rows = resp.json()
                if rows:
                    result = []
                    for rank, r in enumerate(rows, start=1):
                        u_local = db.query(User).filter(User.username == r["username"]).first()
                        str_val = u_local.attributes.strength if (u_local and u_local.attributes) else 10
                        int_val = u_local.attributes.intelligence if (u_local and u_local.attributes) else 10
                        dis_val = u_local.attributes.discipline if (u_local and u_local.attributes) else 10

                        result.append({
                            "rank": rank,
                            "username": r["username"],
                            "score": r["score"],
                            "level": r.get("level", 1),
                            "streak": r.get("streak", 1),
                            "xp": round(u_local.xp, 1) if u_local else 0.0,
                            "coins": u_local.coins if u_local else 0,
                            "hearts": round(u_local.hearts, 1) if u_local else 10.0,
                            "strength": str_val,
                            "intelligence": int_val,
                            "discipline": dis_val,
                        })
                    return result
        except Exception as e:
            logger.warning(f"Supabase leaderboard fetch notice ({e}), using local fallback.")

    # 2. Fallback calculation if Supabase is offline
    users = db.query(User).all()
    calculated = []
    for u in users:
        score = int((u.level * 500) + (u.xp * 5) + (u.streak * 100) + u.coins)
        calculated.append((score, u))
    calculated.sort(key=lambda x: x[0], reverse=True)

    result = []
    for rank, (score, u) in enumerate(calculated, start=1):
        str_val = u.attributes.strength if u.attributes else 10
        int_val = u.attributes.intelligence if u.attributes else 10
        dis_val = u.attributes.discipline if u.attributes else 10
        result.append({
            "rank": rank,
            "username": u.username,
            "score": score,
            "level": u.level,
            "xp": round(u.xp, 1),
            "streak": u.streak,
            "coins": u.coins,
            "hearts": round(u.hearts, 1),
            "strength": str_val,
            "intelligence": int_val,
            "discipline": dis_val,
        })
    return result


# --- GAMEPLAY & USER ENDPOINTS ---

@app.get("/api/level-info/{level}")
def get_level_info(level: int):
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
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Player '{username}' not found.")
    return format_user_summary(user)


@app.post("/api/quests/{quest_id}/toggle")
def toggle_quest(quest_id: int, db: Session = Depends(get_db)):
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    user = quest.user
    quest.is_completed = not quest.is_completed

    if quest.is_completed:
        user.xp += quest.xp_reward
        user.coins += quest.coin_reward

        # Level up logic: 100 * (level ^ 1.5)
        needed = xp_required_for_level(user.level)
        while user.xp >= needed:
            user.xp -= needed
            user.level += 1
            needed = xp_required_for_level(user.level)

        # Attribute boost
        if quest.attribute_target and user.attributes:
            target = quest.attribute_target.lower()
            if target == "strength":
                user.attributes.strength += 1
            elif target == "intelligence":
                user.attributes.intelligence += 1
            elif target == "discipline":
                user.attributes.discipline += 1
    else:
        user.xp = max(0.0, user.xp - quest.xp_reward)
        user.coins = max(0, user.coins - quest.coin_reward)

    db.commit()

    # Recalculate score and sync live to Supabase leaderboard
    score = int((user.level * 500) + (user.xp * 5) + (user.streak * 100) + user.coins)
    sync_user_score_to_supabase(user.username, score, user.level, user.streak)

    return {
        "success": True,
        "quest_id": quest.id,
        "is_completed": quest.is_completed,
        "user_level": user.level,
        "user_xp": user.xp,
        "user_coins": user.coins,
        "user_score": score
    }
