BEGIN;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public app_settings reads"
  ON public.app_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public app_settings inserts"
  ON public.app_settings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public app_settings updates"
  ON public.app_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

INSERT INTO public.app_settings (key, value)
VALUES ('assistant_name', 'Lina')
ON CONFLICT (key) DO NOTHING;

COMMIT;
