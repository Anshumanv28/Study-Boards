# Supabase Database Migrations

This directory contains SQL migration files for the StudyBoards database schema.

## Tables Created

### 1. `boards_topics`

Stores Boards topic information including:

- Topic name (unique)
- Description
- Icon and color for UI display
- Sort order for display

### 2. `boards_content`

Stores Boards content items including:

- Topic reference (foreign key to `boards_topics`)
- Title and description
- PDF and video URLs
- Content type (pdf, video, or both)
- Difficulty level (easy, medium, hard)

### 3. `user_progress`

Tracks user progress on content:

- User ID (references `auth.users`)
- Content ID (references `boards_content`)
- Completion status and timestamp
- Time spent on content

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/001_create_boards_tables.sql`
4. Copy and paste the entire SQL content
5. Click **Run** to execute the migration

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Direct SQL Execution

You can also run the SQL directly in the Supabase SQL Editor or via any PostgreSQL client connected to your Supabase database.

## Security Features

The migration includes:

- **Row Level Security (RLS)** enabled on all tables
- **Public read access** for topics and content (anyone can view)
- **User-specific access** for progress tracking (users can only see/modify their own progress)

## Notes

- The migration uses `IF NOT EXISTS` clauses to make it safe to run multiple times
- Sequences are created automatically
- Indexes are added for common query patterns
- Triggers automatically update `updated_at` timestamps
- Foreign keys include `ON DELETE CASCADE` for data integrity

## Verification

After running the migration, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('boards_topics', 'boards_content', 'user_progress');

-- Check table structures
\d boards_topics
\d boards_content
\d user_progress
```
