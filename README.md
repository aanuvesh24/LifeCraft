# LifeCraft RPG

LifeCraft is a real-life productivity RPG application inspired by Minecraft 8-bit mechanics. It gamifies daily tasks and habits, allowing users to level up, gain experience, and earn custom rewards.

## Project Structure

This repository is divided into two main parts:

- **`backend/`**: A FastAPI-based Python application that handles the game logic, user profiles, attributes, quests, and rewards. It uses SQLAlchemy for database interactions (SQLite by default).
- **`frontend/`**: A React application built with Vite, Tailwind CSS, and Framer Motion. It provides the user interface for tracking quests, viewing stats, and interacting with the RPG mechanics.

## Architecture & Tech Stack

### Backend
- **Framework:** FastAPI
- **Database:** SQLite (via SQLAlchemy)
- **Core Entities:** `User`, `Attributes` (Strength, Intelligence, Discipline), `Quest` (Daily or Todo), `CustomReward`.
- **Features:** XP & Leveling system, Health/Hearts (penalties for missed dailies), and streak tracking.

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion, Canvas Confetti
- **Icons:** Lucide React

## Getting Started

To get the project running locally, you will need to start both the backend and frontend development servers.

### 1. Start the Backend
Navigate to the `backend/` directory, set up a virtual environment, install dependencies, and run the FastAPI server.
(See `backend/README.md` for detailed instructions).

### 2. Start the Frontend
Navigate to the `frontend/` directory, install Node dependencies, and start the Vite development server.
(See `frontend/README.md` for detailed instructions).
