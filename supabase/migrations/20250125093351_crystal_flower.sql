/*
  # Add Profile Creation Trigger

  1. New Function
    - Creates a function to automatically create a profile when a new user signs up
    - Generates a default username from the user's email
    - Sets default values for other profile fields

  2. New Trigger
    - Adds a trigger to fire after user insertion in auth.users
    - Automatically creates corresponding profile record

  3. Security
    - Function is owned by postgres to ensure proper execution
    - Trigger runs with security definer to bypass RLS
*/

-- Create the function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),  -- Use part before @ as default username
    '',                             -- Empty full name by default
    '',                             -- Empty avatar URL by default
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();