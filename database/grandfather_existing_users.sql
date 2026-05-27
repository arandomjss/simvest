-- Grandfather existing users: mark all users who signed up before onboarding was introduced as already onboarded.
-- This ONLY sets onboarding_completed for users who don't have it set yet (safe to run multiple times).
-- Run this in Supabase SQL Editor.

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
    'onboarding_completed', true,
    'onboarding_completed_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
)
WHERE raw_user_meta_data->>'onboarding_completed' IS NULL;

-- Verify: check how many users were updated
SELECT 
    id,
    email,
    raw_user_meta_data->>'onboarding_completed' AS onboarding_completed,
    raw_user_meta_data->>'full_name' AS full_name,
    created_at
FROM auth.users
ORDER BY created_at DESC;
