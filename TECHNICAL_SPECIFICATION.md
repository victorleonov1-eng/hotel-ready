# HOTEL Ready - Technical Specification Document

**Version**: 1.0.0  
**Date**: June 2026  
**Status**: Production Ready  
**Last Updated**: 2026-06-27

---

## 1. EXECUTIVE SUMMARY

HOTEL Ready is an AI-powered staff training platform designed for hospitality organizations. It uses real-time guest roleplay scenarios powered by Claude AI to help hotel staff practice and improve customer service skills. The platform includes comprehensive analytics, manager dashboards, and administrative controls.

**Key Features**:
- 36 pre-built training scenarios (9 per department)
- AI-powered guest roleplay with Claude API
- Real-time text-to-speech (3 voices via ElevenLabs)
- Session recording and playback
- Automated scoring with coaching feedback
- Manager dashboard with PIN protection
- Admin dashboard with organization management
- Multi-tenant architecture with RLS
- Department-based filtering and analytics

---

## 2. SYSTEM REQUIREMENTS

### 2.1 Functional Requirements

#### User Authentication & Authorization
- [x] Email/password authentication via Supabase
- [x] Three-level role system (Staff, Manager, Admin)
- [x] Organization-based data isolation
- [x] PIN protection for Manager/Admin dashboards
- [x] Session management with JWT tokens
- [x] PIN expiry management per organization

#### Staff Training Module
- [x] Scenario selection by department
- [x] Real-time AI roleplay with Claude API
- [x] Text-to-speech audio (ElevenLabs)
- [x] Session recording (video/audio)
- [x] Automated scoring algorithm
- [x] Instant feedback and coaching tips
- [x] Training history tracking
- [x] Best score tracking per scenario

#### Manager Dashboard
- [x] Staff member registration and management
- [x] PIN protection
- [x] Training progress monitoring
- [x] Department-based filtering
- [x] Performance analytics
- [x] Report generation and export
- [x] Staff performance metrics

#### Admin Dashboard
- [x] Organization management
- [x] PIN expiry date management
- [x] Location/property management
- [x] Staff role assignments
- [x] System-wide analytics
- [x] Audit logging
- [x] 2FA-ready infrastructure

### 2.2 Non-Functional Requirements

#### Performance
- Page load time: < 2 seconds
- API response time: < 500ms
- Database query time: < 100ms
- Support 1000+ concurrent users
- 99.9% uptime SLA

#### Security
- HTTPS only (TLS 1.3+)
- Row-Level Security (RLS) on all tables
- Rate limiting (5 attempts per 15 minutes)
- Audit logging for all critical actions
- Encryption at rest (Supabase)
- Regular security audits
- GDPR/CCPA compliance ready

#### Scalability
- Horizontal scaling via Vercel
- Database auto-scaling with Supabase
- CDN for static assets
- Rate limiting per organization
- Connection pooling (Supabase)

#### Availability
- 99.9% uptime target
- Automated backups (daily)
- Disaster recovery plan
- Zero-downtime deployments

---

## 3. TECHNICAL STACK

### Frontend Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18+ |
| Build Tool | Vite | 5+ |
| Language | TypeScript | 5.0+ |
| Styling | Tailwind CSS | 3.0+ |
| State Management | React Hooks | Native |
| HTTP Client | Supabase JS SDK | 2.0+ |
| Database | Supabase (PostgreSQL) | Cloud |

### Backend Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express | 4.0+ |
| Language | TypeScript | 5.0+ |
| API | REST | OpenAPI 3.0 |
| AI | Claude API | 3.5 Sonnet |
| TTS | ElevenLabs API | v1 |
| Task Queue | Bull (Redis) | 4.0+ |

### Infrastructure Stack
| Component | Service | Plan |
|-----------|---------|------|
| Frontend Hosting | Vercel | Pro |
| Backend Hosting | Render | Starter |
| Database | Supabase (PostgreSQL) | Free/Pro |
| Object Storage | Supabase Storage | Cloud |
| CDN | Vercel CDN | Included |
| Email | SendGrid | Free/Paid |
| Monitoring | Vercel/Render | Included |

### Development Stack
| Tool | Purpose | Version |
|------|---------|---------|
| Node.js | Runtime | 18+ |
| npm | Package Manager | 9+ |
| Git | Version Control | 2.0+ |
| GitHub | Repository | Cloud |
| VS Code | IDE | Latest |

---

## 4. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN & Edge (Vercel)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Client   │    │ Client   │    │ Client   │
    │ React    │    │ React    │    │ React    │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
              ┌──────────▼──────────┐
              │  Vercel Edge       │
              │  Functions/Router  │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────────┐ ┌──▼──────┐  ┌─────▼──────┐
    │  Render     │ │Supabase │  │ ElevenLabs │
    │  (Backend)  │ │(Database)  │ TTS API    │
    │  Express.js │ │PostgreSQL  │            │
    └─────┬──────┘ └──┬────────┘  └─────┬──────┘
          │           │                  │
          └───────────┼──────────────────┘
                      │
              ┌───────▼────────┐
              │  Anthropic API │
              │  Claude 3.5    │
              └────────────────┘
```

---

## 5. DATA FLOW DIAGRAMS

### 5.1 Training Session Flow

```
User Starts Scenario
        │
        ▼
Load Scenario Details
        │
        ▼
Call Claude API ──► Get AI Guest Prompt
        │
        ▼
Convert Text to Speech (ElevenLabs)
        │
        ▼
Display Prompt + Play Audio
        │
        ▼
Collect User Response (Text)
        │
        ▼
Send to Claude for Evaluation
        │
        ▼
Get Scoring + Feedback
        │
        ▼
Save to Database (Session Record)
        │
        ▼
Display Score + Tips
```

### 5.2 Authentication Flow

```
User Enters Credentials
        │
        ▼
Check Rate Limiting
        │
        ├─ Limited? ──► Show Error, Lock Account
        │
        └─ OK ──┐
               │
               ▼
         Supabase Auth
               │
               ├─ Failed? ──► Record Failed Attempt
               │
               └─ Success ──┐
                           │
                           ▼
                    Get JWT Token
                           │
                           ▼
                    Fetch User Profile
                           │
                           ▼
                    Set Session
                           │
                           ▼
                    Log Audit Event
```

---

## 6. API SPECIFICATIONS

### 6.1 Training Sessions API

#### POST /api/sessions/start
Start a new training session

**Request:**
```json
{
  "scenario_id": "uuid",
  "staff_id": "uuid"
}
```

**Response (200):**
```json
{
  "session_id": "uuid",
  "scenario": {
    "id": "uuid",
    "title": "Handle Angry Guest",
    "department": "Front Office",
    "difficulty": "intermediate"
  },
  "guest_prompt": "I booked a room and it's not available!",
  "audio_url": "https://..."
}
```

#### POST /api/sessions/{id}/respond
Submit a staff response

**Request:**
```json
{
  "response": "Let me help you find a solution",
  "response_time": 45
}
```

**Response (200):**
```json
{
  "ai_evaluation": {
    "score": 85,
    "feedback": "Good empathy, remember to...",
    "tips": ["Tip 1", "Tip 2"]
  },
  "next_prompt": "Here's what I want...",
  "session_complete": false
}
```

#### POST /api/sessions/{id}/end
End and score a session

**Response (200):**
```json
{
  "final_score": 87,
  "session_summary": {
    "duration_seconds": 240,
    "responses_count": 3,
    "cards_used": 1,
    "penalty_applied": 5
  },
  "coaching_feedback": "Great job overall..."
}
```

### 6.2 Analytics API

#### GET /api/analytics/organization/{id}
Get organization-wide analytics

**Query Parameters:**
- `start_date`: ISO 8601
- `end_date`: ISO 8601
- `department`: Optional filter

**Response (200):**
```json
{
  "total_staff": 25,
  "total_sessions": 150,
  "average_score": 84,
  "completion_rate": 87,
  "department_breakdown": [
    {
      "department": "Front Office",
      "staff_count": 10,
      "sessions": 60,
      "avg_score": 85
    }
  ]
}
```

### 6.3 Admin API

#### POST /api/organizations/{id}/staff
Create a staff member

**Request:**
```json
{
  "name": "John Smith",
  "department": "Front Office",
  "position": "Receptionist",
  "pin": "1234"
}
```

#### PUT /api/organizations/{id}/pin-expiry
Update PIN expiry date

**Request:**
```json
{
  "pin_expires_at": "2026-12-31T23:59:59Z"
}
```

---

## 7. TECHNOLOGY DETAILS

### 7.1 Claude API Integration

**Model**: Claude 3.5 Sonnet  
**Purpose**: Guest roleplay and response evaluation  
**Rate Limit**: 100,000 tokens/minute (enterprise)

**Prompt Template:**
```
You are a hotel guest in a training scenario.
Scenario: [SCENARIO]
Your goal: [OBJECTIVE]
Previous exchange: [CONTEXT]

Act naturally and respond to the staff member's reply.
If excellent: acknowledge and end conversation.
If poor: provide coaching opportunity.
```

### 7.2 ElevenLabs Integration

**Model**: Multilingual v2  
**Voices**: Bella, Elli, Chris  
**Quality**: 192 kbps MP3  
**Latency**: < 2 seconds

### 7.3 Supabase Features Used

- Authentication (email/password)
- PostgreSQL Database
- Row-Level Security (RLS)
- Real-time subscriptions
- Storage (session recordings)
- Edge Functions (optional)

---

## 8. DATABASE SCHEMA (Key Tables)

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  admin_id UUID,
  pin_expires_at TIMESTAMP,
  manager_pin VARCHAR(255),
  created_at TIMESTAMP
);

-- Staff Members
CREATE TABLE staff_members (
  id UUID PRIMARY KEY,
  organization_id UUID,
  name VARCHAR(255),
  department VARCHAR(100),
  position VARCHAR(100),
  pin VARCHAR(4),
  created_at TIMESTAMP
);

-- Training Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  staff_id UUID,
  scenario_id VARCHAR(100),
  score INTEGER,
  duration_seconds INTEGER,
  used_cards BOOLEAN,
  recording_id VARCHAR(255),
  created_at TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50),
  user_id UUID,
  user_email VARCHAR(255),
  organization_id UUID,
  ip_address VARCHAR(45),
  status VARCHAR(20),
  details JSONB,
  created_at TIMESTAMP
);
```

---

## 9. CONFIGURATION MANAGEMENT

### Environment Variables

**Frontend (.env):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_PIN=
```

**Backend (.env):**
```
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
NODE_ENV=production
PORT=3000
```

---

## 10. COMPLIANCE & STANDARDS

- ✅ WCAG 2.1 Level AA accessibility
- ✅ GDPR ready (data export, deletion)
- ✅ SOC 2 compliant hosting (Supabase, Vercel)
- ✅ HIPAA-ready encryption
- ✅ OpenAPI 3.0 compliant APIs
- ✅ REST API conventions

---

## 11. VERSIONING

**Semantic Versioning**: MAJOR.MINOR.PATCH

- MAJOR: Breaking changes (API, data structure)
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

**Current Version**: 1.0.0  
**Release Date**: June 2026

---

## 12. SUPPORT & MAINTENANCE

- **SLA**: 99.9% uptime
- **Response Time**: < 24 hours for critical issues
- **Patch Cycle**: Monthly
- **Major Release Cycle**: Quarterly
- **Documentation**: Updated with each release

---

**Document Owner**: HOTEL Ready Product Team  
**Last Review**: 2026-06-27  
**Next Review**: 2026-09-27
