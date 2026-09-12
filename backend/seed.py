#!/usr/bin/env python3
"""
Seed script for LifeCraft MVP.
Creates tables and populates user 'Anuvesh' with initial attributes, quests, and rewards.
Also seeds rival players for the Leaderboard.
"""
from datetime import date
from app.database import engine, SessionLocal, Base
from app.models import User, Attributes, Quest, CustomReward
from app.auth import hash_password
from app.defaults import DEFAULT_QUESTS, DEFAULT_REWARDS


def seed_database():
    print("Initializing LifeCraft database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # Check if user 'Anuvesh' already exists
        user = db.query(User).filter(User.username == "Anuvesh").first()
        anuvesh_password = hash_password("RMbCDEYr92Q8VGbc")

        if not user:
            print("Creating player profile for 'Anuvesh'...")
            user = User(
                username="Anuvesh",
                hashed_password=anuvesh_password,
                level=2,
                xp=85.0,
                coins=45,
                hearts=10.0,
                streak=1,
                last_active_date=date.today(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Create Attributes
            attributes = Attributes(
                user_id=user.id,
                strength=12,
                intelligence=18,
                discipline=15,
            )
            db.add(attributes)

            # Seed Quests
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

            # Seed Rewards
            for r in DEFAULT_REWARDS:
                reward = CustomReward(
                    user_id=user.id,
                    title=r["title"],
                    coin_cost=r["coin_cost"],
                )
                db.add(reward)

            db.commit()
            print("Successfully seeded player 'Anuvesh' with 13 study & fitness quests, attributes, and rewards!")
        else:
            # Update password to match provided password
            user.hashed_password = anuvesh_password
            db.commit()
            print("Updated player 'Anuvesh' password to match project credentials.")

        # Seed Leaderboard rivals if they don't exist
        rivals = [
            {
                "username": "TechnoBlade",
                "level": 6,
                "xp": 340.0,
                "coins": 280,
                "hearts": 10.0,
                "streak": 18,
                "strength": 28,
                "intelligence": 22,
                "discipline": 30,
            },
            {
                "username": "Alex_Valkyrie",
                "level": 4,
                "xp": 175.0,
                "coins": 90,
                "hearts": 9.5,
                "streak": 8,
                "strength": 16,
                "intelligence": 19,
                "discipline": 16,
            },
            {
                "username": "Steve_Crafter",
                "level": 3,
                "xp": 60.0,
                "coins": 40,
                "hearts": 8.0,
                "streak": 3,
                "strength": 14,
                "intelligence": 13,
                "discipline": 11,
            },
            {
                "username": "EnderScholar",
                "level": 1,
                "xp": 25.0,
                "coins": 15,
                "hearts": 10.0,
                "streak": 2,
                "strength": 10,
                "intelligence": 16,
                "discipline": 12,
            },
        ]

        for riv in rivals:
            existing = db.query(User).filter(User.username == riv["username"]).first()
            if not existing:
                u = User(
                    username=riv["username"],
                    hashed_password=hash_password("rival_pass_123"),
                    level=riv["level"],
                    xp=riv["xp"],
                    coins=riv["coins"],
                    hearts=riv["hearts"],
                    streak=riv["streak"],
                    last_active_date=date.today(),
                )
                db.add(u)
                db.commit()
                db.refresh(u)

                attr = Attributes(
                    user_id=u.id,
                    strength=riv["strength"],
                    intelligence=riv["intelligence"],
                    discipline=riv["discipline"],
                )
                db.add(attr)
                db.commit()

        print("Leaderboard rival players checked and seeded.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
