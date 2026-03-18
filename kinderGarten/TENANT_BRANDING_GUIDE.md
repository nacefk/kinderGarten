# Tenant Branding Guide

This guide shows how to use the tenant's logo and primary color throughout your app.

## Quick Reference

### 1. **Use Primary Color in Components**

```tsx
import { useAppStore } from "@/store/useAppStore";
import { getColors } from "@/config/colors";

export function MyComponent() {
  const { tenant } = useAppStore();
  const colors = getColors(tenant?.primary_color);

  return (
    <View style={{ backgroundColor: colors.accent }}>
      <Text>This uses the tenant's primary color</Text>
    </View>
  );
}
```

### 2. **Display Tenant Logo**

```tsx
import { useAppStore } from "@/store/useAppStore";
import { Image } from "react-native";

export function TenantLogo() {
  const { tenant } = useAppStore();

  if (!tenant?.logo) {
    return <Text>No logo available</Text>;
  }

  return (
    <Image
      source={{ uri: tenant.logo }}
      style={{ width: 200, height: 100, resizeMode: "contain" }}
    />
  );
}
```

### 3. **Style Buttons with Tenant Color**

```tsx
import { useAppStore } from "@/store/useAppStore";
import { getColors } from "@/config/colors";
import { Pressable, Text } from "react-native";

export function TenantButton({ onPress, children }) {
  const { tenant } = useAppStore();
  const colors = getColors(tenant?.primary_color);

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.accent,
        padding: 12,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: "#FFF" }}>{children}</Text>
    </Pressable>
  );
}
```

### 4. **Dynamic Theme Provider (for screens)**

```tsx
import { useAppStore } from "@/store/useAppStore";
import { getColors } from "@/config/colors";
import { ScrollView } from "react-native";

export function MyScreen() {
  const { tenant } = useAppStore();
  const colors = getColors(tenant?.primary_color);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* Content with dynamic colors */}
    </ScrollView>
  );
}
```

## Data Flow

```
Backend (/api/tenant/)
    ↓
getTenant() in api/tenant.ts
    ↓
useAppStore.actions.fetchTenant()
    ↓
useAppStore.tenant (stored)
    ↓
Components access via useAppStore()
    ↓
getColors(tenant?.primary_color) for styling
```

## Available Tenant Properties

```ts
interface TenantData {
  id: number; // Tenant ID
  name: string; // Tenant name
  slug: string; // URL-friendly name
  created_at: string; // Creation date
  is_active: boolean; // Is tenant active
  logo: string | null; // URL to logo image
  primary_color: string | null; // Hex color code (e.g., "#FF5733")
}
```

## Color Palette

The `getColors()` function returns:

```ts
{
  background: "#FAF8F5",           // Screen background
  cardBackground: "#FFFFFF",       // Card/container background
  accent: "#C6A57B",               // PRIMARY TENANT COLOR (dynamic)
  accentLight: "#EAF1FB",          // Light accent for highlights
  textDark: "#374151",             // Dark text
  text: "#4B5563",                 // Standard text
  textLight: "#9CA3AF",            // Muted/secondary text
  success: "#16A34A",              // Success states
  error: "#DC2626",                // Error states
  warning: "#EAB308",              // Warning states
}
```

## Examples: Using Tenant Color

### Header with Logo and Color

```tsx
import { View, Image, Text } from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { getColors } from "@/config/colors";

export function HeaderWithBranding() {
  const { tenant } = useAppStore();
  const colors = getColors(tenant?.primary_color);

  return (
    <View style={{ backgroundColor: colors.accent, padding: 16 }}>
      {tenant?.logo && (
        <Image source={{ uri: tenant.logo }} style={{ width: 150, height: 60, marginBottom: 16 }} />
      )}
      <Text style={{ color: "#FFF", fontSize: 20, fontWeight: "bold" }}>
        Welcome to {tenant?.name}
      </Text>
    </View>
  );
}
```

### Themed Card

```tsx
import { View, Text } from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { getColors } from "@/config/colors";

export function ThemedCard({ title, children }) {
  const { tenant } = useAppStore();
  const colors = getColors(tenant?.primary_color);

  return (
    <View
      style={{
        backgroundColor: colors.cardBackground,
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
        padding: 16,
        borderRadius: 8,
        marginVertical: 8,
      }}
    >
      <Text style={{ color: colors.textDark, fontWeight: "bold" }}>{title}</Text>
      <Text style={{ color: colors.text, marginTop: 8 }}>{children}</Text>
    </View>
  );
}
```

## Testing

To test tenant branding:

1. Check that tenant data loads on app startup (check console logs)
2. Verify colors change when you update the tenant's primary_color in the backend
3. Test that logo displays correctly (check CORS if using remote URL)

## Notes

- Tenant data is fetched on app startup and stored in Zustand
- Data persists across app sessions via AsyncStorage
- If backend returns no logo/color, defaults are used
- The logo URL must be publicly accessible (CORS-enabled)
