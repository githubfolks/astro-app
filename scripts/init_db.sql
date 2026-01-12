-- Enable UUID extension if needed (though we are using Serial Integers based on models)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR UNIQUE,
    email VARCHAR UNIQUE,
    role VARCHAR NOT NULL, -- Enum: ADMIN, SEEKER, ASTROLOGER
    hashed_password VARCHAR,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Seeker Profiles Table
CREATE TABLE IF NOT EXISTS seeker_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR,
    date_of_birth DATE,
    time_of_birth TIME,
    place_of_birth VARCHAR,
    gender VARCHAR, -- Enum: MALE, FEMALE, OTHER
    profile_picture_url VARCHAR
);

-- Astrologer Profiles Table
CREATE TABLE IF NOT EXISTS astrologer_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR NOT NULL,
    profile_picture_url VARCHAR,
    about_me TEXT,
    experience_years INTEGER,
    languages VARCHAR,
    specialties VARCHAR,
    consultation_fee_per_min DECIMAL(10, 2) DEFAULT 0.00,
    is_online BOOLEAN DEFAULT FALSE,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    total_consultations INTEGER DEFAULT 0
);

-- User Wallets Table
CREATE TABLE IF NOT EXISTS user_wallets (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR NOT NULL, -- Enum: DEPOSIT, WITHDRAWAL, CHAT_DEDUCTION, CHAT_REFUND
    reference_id VARCHAR,
    description VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);

-- Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    seeker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    astrologer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    consultation_type VARCHAR NOT NULL, -- Enum: CHAT, VOICE, VIDEO
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    rate_per_min DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR DEFAULT 'REQUESTED', -- Enum: REQUESTED, ONGOING, COMPLETED, CANCELLED, etc.
    disconnection_snapshot TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultations_seeker_id ON consultations(seeker_id);
CREATE INDEX IF NOT EXISTS idx_consultations_astrologer_id ON consultations(astrologer_id);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
    astrologer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seeker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_astrologer_id ON reviews(astrologer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seeker_id ON reviews(seeker_id);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_consultation_id ON chat_messages(consultation_id);
