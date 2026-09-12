from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


def xp_required_for_level(level: int) -> float:
    """Non-linear leveling formula: XP_required = 100 * (Level ^ 1.5)"""
    return round(100.0 * (level ** 1.5), 2)


class AttributeSchema(BaseModel):
    id: int
    strength: int
    intelligence: int
    discipline: int

    model_config = ConfigDict(from_attributes=True)


class QuestBase(BaseModel):
    title: str
    type: str  # 'daily' or 'todo'
    category: str
    attribute_target: Optional[str] = None
    xp_reward: int
    coin_reward: int


class QuestSchema(QuestBase):
    id: int
    user_id: int
    is_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomRewardSchema(BaseModel):
    id: int
    user_id: int
    title: str
    coin_cost: int

    model_config = ConfigDict(from_attributes=True)


class UserProfileSchema(BaseModel):
    id: int
    username: str
    level: int
    xp: float
    next_level_xp: float
    coins: int
    hearts: float
    streak: int
    last_active_date: Optional[date] = None
    attributes: Optional[AttributeSchema] = None
    quests: List[QuestSchema] = []
    rewards: List[CustomRewardSchema] = []

    model_config = ConfigDict(from_attributes=True)
