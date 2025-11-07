# 🔐 Development Credentials

**⚠️ CRITICAL: DEVELOPMENT ENVIRONMENT ONLY**

These credentials are for local development and testing purposes only. **NEVER** use these passwords in production environments.

## Login Credentials

### 👨‍💼 Manager Account
```
Email:    manager@example.com
Password: manager123
Role:     manager
```
**Access Level:** Full platform access
- Manage all trailers and assets
- View all investor portfolios
- Generate financial reports
- Access audit logs
- Create broker dispatches
- Configure GPS devices

---

### 💰 Investor Account #1
```
Email:    investor@example.com
Password: investor123
Role:     investor
```
**Access Level:** Portfolio view only
- **Portfolio:** 4 active shares
  - TR001: $50,000 (2% monthly return)
  - TR002: $55,000 (2% monthly return)
  - TR003: $48,000 (2% monthly return)
  - TRuxPq: $55,000 (2% monthly return)
- View own shares and payment history
- Track own assets via GPS
- Download reports

---

### 💰 Investor Account #2
```
Email:    investor2@example.com
Password: investor123
Role:     investor
```
**Access Level:** Portfolio view only
- **Portfolio:** No shares (empty account)
- Suitable for testing onboarding flow
- Can view available assets

---

## Database Statistics

### Current Data
- **Users:** 3 total (1 manager, 2 investors)
- **Trailers:** 10 assets in fleet
- **Active Shares:** 4 shares
- **Total Invested:** $208,000
- **Monthly Returns:** $4,160 (2% of $208,000)
- **Payment Records:** 12 historical payments
- **Audit Logs:** 141 activity records

### Test Scenarios

**Test Manager Access:**
1. Login as manager@example.com
2. Create new trailer asset
3. Allocate to specific investor or open quotation
4. Generate financial reports
5. Track all GPS locations

**Test Investor Access:**
1. Login as investor@example.com
2. View 4-share portfolio
3. Check payment history
4. Track asset locations
5. Download PDF reports

**Test Empty Investor:**
1. Login as investor2@example.com
2. Browse available assets
3. Test restricted access (should not see manager features)

---

## Password Reset

If you need to reset development passwords to these defaults:

```bash
tsx scripts/reset-dev-passwords.ts
```

This script will:
- Hash new passwords using bcrypt
- Update all 3 user accounts
- Display confirmation with credentials
- Ensure development environment is ready

---

## Security Notes

1. **Development Only:** These credentials are bcrypt-hashed but use simple passwords
2. **Never Commit Plaintext:** This file is for reference only
3. **Production:** Use strong, unique passwords and proper secret management
4. **Rotation:** Change these if ever exposed or shared outside dev team
5. **2FA:** Production should require multi-factor authentication

---

## API Testing

Use these credentials with tools like Postman, Insomnia, or cURL:

```bash
# Login as manager
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"manager123"}'

# Login as investor
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"investor@example.com","password":"investor123"}'
```

---

**Last Updated:** November 7, 2025
**Environment:** Development
**Status:** Active ✅
