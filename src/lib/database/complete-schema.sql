-- database/complete-schema.sql
-- Complete Conference Management System Database Schema

-- ============================
-- ENUMS (Custom Types)
-- ============================

-- User Role Enum
CREATE TYPE user_role AS ENUM (
    'ORGANIZER',
    'EVENT_MANAGER', 
    'FACULTY',
    'DELEGATE',
    'HALL_COORDINATOR',
    'SPONSOR',
    'VOLUNTEER',
    'VENDOR'
);

-- Event Status Enum
CREATE TYPE event_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);

-- Event Role Enum
CREATE TYPE event_role AS ENUM (
    'ORGANIZER',
    'EVENT_MANAGER',
    'SPEAKER',
    'MODERATOR',
    'CHAIRPERSON',
    'ATTENDEE',
    'COORDINATOR'
);

-- Event Permission Enum
CREATE TYPE event_permission AS ENUM (
    'FULL_ACCESS',
    'EDIT_SESSIONS',
    'MANAGE_FACULTY',
    'VIEW_ONLY'
);

-- Speaker Role Enum
CREATE TYPE speaker_role AS ENUM (
    'SPEAKER',
    'MODERATOR',
    'CHAIRPERSON'
);

-- Abstract Status Enum
CREATE TYPE abstract_status AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'ACCEPTED',
    'REJECTED',
    'REVISION_REQUIRED'
);

-- Registration Status Enum
CREATE TYPE registration_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);

-- Travel Mode Enum
CREATE TYPE travel_mode AS ENUM (
    'BUS',
    'TRAIN',
    'FLIGHT',
    'CAR',
    'OTHER'
);

-- Attendance Method Enum
CREATE TYPE attendance_method AS ENUM (
    'MANUAL',
    'QR_CODE',
    'AUTOMATIC'
);

-- Message Status Enum
CREATE TYPE message_status AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED'
);

-- Notification Type Enum
CREATE TYPE notification_type AS ENUM (
    'INFO',
    'WARNING',
    'ERROR',
    'SUCCESS',
    'REMINDER'
);

-- Certificate Type Enum
CREATE TYPE certificate_type AS ENUM (
    'PARTICIPATION',
    'SPEAKER',
    'CHAIRPERSON',
    'MODERATOR',
    'ORGANIZER'
);

-- Document Category Enum
CREATE TYPE document_category AS ENUM (
    'PRESENTATION',
    'CV',
    'TRAVEL',
    'ACCOMMODATION',
    'CERTIFICATE',
    'OTHER'
);

-- Issue Status Enum
CREATE TYPE issue_status AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);

-- Invitation Status Enum
CREATE TYPE invitation_status AS ENUM (
    'SENT',
    'DELIVERED', 
    'OPENED',
    'RESPONDED',
    'ACCEPTED',
    'DECLINED',
    'CANCELLED',
    'FAILED',
    'EXPIRED'
);

-- Response Status Enum
CREATE TYPE response_status AS ENUM (
    'ACCEPTED',
    'DECLINED',
    'PENDING',
    'TENTATIVE'
);

-- ============================
-- CORE TABLES
-- ============================

-- Users Table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    role user_role DEFAULT 'DELEGATE',
    institution VARCHAR(255),
    designation VARCHAR(255),
    specialization VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    password VARCHAR(255),
    image VARCHAR(500),
    email_verified TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE events (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    venue VARCHAR(255),
    max_participants INTEGER,
    registration_deadline TIMESTAMP,
    event_type VARCHAR(50) DEFAULT 'CONFERENCE',
    tags JSONB,
    website VARCHAR(500),
    contact_email VARCHAR(255),
    created_by VARCHAR(255),
    status event_status DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Events (Junction Table)
CREATE TABLE user_events (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    role event_role DEFAULT 'ATTENDEE',
    permissions event_permission,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- Halls Table
CREATE TABLE halls (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    equipment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conference Sessions Table
CREATE TABLE conference_sessions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    hall_id VARCHAR(255) REFERENCES halls(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Speakers Table
CREATE TABLE session_speakers (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL REFERENCES conference_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role speaker_role DEFAULT 'SPEAKER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, user_id)
);

-- ✅ FIXED: Presentations Table with file metadata and nullable session_id
CREATE TABLE presentations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) REFERENCES conference_sessions(id) ON DELETE CASCADE, -- Allow NULL
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_size BIGINT,                    -- ✅ ADDED
    file_type VARCHAR(255),              -- ✅ ADDED
    original_filename VARCHAR(500),      -- ✅ ADDED
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CV Uploads Table
CREATE TABLE cv_uploads (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    file_type VARCHAR(100),
    file_size BIGINT,
    original_filename VARCHAR(500),
    is_approved BOOLEAN DEFAULT false,
    approval_notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Table
CREATE TABLE feedback (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    event_id VARCHAR(255) REFERENCES events(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response TEXT,
    status VARCHAR(50) DEFAULT 'NEW',
    email VARCHAR(255),
    name VARCHAR(255)
);

-- ============================
-- ABSTRACT SYSTEM
-- ============================

-- Abstracts Table
CREATE TABLE abstracts (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status abstract_status DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Abstract Reviews Table
CREATE TABLE abstract_reviews (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    abstract_id VARCHAR(255) NOT NULL REFERENCES abstracts(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(abstract_id, reviewer_id)
);

-- ============================
-- REGISTRATION SYSTEM
-- ============================

-- Registrations Table
CREATE TABLE registrations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_data JSONB,
    status registration_status DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Travel Details Table
CREATE TABLE travel_details (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    mode travel_mode NOT NULL,
    itinerary_path VARCHAR(500),
    ticket_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- Accommodations Table
CREATE TABLE accommodations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    hotel VARCHAR(255),
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    preferences TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- ============================
-- ATTENDANCE SYSTEM
-- ============================

-- Attendance Records Table
CREATE TABLE attendance_records (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL REFERENCES conference_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marked_by VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method attendance_method DEFAULT 'MANUAL',
    UNIQUE(session_id, user_id)
);

-- QR Codes Table
CREATE TABLE qr_codes (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- COMMUNICATION SYSTEM
-- ============================

-- Email Logs Table
CREATE TABLE email_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status message_status DEFAULT 'PENDING',
    user_id VARCHAR(255) REFERENCES users(id)
);

-- WhatsApp Logs Table
CREATE TABLE whatsapp_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status message_status DEFAULT 'PENDING',
    user_id VARCHAR(255) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- FACULTY INVITATION SYSTEM
-- ============================

-- Faculty Invitations Table
CREATE TABLE faculty_invitations (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    invited_by VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) REFERENCES conference_sessions(id) ON DELETE SET NULL,
    invitation_subject VARCHAR(500) NOT NULL,
    invitation_message TEXT NOT NULL,
    role speaker_role DEFAULT 'SPEAKER',
    status invitation_status DEFAULT 'SENT',
    response_status response_status DEFAULT 'PENDING',
    email_message_id VARCHAR(255),
    opened_at TIMESTAMP,
    responded_at TIMESTAMP,
    response_message TEXT,
    response_data JSONB,
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_days INTEGER DEFAULT 3,
    reminder_sent_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_id, event_id, session_id)
);

-- Invitation Responses Table
CREATE TABLE invitation_responses (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id VARCHAR(255) NOT NULL REFERENCES faculty_invitations(id) ON DELETE CASCADE,
    faculty_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response response_status NOT NULL,
    message TEXT,
    availability_notes TEXT,
    preferred_sessions JSONB,
    declined_sessions JSONB,
    bio TEXT,
    presentation_title VARCHAR(500),
    presentation_abstract TEXT,
    technical_requirements TEXT,
    dietary_restrictions TEXT,
    accommodation_needed BOOLEAN DEFAULT false,
    travel_assistance_needed BOOLEAN DEFAULT false,
    preferred_contact_method VARCHAR(50) DEFAULT 'email',
    emergency_contact JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(invitation_id, faculty_id)
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE,
    invitation_id VARCHAR(255) REFERENCES faculty_invitations(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- DOCUMENTS & CERTIFICATES
-- ============================

-- Certificates Table
CREATE TABLE certificates (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type certificate_type NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE documents (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    category document_category NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- HALL MANAGEMENT
-- ============================

-- Hall Assignments Table
CREATE TABLE hall_assignments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    hall_id VARCHAR(255) NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    session_id VARCHAR(255) REFERENCES conference_sessions(id),
    coordinator_id VARCHAR(255) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues Table
CREATE TABLE issues (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    hall_id VARCHAR(255) REFERENCES halls(id),
    session_id VARCHAR(255) REFERENCES conference_sessions(id),
    reported_by VARCHAR(255) NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    status issue_status DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- NEXTAUTH TABLES (Optional)
-- ============================

-- Accounts Table (for OAuth)
CREATE TABLE accounts (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    UNIQUE(provider, provider_account_id)
);

-- Sessions Table (for database sessions - optional since we use JWT)
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL
);

-- Verification Tokens Table
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL,
    UNIQUE(identifier, token)
);

-- ============================
-- INDEXES FOR PERFORMANCE
-- ============================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Event indexes
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);

-- Session indexes
CREATE INDEX idx_sessions_event ON conference_sessions(event_id);
CREATE INDEX idx_sessions_time ON conference_sessions(start_time, end_time);
CREATE INDEX idx_sessions_hall ON conference_sessions(hall_id);

-- ✅ FIXED: Presentations indexes
CREATE INDEX idx_presentations_user ON presentations(user_id);
CREATE INDEX idx_presentations_session ON presentations(session_id);
CREATE INDEX idx_presentations_uploaded_at ON presentations(uploaded_at DESC);

-- CV uploads indexes
CREATE INDEX idx_cv_uploads_faculty ON cv_uploads(faculty_id);
CREATE INDEX idx_cv_uploads_filetype ON cv_uploads(file_type);
CREATE INDEX idx_cv_uploads_uploaded_at ON cv_uploads(uploaded_at DESC);

-- Registration indexes
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);

-- Attendance indexes
CREATE INDEX idx_attendance_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_user ON attendance_records(user_id);

-- Communication indexes
CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_whatsapp_logs_user ON whatsapp_logs(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- QR Code indexes
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_qr_codes_user_event ON qr_codes(user_id, event_id);

-- Feedback indexes
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_event ON feedback(event_id);
CREATE INDEX idx_feedback_status ON feedback(status);

-- Faculty invitation indexes
CREATE INDEX idx_faculty_invitations_faculty ON faculty_invitations(faculty_id);
CREATE INDEX idx_faculty_invitations_event ON faculty_invitations(event_id);
CREATE INDEX idx_faculty_invitations_status ON faculty_invitations(status);
CREATE INDEX idx_faculty_invitations_response_status ON faculty_invitations(response_status);

-- Invitation responses indexes
CREATE INDEX idx_invitation_responses_invitation ON invitation_responses(invitation_id);
CREATE INDEX idx_invitation_responses_faculty ON invitation_responses(faculty_id);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_event ON activity_logs(event_id);

-- ============================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON conference_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_abstracts_updated_at BEFORE UPDATE ON abstracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_updated_at BEFORE UPDATE ON travel_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON accommodations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faculty_invitations_updated_at BEFORE UPDATE ON faculty_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitation_responses_updated_at BEFORE UPDATE ON invitation_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================
-- SAMPLE DATA (Optional)
-- ============================

-- Insert a default organizer user
INSERT INTO users (email, name, role, password) VALUES 
('admin@conference.com', 'System Administrator', 'ORGANIZER', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeGuA6ROwT4f.x/t2')
ON CONFLICT (email) DO NOTHING;
-- Password is 'admin123' (hashed)

-- Success message
SELECT 'Complete database schema created successfully with all fixes applied!' as message;
