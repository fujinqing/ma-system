---
name: "restful-api-design"
description: "RESTful API design patterns for ma-system. Invoke when user needs API design, endpoint规划, request/response format, or API documentation."
---

# RESTful API Design

RESTful API design patterns for M-A System enterprise management platform.

## API Design Principles

1. **Resource-oriented URLs**: `/api/users`, `/api/departments`
2. **HTTP methods**: GET (read), POST (create), PUT (update), DELETE (remove)
3. **Standard response format**: `{ success, data, message, timestamp }`
4. **Pagination support**: `?page=1&limit=20`
5. **Authentication**: Bearer token in Authorization header

## Response Format

### Success Response
```json
{
  "success": true,
  "data": [],
  "message": "success",
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": 500,
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## API Endpoints

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Get all users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |
| POST | /api/users/login | User login |
| GET | /api/users/profile | Get current user |

### Department Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/departments | Get all departments |
| GET | /api/departments/tree | Get department tree |
| GET | /api/departments/:id | Get department by ID |
| POST | /api/departments | Create department |
| PUT | /api/departments/:id | Update department |
| DELETE | /api/departments/:id | Delete department |

### Customer Management (CRM)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/customers | Get all customers |
| GET | /api/customers/:id | Get customer by ID |
| POST | /api/customers | Create customer |
| PUT | /api/customers/:id | Update customer |
| DELETE | /api/customers/:id | Delete customer |

### Master Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/master-data/customers | Get customer master data |
| GET | /api/master-data/suppliers | Get supplier master data |
| GET | /api/master-data/products | Get product master data |
| POST | /api/master-data/sync | Trigger master data sync |

## Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| page | Page number | ?page=1 |
| limit | Items per page | ?limit=20 |
| search | Search keyword | ?search=keyword |
| status | Filter by status | ?status=active |
| sort | Sort field | ?sort=name |
| order | Sort order (asc/desc) | ?order=desc |

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | application/json |
| Authorization | Yes | Bearer {token} |
| X-Client-Type | No | mobile/web |

## Usage

Invoke this skill when:
- User asks to design new API endpoints
- User needs help with request/response format
- User wants to add pagination or filtering
- User needs API documentation