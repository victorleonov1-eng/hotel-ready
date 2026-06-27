# HOTEL Ready - System Architecture Document

**Version**: 1.0.0  
**Date**: June 2026  
**Architecture Type**: Serverless + Database-centric  
**Scale Target**: 1000+ concurrent users per organization

---

## 1. HIGH-LEVEL ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Web Browser (React SPA)                                     │  │
│  │  ├─ Staff Training Interface                                 │  │
│  │  ├─ Manager Dashboard                                        │  │
│  │  └─ Admin Dashboard                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ HTTPS/TLS 1.3
┌────────────────────▼─────────────────────────────────────────────────┐
│                    DELIVERY & ROUTING LAYER                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Vercel Edge Network                                         │  │
│  │  ├─ Global CDN for Static Assets                             │  │
│  │  ├─ Edge Middleware                                          │  │
│  │  └─ Automatic HTTPS & DDoS Protection                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ gRPC / REST APIs
┌────────────────────▼─────────────────────────────────────────────────┐
│                   APPLICATION & BUSINESS LOGIC LAYER                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Backend (Node.js/Express on Render)                         │  │
│  │  ├─ Authentication Service                                   │  │
│  │  ├─ Training Session Manager                                 │  │
│  │  ├─ AI Integration Service (Claude API)                      │  │
│  │  ├─ TTS Integration Service (ElevenLabs)                     │  │
│  │  ├─ Analytics Engine                                         │  │
│  │  ├─ Scoring Engine                                           │  │
│  │  ├─ Report Generator                                         │  │
│  │  └─ Audit Logger                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ SQL / REST APIs
┌────────────────────▼─────────────────────────────────────────────────┐
│                        DATA & STORAGE LAYER                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Supabase (PostgreSQL + Extensions)                          │  │
│  │  ├─ Relational Database (PostgreSQL 15)                      │  │
│  │  ├─ Row-Level Security (RLS)                                 │  │
│  │  ├─ Real-time Subscriptions                                  │  │
│  │  ├─ Storage (Session Recordings)                             │  │
│  │  └─ Backups & Encryption                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ REST APIs
┌────────────────────▼─────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES LAYER                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Anthropic API  │  │  ElevenLabs API  │  │  SendGrid Email  │  │
│  │  Claude 3.5     │  │  Text-to-Speech  │  │  (optional)      │  │
│  │  Sonnet         │  │  (3 voices)      │  │                  │  │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPONENT BREAKDOWN

### 2.1 Frontend Architecture

```
React App (Vite)
│
├─ Authentication
│  ├─ AuthContext (React Context)
│  ├─ Login/Register Pages
│  └─ Session Management
│
├─ Staff Training Module
│  ├─ Scenario Selection
│  ├─ RolePlay Interface
│  ├─ Response Input
│  ├─ Audio Playback
│  └─ Feedback Display
│
├─ Manager Dashboard
│  ├─ Staff Management
│  ├─ Training Analytics
│  ├─ Performance Reports
│  └─ Department Filtering
│
├─ Admin Dashboard
│  ├─ Organization Management
│  ├─ PIN Expiry Management
│  ├─ Staff Role Assignment
│  └─ System Analytics
│
└─ Shared Components
   ├─ Header/Navigation
   ├─ Forms & Inputs
   ├─ Charts & Graphs
   └─ Loading & Error States
```

### 2.2 Backend Architecture

```
Express.js Server (Node.js)
│
├─ API Routes
│  ├─ /api/auth/* (Authentication)
│  ├─ /api/training/* (Training Sessions)
│  ├─ /api/analytics/* (Analytics)
│  ├─ /api/organizations/* (Admin)
│  └─ /api/users/* (User Management)
│
├─ Services
│  ├─ AuthService (Supabase integration)
│  ├─ TrainingService (Session management)
│  ├─ AIService (Claude API calls)
│  ├─ TTSService (ElevenLabs calls)
│  ├─ ScoringService (Algorithm)
│  ├─ AnalyticsService (Metrics)
│  └─ AuditService (Logging)
│
├─ Middleware
│  ├─ Authentication
│  ├─ Rate Limiting
│  ├─ Error Handling
│  ├─ Logging
│  └─ CORS
│
├─ Database Layer
│  └─ Supabase Client (Connection pooling)
│
└─ External Integrations
   ├─ Anthropic (Claude)
   └─ ElevenLabs (TTS)
```

### 2.3 Database Architecture

```
Supabase PostgreSQL
│
├─ Authentication Schema
│  ├─ users (managed by Supabase Auth)
│  ├─ user_profiles
│  └─ audit_logs
│
├─ Organization Schema
│  ├─ organizations
│  ├─ organization_settings
│  └─ properties
│
├─ Training Schema
│  ├─ scenarios
│  ├─ staff_members
│  ├─ sessions
│  ├─ session_responses
│  └─ scenario_templates
│
├─ Analytics Schema
│  ├─ training_metrics
│  ├─ performance_reports
│  └─ completion_tracking
│
└─ System Schema
   ├─ audit_logs
   ├─ api_logs
   └─ error_logs
```

---

## 3. DATA FLOW ARCHITECTURE

### 3.1 Training Session Lifecycle

```
User Initiates Training
        │
        ├─► Authenticate (JWT Token)
        │
        ├─► Fetch Scenario Details (Database)
        │
        ├─► Generate Guest Prompt (Claude API)
        │   ├─ Input: Scenario context
        │   └─ Output: Initial guest message
        │
        ├─► Convert to Speech (ElevenLabs API)
        │   ├─ Input: Guest message
        │   └─ Output: MP3 audio
        │
        ├─► Display to User
        │
        ├─ [User responds]
        │
        ├─► Send Response to Claude API
        │   ├─ Input: User response + context
        │   └─ Output: Evaluation + next prompt
        │
        ├─► Save to Database
        │   └─ session_responses table
        │
        ├─► Display Feedback
        │
        └─ [Repeat until session ends]
                │
                ├─► Calculate Final Score
                │   ├─ Base score from AI
                │   ├─ Penalties for card usage
                │   └─ Bonuses for quick response
                │
                ├─► Save Session Record
                │   └─ sessions table
                │
                ├─► Generate Report (PDF)
                │
                └─► Log Audit Event
```

### 3.2 API Request Flow

```
Client Request
    │
    ├─► Hit Vercel Edge
    │   └─ Route to appropriate backend
    │
    ├─► Express.js Middleware Chain
    │   ├─ Logger
    │   ├─ CORS
    │   ├─ Rate Limiter
    │   └─ Auth Middleware
    │
    ├─► Route Handler
    │   ├─ Validate Input
    │   ├─ Call Service Layer
    │   └─ Format Response
    │
    ├─► Service Layer
    │   ├─ Business Logic
    │   ├─ Database Queries
    │   └─ External API Calls
    │
    ├─► Database (Supabase)
    │   ├─ Query Execution
    │   ├─ RLS Policy Check
    │   └─ Return Data
    │
    └─► Response to Client
        └─ JSON + Status Code
```

---

## 4. SCALABILITY ARCHITECTURE

### 4.1 Horizontal Scaling

```
┌──────────────┐
│  Load        │
│  Balancer    │
│  (Vercel)    │
└──────┬───────┘
       │
    ┌──┴──┬──────┬──────┐
    │     │      │      │
 ┌──▼─┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐
 │RI1 │ │RI2 │ │RI3 │ │RI4 │  (Render Instances)
 └──┬─┘ └─┬──┘ └─┬──┘ └─┬──┘
    │     │      │      │
    └──┬──┴──┬───┴──┬───┘
       │     │      │
    ┌──▼──┬──▼──┬───▼──┐
    │     │     │      │
┌───┴─────▼─────▼──────▴──────┐
│   Supabase PostgreSQL Cluster│
│   (Connection Pool)          │
└──────────────────────────────┘
```

### 4.2 Database Optimization

- **Connection Pooling**: Vercel → Render → Supabase (10-20 connections)
- **Caching Layer**: Redis (optional for frequently accessed data)
- **Query Optimization**: Indexes on frequently filtered columns
- **Partitioning**: Sessions table partitioned by month
- **Replication**: Read replicas for analytics queries

### 4.3 Resource Limits per Organization

```
Feature                    Free Plan    Pro Plan      Enterprise
─────────────────────────  ──────────   ────────────  ──────────
Concurrent Users           10           100           Unlimited
Monthly Training Sessions  500          10,000        Unlimited
Storage (GB)               5            100           Unlimited
API Requests/Month         50,000       1,000,000     Unlimited
Support                    Email        Priority      Dedicated
Custom Integrations        No           Yes           Yes
SLA Uptime                 99%          99.5%         99.9%
```

---

## 5. SECURITY ARCHITECTURE

### 5.1 Authentication Flow

```
┌─────────────────┐
│  User Inputs    │
│  Credentials    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  Rate Limit Check        │
│  (Max 5 attempts/15min)  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Supabase Auth.signIn()  │
│  (Bcrypt password check) │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    │          │
  Success    Failure
    │          │
    ▼          ▼
┌────────┐  ┌─────────┐
│ JWT    │  │ Log     │
│ Token  │  │ Attempt │
└────┬───┘  │ & Lock  │
     │      └─────────┘
     ▼
┌──────────────────────┐
│ Fetch User Profile   │
│ & Permissions (RLS)  │
└──────────────────────┘
```

### 5.2 Data Protection Layers

```
┌─ Transport Layer
│  └─ HTTPS/TLS 1.3
│
├─ Application Layer
│  ├─ JWT Token Validation
│  ├─ Rate Limiting
│  └─ Input Validation
│
├─ Database Layer
│  ├─ Row-Level Security (RLS)
│  ├─ Encryption at Rest
│  └─ Audit Logging
│
└─ Infrastructure Layer
   ├─ VPC (Supabase)
   ├─ DDoS Protection (Vercel)
   └─ Firewall Rules
```

---

## 6. DEPLOYMENT ARCHITECTURE

### 6.1 Environment Configuration

```
Development
├─ Local machine
├─ React dev server (Vite)
├─ Local backend (Express)
└─ Supabase local (optional)

Staging
├─ Vercel (Preview)
├─ Render (staging)
└─ Supabase (staging environment)

Production
├─ Vercel (Production)
├─ Render (Production)
└─ Supabase (Production)
```

### 6.2 CI/CD Pipeline

```
Git Push
    │
    ├─► GitHub Actions
    │   ├─ Build Check
    │   ├─ Lint & Format
    │   ├─ Type Check
    │   ├─ Tests
    │   └─ Security Scan
    │
    ├─ Preview Environment
    │  └─ Vercel (Auto Deploy)
    │
    └─ Manual Approval → Merge
         │
         ├─► Production Deployment
         │   ├─ Vercel
         │   ├─ Render
         │   └─ Smoke Tests
         │
         └─► Monitor
             ├─ Error Tracking
             ├─ Performance
             └─ User Activity
```

---

## 7. MONITORING & OBSERVABILITY

### 7.1 Monitoring Stack

```
Application Metrics
├─ Response Time (API)
├─ Error Rate
├─ Request Volume
└─ User Sessions

Infrastructure Metrics
├─ CPU Usage
├─ Memory Usage
├─ Disk Space
└─ Network I/O

Database Metrics
├─ Query Time
├─ Connection Count
├─ Row Count
└─ Backup Status

External Services
├─ Claude API Status
├─ ElevenLabs API Status
└─ Third-party Uptime
```

### 7.2 Alerting Thresholds

```
Alert Type              Threshold        Action
─────────────────────   ─────────────    ──────────────
API Error Rate          > 1%             Page on-call
Response Time P95       > 1 second        Investigate
Database Connection     > 80%             Scale up
Claude API Quota        > 90%             Alert admin
Uptime SLA              < 99.9%           Root cause analysis
```

---

## 8. DISASTER RECOVERY

### 8.1 Backup Strategy

```
Backup Frequency       Daily (Automated)
Backup Location        Supabase + Regional
Retention Period       30 days
Recovery Time Obj.     4 hours
Recovery Point Obj.    1 hour
```

### 8.2 Failover Plan

```
Component Failure       Recovery Action
─────────────────      ──────────────────────
Vercel Outage          Render static assets
Render Instance        Auto-scale replicas
Supabase Down          Use read replica
Claude API Quota       Queue requests
ElevenLabs Outage      Use browser TTS fallback
```

---

## 9. COMPLIANCE & STANDARDS

### 9.1 Certifications & Standards

- ✅ **SOC 2 Type II**: Supabase, Vercel
- ✅ **ISO 27001**: Infrastructure
- ✅ **GDPR Compliant**: Data processing agreement
- ✅ **CCPA Ready**: Data export/deletion
- ✅ **HIPAA Capable**: Encryption available

### 9.2 Data Residency

- **US Data Center**: Default (Supabase)
- **EU Data Center**: Available (GDPR)
- **Data Encryption**: AES-256 at rest

---

## 10. PERFORMANCE TARGETS

```
Metric                          Target
──────────────────────────────  ──────────
Page Load Time (First Paint)    < 1.5 seconds
API Response Time (P95)         < 500ms
Database Query Time             < 100ms
Training Session Start          < 2 seconds
Score Calculation              < 500ms
Report Generation              < 10 seconds
Uptime SLA                     99.9%
Concurrent Users               1000+
```

---

## 11. FUTURE ARCHITECTURE CONSIDERATIONS

- **Microservices**: Separate services for training, analytics, admin
- **GraphQL**: Supplement REST APIs for client flexibility
- **Message Queue**: Bull/Redis for async processing
- **Cache Layer**: Redis for frequently accessed data
- **ML Pipeline**: Custom scoring model training
- **Real-time Analytics**: WebSocket for live dashboards
- **Multi-region**: Deployment across regions

---

**Document Owner**: HOTEL Ready Architecture Team  
**Last Updated**: 2026-06-27  
**Next Review**: 2026-09-27
