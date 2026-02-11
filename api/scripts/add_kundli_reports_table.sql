-- Migration: Add kundli_reports table
-- Run this against your PostgreSQL database

CREATE TABLE IF NOT EXISTS astroapp.kundli_reports (
    id SERIAL PRIMARY KEY,
    seeker_id INTEGER REFERENCES astroapp.users(id),
    generated_by INTEGER NOT NULL REFERENCES astroapp.users(id),
    full_name VARCHAR,
    date_of_birth DATE NOT NULL,
    time_of_birth TIME NOT NULL,
    place_of_birth VARCHAR NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    timezone VARCHAR DEFAULT 'Asia/Kolkata',
    chart_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kundli_reports_seeker_id ON astroapp.kundli_reports(seeker_id);
CREATE INDEX IF NOT EXISTS idx_kundli_reports_generated_by ON astroapp.kundli_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_kundli_reports_dob_tob_pob ON astroapp.kundli_reports(date_of_birth, time_of_birth, place_of_birth);
