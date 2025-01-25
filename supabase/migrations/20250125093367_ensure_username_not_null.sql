-- Modify the profile trigger to ensure username is never null
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'user_' || NEW.id),  -- Fallback to user_id if email is null
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Update any existing profiles to ensure username is set
UPDATE profiles p
SET username = COALESCE(
  (SELECT email FROM auth.users WHERE id = p.id),
  'user_' || p.id::text
)
WHERE username IS NULL;

-- Add not null constraint to username
ALTER TABLE profiles 
  ALTER COLUMN username SET NOT NULL; 