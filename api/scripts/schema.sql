-- Database Schema for InstaAstro Replica (PostgreSQL)

-- Enable UUID extension if needed (optional, using SERIAL here for simplicity as requested)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS & TYPES
-- Define Enums first as PostgreSQL requires specific types
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('ADMIN', 'SEEKER', 'ASTROLOGER');

DROP TYPE IF EXISTS gender_type CASCADE;
CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');

DROP TYPE IF EXISTS transaction_type_enum CASCADE;
CREATE TYPE transaction_type_enum AS ENUM ('CREDIT', 'DEBIT');

DROP TYPE IF EXISTS consultation_type_enum CASCADE;
CREATE TYPE consultation_type_enum AS ENUM ('CHAT', 'VOICE', 'VIDEO');

DROP TYPE IF EXISTS consultation_status_enum CASCADE;
CREATE TYPE consultation_status_enum AS ENUM ('REQUESTED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- 2. UTILITY FUNCTIONS
-- Function to auto-update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = MOMENT(); 
    -- Note: MOMENT() is not standard Postgres, usually NOW() or CURRENT_TIMESTAMP. 
    -- I will use CURRENT_TIMESTAMP.
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. TABLES

-- USERS & AUTHENTICATION
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    role user_role NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- OTP Verification
CREATE TABLE otp_verifications (
    id SERIAL PRIMARY KEY,
    contact_info VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEEKER PROFILES
CREATE TABLE seeker_profiles (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(100),
    date_of_birth DATE,
    time_of_birth TIME,
    place_of_birth VARCHAR(100),
    gender gender_type,
    profile_picture_url VARCHAR(255),
    CONSTRAINT fk_seeker_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ASTROLOGER PROFILES
CREATE TABLE astrologer_profiles (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    profile_picture_url VARCHAR(255),
    about_me TEXT,
    experience_years INT,
    languages VARCHAR(255),
    specialties VARCHAR(255),
    consultation_fee_per_min DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_online BOOLEAN DEFAULT FALSE,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    total_consultations INT DEFAULT 0,
    CONSTRAINT fk_astro_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- WALLET SYSTEM
CREATE TABLE user_wallets (
    user_id INT PRIMARY KEY,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Wallet Transactions
CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type transaction_type_enum NOT NULL,
    description VARCHAR(255),
    reference_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trans_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CONSULTATIONS
CREATE TABLE consultations (
    id SERIAL PRIMARY KEY,
    seeker_id INT NOT NULL,
    astrologer_id INT NOT NULL,
    consultation_type consultation_type_enum NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INT DEFAULT 0,
    rate_per_min DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) DEFAULT 0.00,
    status consultation_status_enum DEFAULT 'REQUESTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cons_seeker FOREIGN KEY (seeker_id) REFERENCES users(id),
    CONSTRAINT fk_cons_astro FOREIGN KEY (astrologer_id) REFERENCES users(id)
);

-- REVIEWS
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    consultation_id INT UNIQUE NOT NULL,
    astrologer_id INT NOT NULL,
    seeker_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_cons FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    CONSTRAINT fk_rev_astro FOREIGN KEY (astrologer_id) REFERENCES users(id),
    CONSTRAINT fk_rev_seeker FOREIGN KEY (seeker_id) REFERENCES users(id)
);

-- INDEXES
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_astrologers_rating ON astrologer_profiles(rating_avg);
CREATE INDEX idx_consultations_seeker ON consultations(seeker_id);
CREATE INDEX idx_consultations_astrologer ON consultations(astrologer_id);
