class AppConfig {
  static const bool useMockBackend = bool.fromEnvironment(
    'USE_MOCK_BACKEND',
    defaultValue: false,
  );
}
