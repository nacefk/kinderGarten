# Firebase Cloud Messaging (FCM) Setup Guide

## Overview

This guide walks you through setting up Firebase Cloud Messaging with your Expo React Native app.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `kinderGarten-notifications`
4. Follow the setup wizard
5. Choose your region

## Step 2: Get Firebase Web Config

1. In Firebase console, go to Project Settings (⚙️ icon)
2. Click "Your apps" section
3. Click "Add app" → Choose "Web"
4. Copy the config object:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-ABC123",
};
```

## Step 3: Enable Cloud Messaging

1. In Firebase console:
   - Go to "Cloud Messaging" tab at the top
   - Enable the API if prompted
   - Copy **Server API Key** (you'll need this for backend)

## Step 4: Create Service Account (for Backend)

1. In Firebase console:
   - Go to Project Settings → "Service Accounts" tab
   - Click "Generate New Private Key"
   - Save the JSON file securely (you'll use this on your backend)

## Step 5: Set Environment Variables

In your app's `.env.local` file:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123
```

## Step 6: Update app.json (Expo Configuration)

Add your project ID to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34
          }
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

To get your EAS Project ID:

1. Run: `eas project:info`
2. Copy the Project ID

## Step 7: Install Dependencies

```bash
npm install expo-notifications expo-device firebase
```

Or with yarn:

```bash
yarn add expo-notifications expo-device firebase
```

## Step 8: Backend Setup (Django)

### Install Firebase Admin SDK

```bash
pip install firebase-admin python-dotenv
```

### Create Django App for Notifications

```bash
python manage.py startapp notifications
```

### notifications/models.py

```python
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class DeviceToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='device_token')
    token = models.TextField(unique=True)  # Expo/Firebase push token
    device_type = models.CharField(max_length=50, choices=[('ios', 'iOS'), ('android', 'Android')])
    device_name = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.device_type}"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.email}"
```

### notifications/serializers.py

```python
from rest_framework import serializers
from .models import DeviceToken, Notification

class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ['id', 'token', 'device_type', 'device_name']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'body', 'data', 'read_at', 'created_at']
```

### notifications/views.py

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DeviceToken, Notification
from .serializers import DeviceTokenSerializer, NotificationSerializer
from .utils import send_push_notification

class DeviceTokenViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def register_device(self, request):
        """Register device token for push notifications"""
        token = request.data.get('device_token')
        device_type = request.data.get('device_type', 'ios')
        device_name = request.data.get('device_name', '')

        device, created = DeviceToken.objects.update_or_create(
            user=request.user,
            defaults={
                'token': token,
                'device_type': device_type,
                'device_name': device_name,
            }
        )

        return Response({
            'success': True,
            'message': 'Device token registered',
            'created': created
        })


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def send(self, request):
        """Send notification to users"""
        recipients = request.data.get('recipients')  # user IDs or 'all'
        title = request.data.get('title')
        body = request.data.get('body')
        data = request.data.get('data', {})

        if recipients == 'all':
            # Send to all users
            devices = DeviceToken.objects.all()
        else:
            # Send to specific users
            devices = DeviceToken.objects.filter(user_id__in=recipients)

        sent_count = 0
        for device in devices:
            try:
                send_push_notification(
                    device.token,
                    title=title,
                    body=body,
                    data=data
                )
                sent_count += 1
            except Exception as e:
                print(f"Failed to send to {device.user.email}: {e}")

        return Response({
            'success': True,
            'sent_count': sent_count,
            'total_devices': devices.count()
        })

    @action(detail=False, methods=['patch'])
    def mark_read(self, request):
        """Mark notification as read"""
        notification_id = request.data.get('notification_id')
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.read_at = timezone.now()
            notification.save()
            return Response({'success': True})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
```

### notifications/utils.py

```python
import firebase_admin
from firebase_admin import credentials, messaging
import os
from pathlib import Path

# Initialize Firebase (use your service account JSON)
FIREBASE_CREDENTIALS = os.getenv('FIREBASE_CREDENTIALS_PATH')

if FIREBASE_CREDENTIALS and os.path.exists(FIREBASE_CREDENTIALS):
    cred = credentials.Certificate(FIREBASE_CREDENTIALS)
    firebase_admin.initialize_app(cred)
    print("✅ Firebase initialized")
else:
    print("⚠️ Firebase credentials not found")


def send_push_notification(device_token, title, body, data=None):
    """Send push notification via Firebase"""
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=device_token,
        )

        response = messaging.send(message)
        print(f"✅ Message sent: {response}")
        return response
    except Exception as e:
        print(f"❌ Failed to send message: {e}")
        raise
```

### settings.py

```python
INSTALLED_APPS = [
    # ... other apps
    'notifications',
]

# Firebase credentials path
FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'path/to/serviceAccountKey.json')
```

### urls.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from notifications.views import DeviceTokenViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'device-tokens', DeviceTokenViewSet, basename='device-token')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('api/notifications/', include(router.urls)),
]
```

## Step 9: Integrate in Your App

In `app/_layout.tsx`:

```typescript
import { initializeNotifications } from "@/utils/initializeApp";
import { useEffect } from "react";

export default function Layout() {
  useEffect(() => {
    // Initialize push notifications on app start
    initializeNotifications();
  }, []);

  // ... rest of your layout
}
```

## Step 10: Send Test Notification

From frontend:

```typescript
import { sendClassroomNotification } from "@/api/notifications";

// Send notification
await sendClassroomNotification({
  classroom_id: 1,
  title: "Activity Update",
  body: "New activity added to the schedule",
  data: { screen: "calendar" },
});
```

## Troubleshooting

### Token not registering

- ✅ Ensure you're running on physical device (simulator doesn't get tokens)
- ✅ Check notification permissions are granted
- ✅ Verify EAS project ID in `app.json`

### Notifications not receiving

- ✅ Check device token is saved in database
- ✅ Verify Firebase credentials on backend
- ✅ Check your Firebase project limits haven't been exceeded

### Device token keeps changing

- This is normal; tokens can refresh. Your backend should update existing device.

## Next Steps

1. Set up notification center UI
2. Add notification categories (announcement, message, reminder)
3. Set up scheduled notifications
4. Add notification preferences per user
5. Create notification analytics dashboard
