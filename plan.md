# Native Android Permission Implementation Plan

## 1. Native Manifest Setup
- Create `android/app/src/main/AndroidManifest.xml` to declare the necessary permissions:
    - `PACKAGE_USAGE_STATS` (for app usage tracking)
    - `SYSTEM_ALERT_WINDOW` (for lockout overlay)
    - `BIND_ACCESSIBILITY_SERVICE` (optional, but often used for blocking)
- This ensures Android recognizes the app as needing these permissions.

## 2. Capacitor Permission Bridge (`use-dumbphone.ts`)
- Import `@capacitor/app` and `@capacitor/device`.
- Implement a `checkNativePermissions()` function:
    - Queries the system for the real status of Usage Stats and Overlay permissions.
    - Since these are "special" permissions, it will use a bridge pattern that can be extended with native plugins.
- Implement a `requestNativePermission(id)` function:
    - Handles the logic to trigger the native permission flow.
    - Uses `App.openUrl` or a custom intent bridge to navigate the user to the specific system settings page (since Android requires manual toggle for these permissions).
- Add an `App.addListener('appStateChange')`:
    - Automatically re-checks permissions whenever the app returns to the foreground (e.g., after the user toggles the permission in settings).

## 3. UI Sync & Modal Feedback (`SettingsPage.tsx`)
- Replace the "Security & System" section logic to use the new native status.
- Implement an "Explanation Modal" using Shadcn Dialog:
    - Triggered when a user clicks a "Required" permission.
    - Explains *why* the permission is needed (e.g., "Usage Stats is needed to track your app limits").
    - Provides a "Grant Permission" button that calls the native request function.
- Ensure the UI only updates to "Active" after the native bridge confirms the status.

## 4. State Management
- Update the `PermissionStatus` interface to include `overlay`.
- Ensure all permission statuses are persisted and synced with the actual OS state.
