#!/usr/bin/env python3
"""
Supabase Migration & Sync Script for LifeCraft.
Usage:
    python sync_to_supabase.py --ref <YOUR_20_CHAR_PROJECT_REF>
    or set SUPABASE_PROJECT_REF in backend/.env and run:
    python sync_to_supabase.py
"""
import sys
import argparse
from sqlalchemy import create_engine
from app.config import settings
from app.database import Base, SessionLocal
from app.models import User, Attributes, Quest, CustomReward
from sqlalchemy.orm import sessionmaker


def sync(project_ref: str = None):
    ref = project_ref or settings.SUPABASE_PROJECT_REF
    if not ref or not ref.strip():
        print("ERROR: Supabase Project Reference is missing.")
        print("Provide it via argument: python sync_to_supabase.py --ref <YOUR_PROJECT_REF>")
        print("Or set SUPABASE_PROJECT_REF=<YOUR_PROJECT_REF> in backend/.env")
        print("\nNote: You can find your 20-character Project Reference in your Supabase dashboard URL:")
        print("https://supabase.com/dashboard/project/<PROJECT_REF>")
        sys.exit(1)

    ref = ref.strip()
    supabase_db_url = settings.get_effective_database_url()

    print(f"Connecting to Supabase PostgreSQL ({supabase_db_url.split('@')[1] if '@' in supabase_db_url else supabase_db_url})...")
    try:
        remote_engine = create_engine(supabase_db_url, connect_args={"connect_timeout": 10})
        # Test connection
        with remote_engine.connect() as conn:
            print("Successfully connected to Supabase PostgreSQL!")

        print("Creating all LifeCraft tables in Supabase...")
        Base.metadata.create_all(bind=remote_engine)
        print("Tables created.")

        RemoteSession = sessionmaker(bind=remote_engine)
        remote_db = RemoteSession()
        local_db = SessionLocal()

        print("Migrating local users, attributes, quests, and rewards to Supabase...")
        local_users = local_db.query(User).all()
        for u in local_users:
            existing = remote_db.query(User).filter(User.username == u.username).first()
            if not existing:
                new_u = User(
                    username=u.username,
                    hashed_password=u.hashed_password,
                    level=u.level,
                    xp=u.xp,
                    coins=u.coins,
                    hearts=u.hearts,
                    streak=u.streak,
                    last_active_date=u.last_active_date,
                )
                remote_db.add(new_u)
                remote_db.commit()
                remote_db.refresh(new_u)

                if u.attributes:
                    new_attr = Attributes(
                        user_id=new_u.id,
                        strength=u.attributes.strength,
                        intelligence=u.attributes.intelligence,
                        discipline=u.attributes.discipline,
                    )
                    remote_db.add(new_attr)

                for q in u.quests:
                    new_q = Quest(
                        user_id=new_u.id,
                        title=q.title,
                        type=q.type,
                        category=q.category,
                        attribute_target=q.attribute_target,
                        xp_reward=q.xp_reward,
                        coin_reward=q.coin_reward,
                        is_completed=q.is_completed,
                    )
                    remote_db.add(new_q)

                for r in u.rewards:
                    new_r = CustomReward(
                        user_id=new_u.id,
                        title=r.title,
                        coin_cost=r.coin_cost,
                    )
                    remote_db.add(new_r)

                remote_db.commit()
                print(f"  + Migrated player: {u.username}")

        print("\nAll data successfully synced to Supabase!")
        print(f"Update backend/.env with SUPABASE_PROJECT_REF={ref} to make it the active database.")

    except Exception as e:
        print(f"\nFailed to connect to Supabase PostgreSQL: {e}")
        print("Check that:")
        print("1. Your database password is correct (current: RMbCDEYr92Q8VGbc)")
        print(f"2. Your project reference is correct (provided: {ref})")
        print("3. Your Supabase project is active and not paused in the dashboard.")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync LifeCraft database to Supabase")
    parser.add_argument("--ref", type=str, help="Supabase 20-character Project Reference")
    args = parser.parse_args()
    sync(args.ref)
