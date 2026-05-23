# Supabase Database Architecture

## Overview

Database schema for the Area de Ciencias Naturales y Tecnología platform.

## Tables

### profiles
- `id` - UUID referencing auth.users (PK)
- `email` - User email
- `full_name` - Full name
- `role` - admin | teacher | visitor
- `avatar_url` - Profile image URL
- `bio` - Biography text
- `specialization` - Subject specialization
- `created_at` / `updated_at` - Timestamps

### projects
- `id` - UUID (PK)
- `professor_id` - References profiles.id (FK)
- `title` - Project title
- `slug` - URL-friendly slug (unique)
- `description` - Short description
- `content` - Full content/markdown
- `status` - draft | published | archived
- `cover_image` - Featured image URL
- `technologies` - Array of tags
- `gallery_images` - Array of image URLs
- `created_at` / `updated_at` - Timestamps

### resources
- `id` - UUID (PK)
- `professor_id` - References profiles.id (FK)
- `title` - Resource title
- `type` - document | video | link | image
- `file_url` - URL to resource file
- `description` - Description text
- `created_at` / `updated_at` - Timestamps

### publications
- `id` - UUID (PK)
- `professor_id` - References profiles.id (FK)
- `title` - Publication title
- `excerpt` - Short summary
- `content` - Full content
- `cover_image` - Featured image
- `published` - Boolean for publication status
- `published_at` - Publication date
- `created_at` / `updated_at` - Timestamps

### activities
- `id` - UUID (PK)
- `professor_id` - References profiles.id (FK)
- `title` - Activity title
- `description` - Description text
- `due_date` - Due date
- `created_at` / `updated_at` - Timestamps

## Relationships

```
auth.users (1) ── (1) profiles
profiles (1) ── (n) projects
profiles (1) ── (n) resources
profiles (1) ── (n) publications
profiles (1) ── (n) activities
```

## Row Level Security (RLS)

### Public Access
- Can view published projects
- Can view all resources
- Can view published publications
- Can view all activities

### Teacher Access
- Can create/edit/delete own content
- Cannot modify other teachers' content
- Full access to profile

### Admin Access
- Can manage all content
- Can update any profile
- Full system access

## Setup

Run scripts in order:

```sql
-- 1. Schema
psql -f supabase/schema.sql

-- 2. RLS policies
psql -f supabase/rls.sql

-- 3. Storage (supabase dashboard recommended)
```

## Storage Buckets

- `avatars` - Profile images
- `projects` - Project covers and galleries
- `resources` - Teaching materials

All buckets are public for read access.