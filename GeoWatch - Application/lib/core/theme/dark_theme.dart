import 'package:flutter/material.dart';

import 'app_theme.dart';

class DarkTheme {
  static ThemeData get theme {
    const background = AppTheme.primary;
    const surface = AppTheme.cardDark;
    const onSurfaceMuted = AppTheme.textSecondary;

    final scheme = ColorScheme.fromSeed(
      brightness: Brightness.dark,
      seedColor: AppTheme.primary,
      primary: AppTheme.primary,
      secondary: AppTheme.accent,
      surface: surface,
      error: AppTheme.alert,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      textTheme: const TextTheme(
        headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
        titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
        titleMedium: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.white),
        bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: onSurfaceMuted),
        labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: background,
      ),
      cardTheme: CardThemeData(
        color: surface,
        margin: EdgeInsets.zero,
        elevation: 0,
        shadowColor: Colors.black.withValues(alpha: 0.2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF111C31),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: const TextStyle(color: onSurfaceMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF23314A)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF23314A)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF38BDF8), width: 1.3),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(double.infinity, 56),
          backgroundColor: AppTheme.accent,
          foregroundColor: Colors.white,
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }
}
