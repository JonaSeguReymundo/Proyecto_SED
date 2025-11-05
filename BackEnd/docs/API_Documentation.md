# Car Rental API – Backend Documentation

## AUTH ROUTES
| Method | Endpoint | Role | Description |
|--------|-----------|------|--------------|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login user and get token |
| GET | `/profile` | Authenticated | Returns user profile |

---

## CAR ROUTES
| Method | Endpoint | Role | Description |
|--------|-----------|------|--------------|
| GET | `/cars` | Authenticated | Get all cars |
| POST | `/cars` | Admin / SuperAdmin | Create car(s) |
| PUT | `/cars/:id` | Admin / SuperAdmin | Update car |
| DELETE | `/cars/:id` | Admin / SuperAdmin | Delete car |

---

## BOOKINGS ROUTES
| Method | Endpoint | Role | Description |
|--------|-----------|------|--------------|
| POST | `/bookings` | User | Create booking(s) |
| GET | `/bookings` | User | Get user bookings |
| GET | `/bookings/all` | Admin / SuperAdmin | Get all bookings |
| PUT | `/bookings/:id` | User / Admin / SuperAdmin | Update booking dates |
| DELETE | `/bookings/:id` | User / Admin / SuperAdmin | Cancel booking |

---

## LOGS ROUTES
| Method | Endpoint | Role | Description |
|--------|-----------|------|--------------|
| GET | `/logs` | Admin / SuperAdmin | View activity logs |

---

## ⚙️ EXAMPLES

### POST /auth/register
```json
{
  "username": "admin",
  "password": "123456",
  "role": "superadmin"
}
