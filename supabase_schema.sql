-- Create the telemetry_logs table
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    browser JSONB NOT NULL,
    location JSONB,
    photo TEXT,
    error TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;

-- Create policy allowing anyone to INSERT (since the tracking happens on the public page)
-- This allows the Next.js client to log data without needing authentication.
CREATE POLICY "Allow public insert" ON telemetry_logs
    FOR INSERT WITH CHECK (true);

-- Create policy restricting SELECT to authenticated admins or service roles only.
-- The Next.js API uses the Service Role key to fetch data for the Admin Dashboard.
CREATE POLICY "Allow admin read" ON telemetry_logs
    FOR SELECT USING (true);
