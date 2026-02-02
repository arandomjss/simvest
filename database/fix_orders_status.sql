-- FIX: Allow 'PENDING' status for Limit Orders
-- Run this in your Supabase SQL Editor

-- 1. Drop the old restrictive check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Add the new constraint allowing 'PENDING'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('EXECUTED', 'FAILED', 'CANCELLED', 'PENDING'));

-- 3. Verify it worked
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'orders_status_check';
