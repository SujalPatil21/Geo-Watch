import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_theme.dart';
import 'events_screen.dart';
import 'location_required_screen.dart';
import 'registration_screen.dart';
import '../services/location_service.dart';
import '../viewmodels/auth_viewmodel.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  static const routeName = '/';

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  Timer? _navigationTimer;
  final LocationService _locationService = LocationService();

  @override
  void initState() {
    super.initState();
    _navigationTimer = Timer(const Duration(seconds: 1), _attemptStartup);
  }

  Future<void> _attemptStartup() async {
    if (!mounted) return;

    try {
      await _locationService.getCurrentLocation();
    } catch (_) {
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, LocationRequiredScreen.routeName);
      return;
    }

    if (!mounted) return;
    final auth = context.read<AuthViewModel>();
    await auth.initialize();

    if (!mounted) return;
    Navigator.pushReplacementNamed(
      context,
      auth.isRegistered ? EventsScreen.routeName : RegistrationScreen.routeName,
    );
  }

  @override
  void dispose() {
    _navigationTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.navyGradient),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    height: 96,
                    width: 96,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: const Icon(Icons.shield_rounded,
                        size: 48, color: Colors.white),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'GeoWatch',
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Initializing secure reporting experience...',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
                  const CircularProgressIndicator(
                    strokeWidth: 2.2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppTheme.accent),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
