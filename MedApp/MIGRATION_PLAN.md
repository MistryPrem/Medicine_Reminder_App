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

### Phase 1: Dependencies & Android Manifest Setup ✅
- [x] Installed required packages (`@react-navigation/native`, `@react-navigation/stack`, `react-native-screens`, `react-native-gesture-handler`, `@react-native-async-storage/async-storage`, `axios`).
- [x] Configured `usesCleartextTraffic` in `MedApp/android/app/src/main/AndroidManifest.xml` for `http://localhost:5000`.
- [x] Set up native `global.XMLHttpRequest` / `global.FormData` hook in `MedApp/index.js` for Chrome DevTools Network Tab inspection.

### Phase 2: Core Foundation & Reusable Component Library ✅
- [x] Refined `theme.ts` with modern accessible tokens, radii, and shadows.
- [x] Created `MedApp/src/components/common/`:
  - **`CustomButton`**: variants (`primary`, `secondary`, `danger`, `success`, `outline`, `ghost`), loading states.
  - **`CustomTextInput`**: labels, password eye toggle, error message states.
  - **`CustomDropdown`**: modal-based clean selection.
  - **`CustomTimePicker`**: 12-hour AM/PM hour & minute picker.
  - **`CustomDatePicker`**: calendar month picker.
  - **`CustomDateTimePicker`**: combined date and time dialog.
  - **`CustomModal`**: backdrop blur, header with close action, sticky footer.
  - **`CustomLoader`**: inline & fullscreen indicators.
  - **`CustomToast`**: context-driven floating alert banners.
  - **`CustomCard`**: standardized elevated card container.

### Phase 3: Services, Storage & Context Migration ✅
- [x] Migrated `types/` (`auth.ts`, `dose.ts`, `navigation.ts`).
- [x] Migrated `services/api.ts` with `http://localhost:5000/api/v1`, full request/response logging, and token auto-refresh.
- [x] Migrated `storage/offlineStorage.ts` for offline schedule caching and action queuing.
- [x] Migrated `services/doseService.ts` and `services/medicationService.ts`.
- [x] Migrated `context/AuthContext.tsx` and `context/ToastContext.tsx`.

### Phase 4: Screens & Feature Migration ✅
- [x] **`LoginScreen`**: built with `CustomTextInput`, `CustomButton`, and `useToast`.
- [x] **`ElderlyHomeScreen`**: built with `DoseCard`, `CustomLoader`, `EmergencyBanner`, `OfflineSyncBanner`, and summary progress.
- [x] **`HistoryScreen`**: adherence timeline with `CustomDatePicker` date filter.
- [x] **`AddMedicationScreen`**: create new schedules using `CustomDropdown`, `CustomDatePicker`, `CustomTimePicker`, and `CustomButton`.

### Phase 5: Navigation & App Entry Integration ✅
- [x] Wired `AppNavigator.tsx` with auth switching and stack routing (`Login`, `ElderlyHome`, `History`, `AddMedication`).
- [x] Wired `MedApp/App.tsx` with `GestureHandlerRootView`, `SafeAreaProvider`, `ToastProvider`, `AuthProvider`, and `AppNavigator`.

### Phase 6: Validation, Build & Test ✅
- [x] Verified `npm run type-check` (`tsc --noEmit`) passes with **0 errors**.
- [x] Verified all source files committed and pushed to git branch `develop`.
