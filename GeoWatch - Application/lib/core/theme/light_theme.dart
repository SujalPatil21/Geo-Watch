import 'package:flutter/material.dart';

import 'app_theme.dart';

class LightTheme {
  static ThemeData get theme {
    const background = Colors.white;
    const surface = AppTheme.cardLight;
    const onSurfaceMuted = Color(0xFF4B5563);

    final scheme = ColorScheme.fromSeed(
      brightness: Brightness.light,
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
        bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1F2937)),
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
        shadowColor: Colors.black.withValues(alpha: 0.06),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: const TextStyle(color: onSurfaceMuted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.primary, width: 1.3),
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
