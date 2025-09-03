# API Documentation 📡

Complete reference for the Cloudflare Worker API endpoints.

## Base URL

```
https://link.mackhaymond.co
```

## Authentication

All management API endpoints require a GitHub access token in the Authorization header:

```
Authorization: Bearer <github_access_token>
```

## Endpoints

### 🔓 Public Endpoints

#### `GET /{shortcode}`
Redirects to the destination URL.

**Parameters:**
- `shortcode` (path) - The short code for the link

**Response:**
- `301/302` - Redirect to destination URL
- `404` - Link not found

**Example:**
```bash
curl https://link.mackhaymond.co/abc123
# Redirects to destination URL
```

---

### 🔐 Authentication Endpoints

#### `GET /api/auth/github`
Initiates GitHub OAuth flow.

**Query Parameters:**
- `redirect_uri` (optional) - OAuth callback URL

**Response:**
- `302` - Redirect to GitHub OAuth

**Example:**
```bash
curl "https://link.mackhaymond.co/api/auth/github?redirect_uri=http://localhost:5173/auth/callback"
```

#### `GET /api/auth/callback`
Handles GitHub OAuth callback.

**Query Parameters:**
- `code` - OAuth authorization code from GitHub

**Response:**
```json
{
  "access_token": "github_access_token",
  "user": {
    "login": "username",
    "avatar_url": "https://...",
    "id": 12345
  }
}
```

**Error Response:**
```json
{
  "error": "access_denied",
  "error_description": "Only SpyicyDev is authorized to use this service."
}
```

---

### 🔐 Protected Endpoints

All protected endpoints require authentication and user authorization.

#### `GET /api/links`
Get all links.

**Response:**
```json
{
  "abc123": {
    "url": "https://example.com",
    "description": "Example link",
    "redirectType": 301,
    "created": "2025-09-03T16:00:00Z",
    "updated": "2025-09-03T16:00:00Z",
    "clicks": 42,
    "lastClicked": "2025-09-03T17:30:00Z"
  }
}
```

#### `POST /api/links`
Create a new link.

**Request Body:**
```json
{
  "shortcode": "abc123",
  "url": "https://example.com",
  "description": "Optional description",
  "redirectType": 301
}
```

**Response:**
```json
{
  "shortcode": "abc123",
  "url": "https://example.com",
  "description": "Optional description",
  "redirectType": 301,
  "created": "2025-09-03T16:00:00Z",
  "updated": "2025-09-03T16:00:00Z",
  "clicks": 0
}
```

**Error Responses:**
- `400` - Missing shortcode or URL
- `409` - Shortcode already exists

#### `PUT /api/links/{shortcode}`
Update an existing link.

**Parameters:**
- `shortcode` (path) - The short code to update

**Request Body:**
```json
{
  "url": "https://newexample.com",
  "description": "Updated description",
  "redirectType": 302
}
```

**Response:**
```json
{
  "shortcode": "abc123",
  "url": "https://newexample.com",
  "description": "Updated description",
  "redirectType": 302,
  "created": "2025-09-03T16:00:00Z",
  "updated": "2025-09-03T18:00:00Z",
  "clicks": 42
}
```

#### `DELETE /api/links/{shortcode}`
Delete a link.

**Parameters:**
- `shortcode` (path) - The short code to delete

**Response:**
- `204` - Link deleted successfully
- `404` - Link not found

#### `GET /api/links/{shortcode}`
Get a specific link.

**Parameters:**
- `shortcode` (path) - The short code to retrieve

**Response:**
```json
{
  "url": "https://example.com",
  "description": "Example link",
  "redirectType": 301,
  "created": "2025-09-03T16:00:00Z",
  "updated": "2025-09-03T16:00:00Z",
  "clicks": 42,
  "lastClicked": "2025-09-03T17:30:00Z"
}
```

#### `GET /api/user`
Get current authenticated user info.

**Response:**
```json
{
  "login": "SpyicyDev",
  "id": 12345,
  "avatar_url": "https://avatars.githubusercontent.com/u/12345",
  "name": "Display Name"
}
```

---

## Data Models

### Link Object
```typescript
interface Link {
  url: string;                    // Destination URL
  description?: string;           // Optional description
  redirectType: 301 | 302;       // HTTP redirect status
  created: string;                // ISO 8601 timestamp
  updated: string;                // ISO 8601 timestamp
  clicks: number;                 // Total click count
  lastClicked?: string;           // ISO 8601 timestamp of last click
}
```

### User Object
```typescript
interface User {
  login: string;                  // GitHub username
  id: number;                     // GitHub user ID
  avatar_url: string;             // Profile picture URL
  name?: string;                  // Display name
}
```

---

## Error Codes

- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (user not authorized)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (shortcode already exists)
- `500` - Internal Server Error

## Rate Limits

Cloudflare Free Tier limits:
- **100,000 requests/day** total
- **1,000 KV writes/day** (creating/updating links)
- **100,000 KV reads/day** (getting links, redirects)

## CORS

All API endpoints include CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

*For implementation examples, see the management panel source code.*