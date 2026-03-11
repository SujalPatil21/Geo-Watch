import '../models/event_model.dart';
import '../services/event_service.dart';

class EventRepository {
  EventRepository({EventService? eventService})
      : _eventService = eventService ?? EventService();

  final EventService _eventService;

  Future<List<EventModel>> fetchNearbyEvents(double lat, double lng) {
    return _eventService.fetchNearbyEvents(lat, lng);
  }
}
