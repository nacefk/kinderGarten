---
mode: agent
description: Implement push notifications in the Django backend using Firebase Cloud Messaging (FCM) — 2-phase deployment
---

# Implement Push Notifications — Django Backend + VPS Deployment

## Current Situation

- Fresh Ubuntu VPS — nothing deployed yet
- Expo React Native frontend already handles notifications (token registration, receiving, display)
- Need to get the Django API live FIRST, then add notification logic

---

# 🚀 PHASE 1 — Get Django API LIVE on VPS (simple, no Docker)

**Goal**: API accessible at `http://<VPS_IP>:8000/api/` in ~20 minutes

**Skip for now**: ❌ Docker ❌ Redis ❌ Celery ❌ PostgreSQL (use SQLite temporarily)

## Step 1: Install dependencies on VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx git
```

## Step 2: Clone your project & setup virtualenv

```bash
cd /home/ubuntu
git clone <YOUR_REPO_URL> kindergarten-api
cd kindergarten-api

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Step 3: Configure Django settings for VPS

In `settings.py`:

```python
DEBUG = False
ALLOWED_HOSTS = ['<YOUR_VPS_IP>', 'your-domain.com', 'localhost']

# SQLite for now (switch to PostgreSQL in Phase 2)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

STATIC_ROOT = BASE_DIR / 'staticfiles'
```

## Step 4: Migrate & create superuser

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

## Step 5: Test with Gunicorn

```bash
pip install gunicorn
gunicorn your_project.wsgi:application --bind 0.0.0.0:8000
```

Verify: `curl http://<VPS_IP>:8000/api/` — should return a response.

## Step 6: Systemd service (keep it running)

Create `/etc/systemd/system/kindergarten.service`:

```ini
[Unit]
Description=KinderGarten Django API
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/kindergarten-api
ExecStart=/home/ubuntu/kindergarten-api/venv/bin/gunicorn your_project.wsgi:application --bind 127.0.0.1:8000 --workers 3
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable kindergarten
sudo systemctl start kindergarten
sudo systemctl status kindergarten
```

## Step 7: Nginx reverse proxy

Create `/etc/nginx/sites-available/kindergarten`:

```nginx
server {
    listen 80;
    server_name <YOUR_VPS_IP>;  # or your-domain.com

    location /static/ {
        alias /home/ubuntu/kindergarten-api/staticfiles/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/kindergarten /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Now your API is live at `http://<VPS_IP>/api/`

## Step 8: Update frontend API URL

In your Expo app `config/api.ts`, change the production baseURL:

```typescript
production: {
    baseURL: "http://<YOUR_VPS_IP>/api/",
    timeout: 15000,
},
```

---

# 🔔 PHASE 2 — Add Push Notifications

**Goal**: When events happen (new message, new event, extra-hour request), the backend sends FCM push notifications to the user's device.

## Required Python Packages

```bash
pip install firebase-admin
```

Add to `requirements.txt`:

```
firebase-admin>=6.0.0
```

## Firebase Admin SDK Setup

Copy `sghiri-app-firebase-adminsdk-fbsvc-5f33c628b5.json` to your VPS project root.

In your Django settings or a dedicated `firebase_init.py`:

```python
import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate("/home/ubuntu/kindergarten-api/sghiri-app-firebase-adminsdk-fbsvc-5f33c628b5.json")
firebase_admin.initialize_app(cred)
```

Call this once at app startup (in `apps.py` ready() method or `wsgi.py`).

## Models

Create a `notifications` Django app:

```bash
python manage.py startapp notifications
```

### `notifications/models.py`

```python
from django.db import models
from django.conf import settings

class DeviceToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='device_tokens')
    token = models.TextField(unique=True)
    platform = models.CharField(max_length=10, choices=[('android', 'Android'), ('ios', 'iOS')])
    token_type = models.CharField(max_length=10, choices=[('fcm', 'FCM'), ('apns', 'APNs')])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'token')

    def __str__(self):
        return f"{self.user} - {self.platform} ({self.token[:20]}...)"


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient} - {self.title}"
```

## FCM Utility

### `notifications/fcm.py`

```python
from firebase_admin import messaging
from .models import DeviceToken

def send_push_notification(user_ids: list, title: str, body: str, data: dict = None):
    """Send push notification to users via FCM."""
    tokens = list(
        DeviceToken.objects.filter(user_id__in=user_ids, is_active=True)
        .values_list('token', flat=True)
    )

    if not tokens:
        return None

    message = messaging.MulticastMessage(
        tokens=tokens,
        notification=messaging.Notification(title=title, body=body),
        data={k: str(v) for k, v in (data or {}).items()},
        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                channel_id="default",
                sound="default",
            ),
        ),
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(sound="default", badge=1),
            ),
        ),
    )

    response = messaging.send_each_for_multicast(message)

    # Deactivate invalid tokens
    for i, send_response in enumerate(response.responses):
        if send_response.exception:
            error_code = send_response.exception.code
            if error_code in ('NOT_FOUND', 'UNREGISTERED', 'INVALID_ARGUMENT'):
                DeviceToken.objects.filter(token=tokens[i]).update(is_active=False)

    return response
```

## API Endpoints

The frontend expects these endpoints:

### 1. `POST /api/notifications/register-device/`

**Request body:**

```json
{
  "token": "fcm_or_apns_token_string",
  "platform": "android" | "ios",
  "token_type": "fcm" | "apns"
}
```

- Store the device token linked to the authenticated user
- If token already exists, update it (upsert)

### 2. `POST /api/notifications/send/`

**To specific users:**

```json
{ "recipients": [1, 2, 3], "title": "...", "body": "...", "data": {} }
```

**To a classroom:**

```json
{ "recipients": "classroom", "classroom_id": 1, "title": "...", "body": "...", "data": {} }
```

**To all parents:**

```json
{ "recipients": "parents", "title": "...", "body": "...", "data": {} }
```

**To everyone:**

```json
{ "recipients": "all", "title": "...", "body": "...", "data": {} }
```

### 3. `GET /api/notifications/`

- Returns notification history for authenticated user
- Supports `?limit=20`

### 4. `PATCH /api/notifications/<id>/read/`

- Marks a notification as read

## Automatic Notification Triggers

Add these in views or signals — **send push automatically** when these events happen:

### 1. New Chat Message (`POST /api/chat/messages/`)

Send push to the other conversation participant:

- **Title**: Sender's name
- **Body**: Message text (truncated 100 chars)
- **Data**: `{ "screen": "chat", "conversation_id": "<id>" }`

### 2. New Event Created (`POST /api/planning/events/`)

Notify parents in that class:

- **Title**: "New Event"
- **Body**: Event title + date
- **Data**: `{ "screen": "calendar", "event_id": "<id>" }`

### 3. Extra Hours Request (`POST /api/attendance/extra-hours/`)

Notify admins:

- **Title**: "Extra Hours Request"
- **Body**: "{Child name} - {date}"
- **Data**: `{ "screen": "extra-hours", "request_id": "<id>" }`

### 4. Extra Hours Approved/Rejected

Notify the parent:

- **Title**: "Extra Hours {Approved/Rejected}"
- **Body**: "{Child name} - {date}"
- **Data**: `{ "screen": "extra-hours" }`

### 5. Absence Reported

Notify the class admin:

- **Title**: "Absence Reported"
- **Body**: "{Child name} - {date} - {reason}"
- **Data**: `{ "screen": "attendance" }`

## Implementation Checklist

### Phase 1 — Deploy API

1. [ ] Install Python, Nginx on VPS
2. [ ] Clone repo, create venv, pip install
3. [ ] Configure ALLOWED_HOSTS, migrate, collectstatic
4. [ ] Test with Gunicorn
5. [ ] Create systemd service
6. [ ] Configure Nginx reverse proxy
7. [ ] Verify API is accessible at `http://<VPS_IP>/api/`
8. [ ] Update frontend API URL

### Phase 2 — Notifications

9. [ ] Install `firebase-admin`, copy service account JSON to VPS
10. [ ] Create `notifications` app, models, migrate
11. [ ] Create `fcm.py` utility
12. [ ] Create views: RegisterDevice, SendNotification, NotificationList, MarkRead
13. [ ] Add URL routes under `/api/notifications/`
14. [ ] Add trigger in chat message creation
15. [ ] Add trigger in event creation
16. [ ] Add trigger in extra-hours request/update
17. [ ] Add trigger in absence report
18. [ ] Test with real device

### Phase 3 — Production hardening (later)

19. [ ] Switch SQLite → PostgreSQL
20. [ ] Add SSL with Certbot (Let's Encrypt)
21. [ ] Add Celery + Redis for async notification sending
22. [ ] Add Docker (optional)
23. [ ] Set `DEBUG = False` with proper logging

## Important Notes

- FCM `data` values must ALL be strings (convert ints/booleans)
- Handle token expiration: deactivate on `UNREGISTERED` / `NOT_FOUND`
- Only send to `is_active=True` tokens
- Auth via JWT (SimpleJWT already set up)
- Keep notification history for in-app notification list
- Rate limit `/api/notifications/send/` (admin-only or throttled)
- **Do NOT expose the Firebase service account JSON publicly**
