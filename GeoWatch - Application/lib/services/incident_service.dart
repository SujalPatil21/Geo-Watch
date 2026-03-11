import 'package:dio/dio.dart';

import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../models/incident_request.dart';
import 'api_service.dart';

class IncidentService {
  IncidentService({ApiClient? apiClient})
      : _apiService = ApiService(apiClient: apiClient ?? ApiClient());

  final ApiService _apiService;

  /// Submit incident and return incidentId
  Future<int> submitIncident(IncidentRequest request) async {
    if (AppConfig.useMockBackend) {
      await Future<void>.delayed(const Duration(milliseconds: 900));
      return 1;
    }

    try {
      final data = await _apiService.submitIncident(request.toJson());

      if (data is int) {
        return data;
      }

      if (data is String) {
        return int.parse(data);
      }

      throw Exception('Invalid server response');
    } on DioException catch (e) {
      throw Exception(_mapDioError(e));
    }
  }

  /// Resolve incident
  Future<void> resolveIncident(int incidentId) async {
    if (AppConfig.useMockBackend) {
      await Future<void>.delayed(const Duration(milliseconds: 650));
      return;
    }

    try {
      await _apiService.resolveIncident(incidentId);
    } on DioException catch (e) {
      throw Exception(_mapDioError(e));
    }
  }

  String _mapDioError(DioException e) {
    return _apiService.mapDioError(
      e,
      fallback: 'Unable to submit incident right now. Please try again.',
      connectionMessage: 'No internet connection. Please check your network.',
      timeoutMessage: 'Request timed out. Please try again.',
    );
  }
}
