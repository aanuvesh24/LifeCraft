#!/usr/bin/env python3
"""
Create and seed the 'leaderboard' table in Supabase PostgreSQL.
Table schema:
  - id (BIGSERIAL PRIMARY KEY)
  - username (TEXT UNIQUE NOT NULL)
  - score (INTEGER NOT NULL DEFAULT 0)
  - level (INTEGER NOT NULL DEFAULT 1)
  - streak (INTEGER NOT NULL DEFAULT 1)
  - updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
"""
import psycopg2
from psycopg2.extras import execute_values

DB_HOST = "aws-0-ap-northeast-2.pooler.supabase.com"
DB_PORT = 6543
DB_USER = "postgres.llqradcrafoflbgtsiqr"
DB_PASS = "RMbCDEYr92Q8VGbc"
DB_NAME = "postgres"


def setup_supabase_leaderboard():
    print(f"Connecting to Supabase PostgreSQL at {DB_HOST}:{DB_PORT}...")
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        connect_timeout=10
    )
    conn.autocommit = True
    cur = conn.cursor()

    print("Creating 'leaderboard' table in Supabase...")
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS public.leaderboard (
        id BIGSERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        streak INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Grant permissions for PostgREST & Supabase JS client
    GRANT ALL ON TABLE public.leaderboard TO anon, authenticated, service_role, postgres;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;

    -- Enable Row Level Security (RLS)
    ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

    -- Policies
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Allow public read access') THEN
            CREATE POLICY "Allow public read access" ON public.leaderboard FOR SELECT TO anon, authenticated, service_role USING (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Allow public insert access') THEN
            CREATE POLICY "Allow public insert access" ON public.leaderboard FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leaderboard' AND policyname = 'Allow public update access') THEN
            CREATE POLICY "Allow public update access" ON public.leaderboard FOR UPDATE TO anon, authenticated, service_role USING (true) WITH CHECK (true);
        END IF;
    END $$;
    """
    cur.execute(create_table_sql)
    print("Table created and RLS policies configured successfully.")

    # Initial adventurer roster
    adventurers = [
        ("TechnoBlade", 6780, 6, 18),
        ("Alex_Valkyrie", 3765, 4, 8),
        ("Steve_Crafter", 2140, 3, 3),
        ("Anuvesh", 1570, 2, 1),
        ("EnderScholar", 840, 1, 2),
        ("SupaKnight", 620, 1, 1),
        ("TestPlayer", 500, 1, 1),
    ]

    print("Upserting player scores into Supabase leaderboard...")
    upsert_sql = """
    INSERT INTO public.leaderboard (username, score, level, streak, updated_at)
    VALUES %s
    ON CONFLICT (username) DO UPDATE
    SET score = EXCLUDED.score,
        level = EXCLUDED.level,
        streak = EXCLUDED.streak,
        updated_at = NOW();
    """
    data = [(u, s, l, st) for u, s, l, st in adventurers]
    execute_values(
        cur,
        """
        INSERT INTO public.leaderboard (username, score, level, streak)
        VALUES %s
        ON CONFLICT (username) DO UPDATE
        SET score = EXCLUDED.score,
            level = EXCLUDED.level,
            streak = EXCLUDED.streak,
            updated_at = NOW();
        """,
        data
    )

    cur.execute("SELECT id, username, score, level, streak, updated_at FROM public.leaderboard ORDER BY score DESC;")
    rows = cur.fetchall()
    print("\nCurrent Supabase Leaderboard State:")
    print("Rank | Username        | Score   | Level | Streak")
    print("-------------------------------------------------")
    for i, r in enumerate(rows, 1):
        print(f"#{i:<3} | {r[1]:<15} | {r[2]:<7} | Lvl {r[3]:<2} | {r[4]}D Streak")

    cur.close()
    conn.close()
    print("\nSupabase table 'leaderboard' setup complete!")


if __name__ == "__main__":
    setup_supabase_leaderboard()
