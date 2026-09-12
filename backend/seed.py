#!/usr/bin/env python3
"""
Seed script for LifeCraft MVP.
Creates tables and populates user 'Anuvesh' with initial attributes, quests, and rewards.
"""
from datetime import date
from app.database import engine, SessionLocal, Base
from app.models import User, Attributes, Quest, CustomReward


def seed_database():
    print("Initializing LifeCraft database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # Check if user 'Anuvesh' already exists
        user = db.query(User).filter(User.username == "Anuvesh").first()
        if not user:
            print("Creating player profile for 'Anuvesh'...")
            user = User(
                username="Anuvesh",
                # Dummy bcrypt hash for initial seed
                hashed_password="$2b$12$e8kP0P6mQY5Y.lZ3Uj7iYeXkFz3XqVz7gK6Vq4G8L5E.2O9aT5n4i",
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

            # Create Attributes
            attributes = Attributes(
                user_id=user.id,
                strength=10,
                intelligence=15,
                discipline=12,
            )
            db.add(attributes)

            # Seed Quests
            initial_quests = [
                Quest(
                    user_id=user.id,
                    title="Implement LightGBM Model",
                    type="todo",
                    category="Coding",
                    attribute_target="intelligence",
                    xp_reward=50,
                    coin_reward=20,
                    is_completed=False,
                ),
                Quest(
                    user_id=user.id,
                    title="Complete TCET IT-D Assignment",
                    type="todo",
                    category="College",
                    attribute_target="intelligence",
                    xp_reward=30,
                    coin_reward=10,
                    is_completed=False,
                ),
                Quest(
                    user_id=user.id,
                    title="Eat Paneer & Soya Chunks for 65kg goal",
                    type="daily",
                    category="Fitness",
                    attribute_target="strength",
                    xp_reward=20,
                    coin_reward=5,
                    is_completed=False,
                ),
                Quest(
                    user_id=user.id,
                    title="1.5 Hour Gym Split",
                    type="daily",
                    category="Fitness",
                    attribute_target="strength",
                    xp_reward=40,
                    coin_reward=15,
                    is_completed=False,
                ),
            ]
            db.add_all(initial_quests)

            # Seed Custom Rewards
            initial_rewards = [
                CustomReward(
                    user_id=user.id,
                    title="1 Hour PC Gaming",
                    coin_cost=30,
                ),
                CustomReward(
                    user_id=user.id,
                    title="Buy Coffee",
                    coin_cost=15,
                ),
            ]
            db.add_all(initial_rewards)

            db.commit()
            print("Successfully seeded player 'Anuvesh' with 4 quests, attributes, and 2 custom rewards!")
        else:
            print("Player 'Anuvesh' already exists in the database. Skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
