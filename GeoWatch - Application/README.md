# GeoWatch - Crowd Safety Intelligence (Flutter App)

Mobile client for crowd safety reporting at public events. The app collects incident reports with GPS location and sends them to a Spring Boot backend, which performs validation, storage, clustering, and dashboard broadcasting.

## Status

Implemented through **Stage 5**:
- Stage 1: Foundation architecture + navigation + base theme
- Stage 2: Location permission + GPS + nearby event discovery
- Stage 3: Incident reporting flow integrated with backend API
- Stage 4: Professional iPhone-inspired UI system + light/dark themes
- Stage 5: Reliability polish (loading states, offline detection, error handling, settings)

## Architecture

Pattern used: **MVVM + Repository**

Flow:
- Screens
- ViewModels
- Repositories
- Services
- API Client (`dio`)

Project structure:
- `lib/core/` shared constants/network/theme/utils
- `lib/models/` API/domain models
- `lib/services/` location, connectivity, API-facing services
- `lib/repositories/` data orchestration
- `lib/viewmodels/` UI state logic
- `lib/screens/` app screens
- `lib/widgets/` reusable UI components

## Implemented Features

- Splash flow and route setup
- Nearby event discovery:
  - requests location permission
  - fetches current GPS
  - calls `GET /api/events/nearby?lat={lat}&lng={lng}`
- Incident reporting:
  - event selection -> report form
  - captures GPS automatically
  - posts payload to `POST /api/incidents`
  - payload:
    - `eventId`
    - `name`
    - `phoneNumber`
    - `latitude`
    - `longitude`
- Offline awareness:
  - connectivity banner
  - disables actions requiring internet
- Error handling for timeout/network/backend failures
- Success confirmation screen
- Settings screen with theme mode selection:
  - `System`
  - `Light`
  - `Dark`

## UI System

- Centralized theming in `lib/core/theme/`
- Reusable components:
  - `PrimaryButton`
  - `EventCard`
  - `InputField`
  - `SectionTitle`
  - `LoadingIndicator`
  - `OfflineBanner`
- Clean spacing, rounded surfaces, subtle animations

## Dependencies

- `provider`
- `dio`
- `geolocator`
- `permission_handler`
- `connectivity_plus`

## Backend Compatibility

Backend endpoints used:
- `GET /api/events/nearby`
- `POST /api/incidents`

The mobile app does not perform clustering/risk computation; backend remains the source of truth.

## Setup

1. Install Flutter SDK (stable).
2. Install dependencies:
   ```bash
   flutter pub get
   ```
3. Configure backend base URL in:
   - `lib/core/constants/api_constants.dart`
4. Run app:
   ```bash
   flutter run
   ```
5. Demo without backend (mock events + mock incident submit + OTP login):
   ```bash
   flutter run --dart-define=USE_MOCK_BACKEND=true
   ```
   - Demo OTP is `123456`.

## Validation

- Static analysis:
  ```bash
  dart analyze
  ```
- Tests:
  ```bash
  flutter test
  ```

## Demo Notes

- Ensure backend server is running and reachable from device/emulator.
- Ensure location permission is granted.
- Use Settings screen to test theme switching.
- Test offline mode by disabling internet and observing banner + disabled actions.

## GitHub Upload

1. Create an empty repository on GitHub.
2. Add your remote:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "chore: initialize GeoWatch Flutter app"
   git branch -M main
   git push -u origin main
   ```
