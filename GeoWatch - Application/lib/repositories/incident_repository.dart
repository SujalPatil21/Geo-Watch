import '../models/incident_request.dart';
import '../services/incident_service.dart';

class IncidentRepository {
  IncidentRepository({IncidentService? incidentService})
      : _incidentService = incidentService ?? IncidentService();

  final IncidentService _incidentService;

  Future<int> submitIncident(IncidentRequest request) {
    return _incidentService.submitIncident(request);
  }

  Future<void> resolveIncident(int incidentId) {
    return _incidentService.resolveIncident(incidentId);
  }
}