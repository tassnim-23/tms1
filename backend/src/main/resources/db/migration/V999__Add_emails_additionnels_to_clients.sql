-- Add emailsAdditionnels column to clients table for supporting multiple emails per client
ALTER TABLE clients ADD COLUMN IF NOT EXISTS emails_additionnels VARCHAR(500);

-- Add comment explaining the format
-- Format: email1,email2,email3 (comma-separated, space-trimmed)
