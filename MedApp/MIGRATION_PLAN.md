# MedApp Migration & Architecture Implementation Plan

This document details the migration of the medication reminder functionality from the legacy `mobile` project into the newly created CLI project **`MedApp`** (`react-native` v0.87.1 / React 19), with a clean, modern, and reusable component-based UI design.

---

## 1. Objectives & Scope
1. **Full Feature Parity**:
   - Authentication (Login with email/phone, token refresh, logout, session restoration).
   - Senior / Caregiver / Independent Adult dashboards.
   - Today's medication schedules & dose items (`Taken`, `Snooze 15m`, `Skip`).
   - Alarm configuration indicators (Sound, Volume, Vibrate).
   - Emergency contacts & offline synchronization cache.
   - Dose history and adherence logs.
2. **Clean & Modern UI**:
   - Modern, high-contrast, accessible typography and color tokens.
   - Streamlined, professional layouts that look polished across phone screen sizes.
3. **Reusable Design System (`MedApp/src/components/common/`)**:
   - Complete set of modular, single-responsibility components (Dropdown, Calendar/Date Picker, Time Picker, Modal/Dialog, Input, Button, Loader, Toast).
   - Consistent reuse across screens to eliminate duplicated UI code.

---

## 2. Dependency Audit & Installation in `MedApp`
The current `MedApp/package.json` contains bare React Native 0.87. We need to install and configure the necessary supporting libraries:
- **Navigation**: `@react-navigation/native`, `@react-navigation/stack`, `react-native-screens`, `react-native-gesture-handler`.
- **Storage**: `@react-native-async-storage/async-storage`.
- **Networking**: `axios`.
- **Icons / Design**: Vector icons or accessible SVG/lucide icons adapted for React Native.

---

## 3. Directory & Architecture Structure in `MedApp`
```
MedApp/src/
├── components/
│   ├── common/                  # Core Reusable UI Component Library
│   │   ├── CustomButton.tsx     # Primary, secondary, danger, icon, large/compact variants
│   │   ├── CustomTextInput.tsx  # Accessible input with label, icons, error messages
│   │   ├── CustomDropdown.tsx   # Custom selectable dropdown / picker
│   │   ├── CustomDatePicker.tsx # Calendar date selector modal/strip
│   │   ├── CustomTimePicker.tsx # 12-hour AM/PM time picker
│   │   ├── CustomDateTimePicker.tsx # Combined date & time selector
│   │   ├── CustomModal.tsx      # Standardized animated modal dialog with action buttons
│   │   ├── CustomLoader.tsx     # Fullscreen & inline spinner
│   │   ├── CustomToast.tsx      # In-app toast / banner notifications
│   │   └── CustomCard.tsx       # Elevated surface card container
│   ├── DoseCard.tsx             # Reusable medication dose card with actions
│   ├── EmergencyBanner.tsx      # Senior emergency contact bar
│   └── OfflineSyncBanner.tsx    # Connectivity state indicator
├── constants/
│   ├── roles.js
│   ├── theme.ts                 # Unified modern color palette, radius, typography
│   └── soundList.ts
├── context/
│   ├── AuthContext.tsx          # Session management & token storage
│   └── ToastContext.tsx         # Global toast/alert management
├── navigation/
│   └── AppNavigator.tsx         # Stack navigation (Auth flow & Main flow)
├── screens/
│   ├── LoginScreen.tsx          # Modern login screen using CustomTextInput & CustomButton
│   ├── ElderlyHomeScreen.tsx    # Senior / Personal today doses using DoseCard
│   ├── AddMedicationScreen.tsx  # Add medicine & schedule with custom pickers
│   └── HistoryScreen.tsx        # Dose history with Date filter
├── services/
│   ├── api.ts                   # Axios client with adb reverse localhost:5000 & logging
│   ├── authService.ts
│   └── doseService.ts
├── storage/
│   └── offlineStorage.ts        # Offline SQLite / AsyncStorage dose queue
└── types/
    ├── auth.ts
    ├── dose.ts
    ├── medication.ts
    └── navigation.ts
```

---

## 4. Phase-by-Phase Execution Plan

### Phase 1: Dependencies & Android Manifest Setup
1. Install required packages in `MedApp`:
   ```powershell
   npm install @react-navigation/native @react-navigation/stack react-native-screens react-native-gesture-handler @react-native-async-storage/async-storage axios
   ```
2. Enable `android:usesCleartextTraffic="true"` in `MedApp/android/app/src/main/AndroidManifest.xml` to ensure clean local development connectivity (`http://localhost:5000`).
3. Set up `global.originalXMLHttpRequest` in `MedApp/index.js` for Chrome DevTools Network tab inspection.

### Phase 2: Core Foundation & Reusable Component Library
1. Migrate and refine `theme.ts` with modern tokens (radii, shadows, accessible colors).
2. Build the reusable components in `MedApp/src/components/common/`:
   - **`CustomButton`**: States (loading, disabled, primary, outline, danger).
   - **`CustomTextInput`**: Floating or clean top labels, secure entry toggle, error text.
   - **`CustomDropdown` / `CustomSelect`**: Smooth modal/popover selection without clumsy native pickers.
   - **`CustomTimePicker`**: 12-hour AM/PM format matching IST preferences.
   - **`CustomDatePicker`** & **`CustomDateTimePicker`**: Clean calendar date selection.
   - **`CustomModal`**: Backdrop blur, header with close action, and sticky footer buttons.
   - **`CustomLoader`**: Sleek pulse and spin indicators.
   - **`CustomToast`**: Context-driven alert toasts (success, warning, error).

### Phase 3: Services, Storage & Context Migration
1. Migrate `types/` (`auth.ts`, `dose.ts`, `medication.ts`, `navigation.ts`).
2. Migrate `services/api.ts` with:
   - Base URL pointing to `http://localhost:5000/api/v1`.
   - Comprehensive request and response logging for Chrome DevTools.
   - Token auto-refresh interceptor.
3. Migrate `storage/offlineStorage.ts` for caching today's doses offline.
4. Migrate `context/AuthContext.tsx` with safe token extraction and state handlers.

### Phase 4: Screens & Feature Migration
1. **`LoginScreen`**: Rebuilt using `CustomTextInput`, `CustomButton`, and `CustomToast`.
2. **`ElderlyHomeScreen`**: Rebuilt using `DoseCard`, `CustomLoader`, and `EmergencyBanner`.
3. **`HistoryScreen`**: History timeline with `CustomDatePicker` filtering.
4. **`AddMedicationScreen` / Modal**: Create/edit medication schedules using `CustomDropdown`, `CustomTimePicker`, and `CustomButton`.

### Phase 5: Navigation & App Entry Integration
1. Wire up `AppNavigator.tsx` with smooth transitions.
2. Update `MedApp/App.tsx` with `SafeAreaProvider`, `AuthProvider`, `ToastProvider`, and `AppNavigator`.

### Phase 6: Validation, Build & Test
1. Run `npx tsc --noEmit` in `MedApp` to verify zero TypeScript errors.
2. Verify Metro bundler runs cleanly on `8081`.
3. Test compilation with `adb reverse tcp:5000 tcp:5000` against the local backend.
