# HOTEL Ready - API Documentation

**Version**: 1.0.0  
**Base URL**: `https://api.hotel-ready.com/api`  
**Authentication**: Bearer JWT Token  
**Content-Type**: `application/json`

---

## Authentication

All API requests require a JWT token obtained from Supabase Auth.

```bash
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### Training Sessions

#### POST /training/sessions/start
Start a new training session.

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
    "title": "Handle Angry Guest",
    "department": "Front Office"
  },
  "guest_prompt": "I'm very upset about my room..."
}
```

#### POST /training/sessions/{id}/respond
Submit a response in a session.

**Request:**
```json
{
  "response": "I apologize for the inconvenience..."
}
```

**Response (200):**
```json
{
  "score": 85,
  "feedback": "Good empathy...",
  "next_prompt": "OK, here's the issue..."
}
```

#### POST /training/sessions/{id}/end
End and score a session.

**Response (200):**
```json
{
  "final_score": 87,
  "duration_seconds": 240,
  "cards_used": 1
}
```

### Analytics

#### GET /analytics/organization/{id}
Get organization analytics.

**Query Parameters:**
- `start_date`: ISO 8601
- `end_date`: ISO 8601
- `department`: Optional filter

**Response (200):**
```json
{
  "total_sessions": 150,
  "average_score": 84,
  "staff_count": 25
}
```

### Admin

#### POST /admin/organizations/{id}/staff
Create a staff member.

**Request:**
```json
{
  "name": "John Smith",
  "department": "Front Office",
  "position": "Receptionist",
  "pin": "1234"
}
```

#### PUT /admin/organizations/{id}/pin-expiry
Update PIN expiry.

**Request:**
```json
{
  "pin_expires_at": "2026-12-31T23:59:59Z"
}
```

---

## Error Handling

All errors return a standardized response:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Description of error",
    "status": 400
  }
}
```

**Error Codes:**
- `INVALID_REQUEST` (400): Bad request
- `UNAUTHORIZED` (401): Missing/invalid token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT` (429): Too many requests
- `SERVER_ERROR` (500): Internal server error

---

## Rate Limits

- **Standard**: 1000 requests/hour per user
- **Training API**: 100 requests/minute per session
- **Admin API**: 100 requests/hour per organization

---

**Last Updated**: 2026-06-27
