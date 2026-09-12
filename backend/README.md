# LifeCraft RPG - Backend

This is the FastAPI backend for LifeCraft RPG. It manages the core game logic, user data, experience points, attributes, quests, and rewards.

## Tech Stack
- **Framework:** FastAPI
- **Database:** SQLite with SQLAlchemy ORM
- **Python Version:** 3.8+ recommended

## Core Endpoints
- `GET /` - Root status
- `GET /api/health` - API and Database health check
- `GET /api/level-info/{level}` - Get XP required for a specific level
- `GET /api/users/{username}/summary` - Fetch full user profile (stats, quests, rewards)

## Setup & Running Locally

1. **Create a Virtual Environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and adjust the variables if necessary.

4. **Seed the Database (Optional but recommended):**
   ```bash
   python seed.py
   ```
   *Note: This will populate the database with a test user and initial quests/rewards.*

5. **Start the Server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`. You can view the interactive API documentation (Swagger UI) at `http://localhost:8000/docs`.
