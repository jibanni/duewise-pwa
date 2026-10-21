-- Apply once in the EXISTING DuePoint Supabase project's SQL Editor.
-- Additive change to the PUSH subscriptions table only. Finance table is untouched.
ALTER TABLE public.duepoint_push_subscriptions
  ADD COLUMN IF NOT EXISTS last_sent_slot text;
