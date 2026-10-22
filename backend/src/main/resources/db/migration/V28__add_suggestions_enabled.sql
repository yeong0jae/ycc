ALTER TABLE shows ADD COLUMN suggestions_enabled BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE shows SET suggestions_enabled = TRUE WHERE site_code IS NOT NULL;
