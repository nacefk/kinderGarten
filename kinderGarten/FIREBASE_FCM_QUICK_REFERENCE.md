# Firebase FCM Quick Reference

## 📦 Installation

```bash
npm install expo-notifications expo-device firebase
```

## 🔧 Environment Variables (.env.local)

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123
```

## 🚀 Usage Examples

### Initialize in App

```typescript
import { initializeNotifications } from "@/utils/initializeApp";

useEffect(() => {
  initializeNotifications();
}, []);
```

### Send Notification to Classroom

```typescript
import { sendClassroomNotification } from "@/api/notifications";

await sendClassroomNotification({
  classroom_id: 1,
  title: "Activity Added",
  body: "New activity scheduled",
  data: { screen: "calendar" },
});
```

### Send Announcement to All Parents

```typescript
import { sendAnnouncementToParents } from "@/api/notifications";

await sendAnnouncementToParents({
  title: "School Closed Tomorrow",
  body: "School will be closed for holiday",
  data: { type: "announcement" },
});
```

### Send to Specific Users

```typescript
import { sendNotification } from "@/api/notifications";

await sendNotification({
  recipients: [1, 2, 3], // user IDs
  title: "Personal Message",
  body: "You have a new message",
  data: { screen: "messages" },
});
```

### Get Notification History

```typescript
import { getNotificationHistory } from "@/api/notifications";

const notifications = await getNotificationHistory(20);
```

### Mark as Read

```typescript
import { markNotificationAsRead } from "@/api/notifications";

await markNotificationAsRead(notification_id);
```

## 📱 Notification Handling

### Listen to Notifications

Automatic setup in `initializeNotifications()` - just set it up once in your app layout.

### Handle Notification Taps

In `setupNotificationListeners()`)`:

- Receives notification data when user taps
- Can navigate to specific screens
- Handles foreground and background notifications

## 🧪 Testing

### Send Test Notification

```typescript
import { sendTestNotification } from "@/utils/notifications";

await sendTestNotification();
```

### Check Device Token

```typescript
import { registerDeviceToken } from "@/utils/notifications";

const token = await registerDeviceToken();
console.log("Device Token:", token);
```

### Request Permission Again

```typescript
import { requestNotificationPermission } from "@/utils/notifications";

const allowed = await requestNotificationPermission();
```

## 📊 File Structure

```
config/
  firebase.ts                 # Firebase initialization
api/
  notifications.ts            # API calls for notifications
utils/
  notifications.ts            # Notification utilities & listeners
  initializeApp.ts            # App initialization
```

## 🔐 Backend Setup Checklist

- [ ] Install `firebase-admin` and `python-dotenv`
- [ ] Create notifications Django app
- [ ] Add models (DeviceToken, Notification)
- [ ] Add serializers and views
- [ ] Create Firebase utility functions
- [ ] Set up API endpoints
- [ ] Configure Firebase credentials
- [ ] Add to installed apps and URLs
- [ ] Run migrations

## ⚠️ Requirements

- **Physical device** (iOS/Android) - simulator won't receive push tokens
- **Firebase project** - Create at firebase.google.com
- **Firebase credentials** - Service account JSON for backend
- **Environment variables** - Firebase config in .env.local
- **Notification permission** - User must grant permission

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Messaging Docs](https://firebase.google.com/docs/messaging)

## 🆘 Common Issues

| Issue                   | Solution                                  |
| ----------------------- | ----------------------------------------- |
| No token on simulator   | Use physical device only                  |
| Permission denied       | User rejected notification permission     |
| No messages received    | Check Firebase credentials on backend     |
| Token keeps changing    | This is normal - backend should update it |
| Backend not initialized | Check FIREBASE_CREDENTIALS_PATH env var   |

## 💡 Pro Tips

1. Always initialize notifications in app layout
2. Handle both foreground and background notifications
3. Test on actual device before production
4. Monitor Firebase console for delivery rates
5. Store device tokens securely
6. Implement token refresh logic
7. Add notification preferences per user
8. Use categories for different notification types
