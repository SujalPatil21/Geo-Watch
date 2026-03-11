import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../services/location_service.dart';
import '../viewmodels/auth_viewmodel.dart';
import 'events_screen.dart';
import 'registration_screen.dart';

class LocationRequiredScreen extends StatelessWidget {
  const LocationRequiredScreen({super.key});

  static const routeName = '/location-required';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.location_off_rounded,
                  size: 72,
                  color: Theme.of(context).colorScheme.error,
                ),
                const SizedBox(height: 20),
                Text(
                  'Location Permission Required',
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  'This app needs location access to find nearby events and submit reports.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => _retry(context),
                  child: const Text('Grant Location Access'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _retry(BuildContext context) async {
    final locationService = LocationService();
    try {
      await locationService.getCurrentLocation();
    } catch (e) {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      final permission = await Geolocator.checkPermission();

      if (!serviceEnabled) {
        await Geolocator.openLocationSettings();
      } else if (permission == LocationPermission.deniedForever) {
        await Geolocator.openAppSettings();
      } else if (permission == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
      return;
    }

    if (!context.mounted) return;
    final auth = context.read<AuthViewModel>();
    await auth.initialize();
    if (!context.mounted) return;
    Navigator.pushNamedAndRemoveUntil(
      context,
      auth.isRegistered ? EventsScreen.routeName : RegistrationScreen.routeName,
      (_) => false,
    );
  }
}
