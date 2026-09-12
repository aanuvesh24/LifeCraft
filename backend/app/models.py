from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    text
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    level = Column(Integer, default=1, nullable=False)
    xp = Column(Float, default=0.0, nullable=False)
    coins = Column(Integer, default=0, nullable=False)
    hearts = Column(Float, default=10.0, nullable=False)  # 10 hearts; 0.5 damage per missed daily
    streak = Column(Integer, default=0, nullable=False)
    last_active_date = Column(Date, nullable=True)

    # Relationships
    attributes = relationship("Attributes", back_populates="user", uselist=False, cascade="all, delete-orphan")
    quests = relationship("Quest", back_populates="user", cascade="all, delete-orphan")
    rewards = relationship("CustomReward", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.username} (Level {self.level}, {self.hearts} Hearts)>"


class Attributes(Base):
    __tablename__ = "attributes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    strength = Column(Integer, default=0, nullable=False)
    intelligence = Column(Integer, default=0, nullable=False)
    discipline = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="attributes")

    def __repr__(self):
        return f"<Attributes user_id={self.user_id} STR={self.strength} INT={self.intelligence} DIS={self.discipline}>"


class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    type = Column(String(32), nullable=False)  # 'daily' or 'todo'
    category = Column(String(64), nullable=False)  # Biome/Category e.g. 'College', 'Fitness', 'Coding'
    attribute_target = Column(String(32), nullable=True)  # 'strength', 'intelligence', 'discipline'
    xp_reward = Column(Integer, default=0, nullable=False)
    coin_reward = Column(Integer, default=0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="quests")

    def __repr__(self):
        return f"<Quest '{self.title}' [{self.type.upper()}] +{self.xp_reward}XP>"


class CustomReward(Base):
    __tablename__ = "custom_rewards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    coin_cost = Column(Integer, nullable=False)

    user = relationship("User", back_populates="rewards")

    def __repr__(self):
        return f"<CustomReward '{self.title}' ({self.coin_cost} Coins)>"
