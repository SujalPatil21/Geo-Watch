import 'package:flutter/foundation.dart';

import '../models/incident_request.dart';
import '../repositories/incident_repository.dart';
import '../services/location_service.dart';

class IncidentViewModel extends ChangeNotifier {
  IncidentViewModel({
    IncidentRepository? incidentRepository,
    LocationService? locationService,
  })  : _incidentRepository = incidentRepository ?? IncidentRepository(),
        _locationService = locationService ?? LocationService();

  final IncidentRepository _incidentRepository;
  final LocationService _locationService;

  bool _isSubmitting = false;
  String? _errorMessage;

  IncidentRequest? _lastSubmittedIncident;
  DateTime? _lastSubmittedAt;
  int? _lastSubmittedIncidentId;

  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  IncidentRequest? get lastSubmittedIncident => _lastSubmittedIncident;
  DateTime? get lastSubmittedAt => _lastSubmittedAt;
  int? get lastSubmittedIncidentId => _lastSubmittedIncidentId;

  Future<bool> submitIncident({
    required int eventId,
    required String name,
    required String phoneNumber,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final location = await _locationService.getCurrentLocation();

      final request = IncidentRequest(
        eventId: eventId,
        name: name,
        phoneNumber: phoneNumber,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: DateTime.now(),
      );

      final incidentId = await _incidentRepository.submitIncident(request);

      print("Incident created with id: $incidentId");

      _lastSubmittedIncident = request;
      _lastSubmittedAt = DateTime.now();
      _lastSubmittedIncidentId = incidentId;

      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}