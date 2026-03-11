import 'package:flutter/foundation.dart';

import '../models/event_model.dart';
import '../repositories/event_repository.dart';
import '../services/location_service.dart';

class EventViewModel extends ChangeNotifier {
  EventViewModel({
    EventRepository? eventRepository,
    LocationService? locationService,
  })  : _eventRepository = eventRepository ?? EventRepository(),
        _locationService = locationService ?? LocationService();

  final EventRepository _eventRepository;
  final LocationService _locationService;

  List<EventModel> _events = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<EventModel> get events => _events;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadNearbyEvents() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final location = await _locationService.getCurrentLocation();
      _events = await _eventRepository.fetchNearbyEvents(
        location.latitude,
        location.longitude,
      );

      if (_events.isEmpty) {
        _errorMessage = 'No nearby events found for your location.';
      }
    } catch (e) {
      _events = [];
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
