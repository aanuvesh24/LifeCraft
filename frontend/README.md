# LifeCraft RPG - Frontend

This is the React frontend for LifeCraft RPG, built with Vite and Tailwind CSS. It provides the user interface for tracking productivity, managing quests, and viewing RPG character stats.

## Tech Stack
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion, Canvas Confetti
- **Icons:** Lucide React

## Features
- **Dashboard:** View character level, XP progress, and current health/hearts.
- **Quest Tracking:** Manage daily tasks and one-off todos. Earn XP and coins upon completion.
- **Rewards:** Spend earned coins on custom rewards.
- **Attributes:** Track Strength, Intelligence, and Discipline stats.

## Setup & Running Locally

1. **Install Dependencies:**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` (if provided) and adjust the API URL to point to the local backend.

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

4. **Build for Production:**
   ```bash
   npm run build
   ```
   This will generate a `dist` directory with production-ready static files.
