# Login Troubleshooting Guide

## Issue: Login Not Working

### Original Problem
The login was failing with the following credentials:
- **Username**: `tenant-user`
- **Email**: `user@new-kindergarten.local`
- **Password**: `tenant123`
- **Role**: Director
- **Tenant**: New Kindergarten

### Root Cause
The login form requires a **tenant slug**, not a display name. The tenant slug must be:
- Lowercase letters only
- Numbers (0-9)
- Hyphens (-)
- NO spaces or special characters

**"New Kindergarten" is not a valid slug.**
The correct slug format would be: **"new-kindergarten"**

### What Was Changed

#### 1. **Auto-Conversion of Tenant Names to Slugs** (`utils/validation.ts`)
Added a new helper function `convertToSlug()` that automatically converts any tenant name to the correct slug format:

```typescript
export function convertToSlug(tenantName: string): string {
  return tenantName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")        // Spaces → hyphens
    .replace(/[^a-z0-9-]/g, "")  // Remove special chars
    .replace(/^-+|-+$/g, "");    // Remove leading/trailing hyphens
}
```

**Examples:**
- "New Kindergarten" → "new-kindergarten" ✅
- "Arc-en-Ciel" → "arc-en-ciel" ✅
- "My Favorite Daycare!" → "my-favorite-daycare" ✅

#### 2. **Improved Login Handler** (`app/(authentication)/login.tsx`)
- Now automatically converts tenant input to slug format
- Better validation error messages
- Clearer instructions on the UI
- Detailed error handling for different failure scenarios:
  - 401: Invalid credentials
  - 404: Kindergarten not found
  - 400: Invalid request
  - Network errors: Connection issues

#### 3. **Better User Interface**
- Updated placeholder text: "Kindergarten slug (e.g. new-kindergarten)"
- Enhanced info box with:
  - Clear slug format requirements
  - Example login credentials
  - Format examples

#### 4. **Improved Logging** (`api/auth.ts`)
Added detailed logging for debugging:
- Login attempt timestamp
- API endpoint URL
- HTTP status and error details
- Network error information

### How to Use (Corrected)

#### Option 1: Enter Slug Directly
```
Kindergarten: new-kindergarten
Username: tenant-user
Password: tenant123
```

#### Option 2: Enter Display Name (Auto-Converted)
```
Kindergarten: New Kindergarten  ← Will be auto-converted to "new-kindergarten"
Username: tenant-user
Password: tenant123
```

### Testing the Login

1. **Start the app**:
   ```bash
   npm start
   # or
   expo start
   ```

2. **Fill in the login form**:
   - Kindergarten: `new-kindergarten` (or `New Kindergarten`)
   - Username: `tenant-user`
   - Password: `tenant123`

3. **Submit and observe**:
   - If successful: Redirects to dashboard (admin) or home (parent/teacher)
   - If failed: Shows specific error message

### Debugging

If login still fails, check these in order:

1. **Backend API Running?**
   ```bash
   curl http://192.168.0.37:8000/api/accounts/login/ -X OPTIONS -v
   ```
   Should return 200 or OPTIONS method info (not 404/Connection refused)

2. **Check API URL in Config** (`config/api.ts`):
   ```typescript
   // Should match your backend server
   baseURL: "http://192.168.0.37:8000/api/"
   ```

3. **Verify Credentials Exist** on Backend:
   - Tenant slug: `new-kindergarten`
   - Username: `tenant-user`
   - Password: `tenant123`

4. **Check Network Connection**:
   - Is device on same WiFi as backend?
   - Is firewall blocking port 8000?

5. **Review Console Logs**:
   ```
   ❌ Login error: {
     message: "...",
     status: 401|404|400,
     details: {...}
   }
   ```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid username or password | Wrong credentials | Check username and password |
| Kindergarten not found | Wrong slug | Use correct tenant slug (e.g., new-kindergarten) |
| Cannot connect to server | Backend not running | Start Django backend server |
| Invalid request | Missing fields | Ensure all fields are filled |
| Network error | Network issues | Check WiFi/firewall |

### Success Indicators

✅ **Login Successful When:**
- User redirected to dashboard (admin) or home screen (parent/teacher)
- User role displays correctly
- Navigation works without forcing back to login

### Helpful Tips

1. **Slugs are Case-Insensitive**: "NEW-KINDERGARTEN" and "new-kindergarten" are the same
2. **No Spaces in Slugs**: "new kindergarten" ❌ → "new-kindergarten" ✅
3. **Credentials are Case-Sensitive**: Username and password ARE case-sensitive
4. **Timeout Issues**: If requests timeout, check backend server status and network

---

**Updated**: November 30, 2025  
**Version**: 2.0 (With auto-slug conversion)
