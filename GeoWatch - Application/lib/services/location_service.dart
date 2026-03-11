import 'package:geolocator/geolocator.dart';

class AppLocation {
  const AppLocation({required this.latitude, required this.longitude});

  final double latitude;
  final double longitude;
}

class LocationService {
  Future<bool> hasAccess() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    final permission = await Geolocator.checkPermission();
    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }

  Future<AppLocation> getCurrentLocation() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are turned off. Please enable GPS.');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw Exception('Location permission denied. Please allow location access.');
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception(
        'Location permission permanently denied. Enable it in device settings.',
      );
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );

    return AppLocation(
      latitude: position.latitude,
      longitude: position.longitude,
    );
  }
}
