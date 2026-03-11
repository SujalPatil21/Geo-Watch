import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'screens/event_home_screen.dart';
import 'screens/events_screen.dart';
import 'screens/location_required_screen.dart';
import 'screens/registration_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/success_screen.dart';
import 'services/connectivity_service.dart';
import 'services/location_service.dart';
import 'viewmodels/auth_viewmodel.dart';

class GeoWatchApp extends StatefulWidget {
  const GeoWatchApp({super.key});

  @override
  State<GeoWatchApp> createState() => _GeoWatchAppState();
}

class _GeoWatchAppState extends State<GeoWatchApp> with WidgetsBindingObserver {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final LocationService _locationService = LocationService();
  StreamSubscription<ServiceStatus>? _serviceStatusSubscription;
  bool _showingLocationRequired = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _serviceStatusSubscription =
        Geolocator.getServiceStatusStream().listen((_) => _enforceLocationGate());
    WidgetsBinding.instance.addPostFrameCallback((_) => _enforceLocationGate());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _enforceLocationGate();
    }
  }

  Future<void> _enforceLocationGate() async {
    final nav = _navigatorKey.currentState;
    if (nav == null) return;

    final hasAccess = await _locationService.hasAccess();
    if (!hasAccess) {
      if (_showingLocationRequired) return;
      _showingLocationRequired = true;
      nav.pushNamedAndRemoveUntil(LocationRequiredScreen.routeName, (_) => false);
      return;
    }

    if (!_showingLocationRequired) return;
    _showingLocationRequired = false;

    final navContext = _navigatorKey.currentContext;
    if (navContext == null || !navContext.mounted) return;
    final auth = navContext.read<AuthViewModel>();
    await auth.initialize();
    if (!navContext.mounted) return;
    nav.pushNamedAndRemoveUntil(
      auth.isRegistered ? EventsScreen.routeName : RegistrationScreen.routeName,
      (_) => false,
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _serviceStatusSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ConnectivityService()),
        ChangeNotifierProvider(create: (_) => AuthViewModel()),
      ],
      child: MaterialApp(
        navigatorKey: _navigatorKey,
        title: 'GeoWatch - Crowd Safety Intelligence',
        theme: AppTheme.light,
        darkTheme: AppTheme.light,
        themeMode: ThemeMode.light,
        themeAnimationDuration: const Duration(milliseconds: 200),
        debugShowCheckedModeBanner: false,
        initialRoute: SplashScreen.routeName,
        routes: {
          SplashScreen.routeName: (_) => const SplashScreen(),
          RegistrationScreen.routeName: (_) => const RegistrationScreen(),
          EventsScreen.routeName: (_) => const EventsScreen(),
          EventHomeScreen.routeName: (_) => const EventHomeScreen(),
          SuccessScreen.routeName: (_) => const SuccessScreen(),
          SettingsScreen.routeName: (_) => const SettingsScreen(),
          LocationRequiredScreen.routeName: (_) => const LocationRequiredScreen(),
        },
      ),
    );
  }
}
