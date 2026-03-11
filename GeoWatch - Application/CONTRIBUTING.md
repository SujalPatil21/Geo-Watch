# Contributing

Thanks for contributing to this project.

## Setup

1. Install Flutter SDK (stable).
2. Run `flutter pub get`.
3. Set backend URL if needed:
   - `flutter run --dart-define=API_BASE_URL=http://<host>:8080`

## Development Rules

1. Keep architecture aligned with MVVM + Repository.
2. Prefer small, focused pull requests.
3. Run checks before opening a PR:
   - `dart analyze`
   - `flutter test`

## Commit Convention

Use short, descriptive commit messages, for example:
- `feat: add offline retry for incident submit`
- `fix: handle null event list from backend`
- `docs: update setup instructions`
