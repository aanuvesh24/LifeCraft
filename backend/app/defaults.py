"""
Default templates for initial quests and rewards when registering or seeding players.
"""

DEFAULT_QUESTS = [
    # Study & Academia
    {
        "title": "2 Hours Deep Work: Core DSA & Machine Learning",
        "type": "daily",
        "category": "Study",
        "attribute_target": "intelligence",
        "xp_reward": 45,
        "coin_reward": 15,
    },
    {
        "title": "Solve 1 Medium LeetCode / Algorithmic Problem",
        "type": "daily",
        "category": "Coding",
        "attribute_target": "intelligence",
        "xp_reward": 35,
        "coin_reward": 15,
    },
    {
        "title": "30 Mins Active Recall & TCET Lecture Revision",
        "type": "daily",
        "category": "College",
        "attribute_target": "discipline",
        "xp_reward": 25,
        "coin_reward": 10,
    },
    {
        "title": "Implement LightGBM Model & Feature Engineering",
        "type": "todo",
        "category": "Coding",
        "attribute_target": "intelligence",
        "xp_reward": 50,
        "coin_reward": 20,
    },
    {
        "title": "Complete TCET IT-D Assignment & Lab Journal",
        "type": "todo",
        "category": "College",
        "attribute_target": "discipline",
        "xp_reward": 35,
        "coin_reward": 15,
    },
    {
        "title": "Read & Annotate 1 ML Research Paper or System Design Chapter",
        "type": "todo",
        "category": "Study",
        "attribute_target": "intelligence",
        "xp_reward": 40,
        "coin_reward": 15,
    },
    # Physique & Fitness
    {
        "title": "1.5 Hour Heavy Gym Split (Push / Pull / Legs)",
        "type": "daily",
        "category": "Fitness",
        "attribute_target": "strength",
        "xp_reward": 40,
        "coin_reward": 15,
    },
    {
        "title": "100 Pushups + 50 Pullups + 100 Squats (Recorded Split)",
        "type": "daily",
        "category": "Fitness",
        "attribute_target": "strength",
        "xp_reward": 35,
        "coin_reward": 10,
    },
    {
        "title": "Hit 140g Daily Protein & 3.5 Liters Water Hydration",
        "type": "daily",
        "category": "Fitness",
        "attribute_target": "discipline",
        "xp_reward": 30,
        "coin_reward": 10,
    },
    {
        "title": "Morning 15-Minute Core & Posture Mobility Routine",
        "type": "daily",
        "category": "Fitness",
        "attribute_target": "discipline",
        "xp_reward": 20,
        "coin_reward": 10,
    },
    {
        "title": "Hit Weekly Target Body Weight Progress (Target: 65kg)",
        "type": "todo",
        "category": "Fitness",
        "attribute_target": "discipline",
        "xp_reward": 60,
        "coin_reward": 25,
    },
    {
        "title": "5km Outdoor Stamina Run & VO2 Max Endurance",
        "type": "todo",
        "category": "Fitness",
        "attribute_target": "strength",
        "xp_reward": 45,
        "coin_reward": 20,
    },
    {
        "title": "Clean Meal Prep: High Protein Buttermilk, Paneer & Eggs",
        "type": "todo",
        "category": "Fitness",
        "attribute_target": "discipline",
        "xp_reward": 30,
        "coin_reward": 15,
    },
]

DEFAULT_REWARDS = [
    {"title": "1 Hour Minecraft Hypixel Skyblock / Free Gaming", "coin_cost": 50},
    {"title": "Favorite Cheat Meal / Post-Workout Protein Smoothie", "coin_cost": 75},
    {"title": "Buy 1 New Mechanical Keyboard Keycap or Gaming Gear", "coin_cost": 250},
]
