# Database Setup Instructions

## Quick Setup

### Option 1: Using PostgreSQL Locally

1. **Install PostgreSQL** (if not already installed):
   - Download from: https://www.postgresql.org/download/
   - Or use: `winget install PostgreSQL.PostgreSQL`

2. **Create the database**:
   ```bash
   psql -U postgres
   CREATE DATABASE elfangary_db;
   \q
   ```

3. **Run the schema**:
   ```bash
   psql -U postgres -d elfangary_db -f schema.sql
   ```

4. **Update `.env` file** with your database credentials:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/elfangary_db
   ```

### Option 2: Using Supabase (Cloud)

1. Go to https://supabase.com and create a new project
2. Copy your connection string from Project Settings → Database
3. In Supabase SQL Editor, run the contents of `schema.sql`
4. Update `.env` file:
   ```
   DATABASE_URL=postgresql://[YOUR-CONNECTION-STRING]
   ```

### Option 3: Continue with Mock Data

If you don't want to set up a database yet, the server will automatically fall back to using in-memory mock data.

## Running the Application

```bash
npm run dev:all
```

This will start both the backend server (port 3001) and frontend (port 3000).

## Verify Connection

Visit http://localhost:3001/api/health to check database connection status.
