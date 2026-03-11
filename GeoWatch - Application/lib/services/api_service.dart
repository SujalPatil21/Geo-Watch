import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';

class ApiService {
  ApiService({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  Future<List<dynamic>> getNearbyEvents({
    required double latitude,
    required double longitude,
  }) async {
    final response = await _apiClient.dio.get(
      ApiConstants.nearbyEvents,
      queryParameters: {'lat': latitude, 'lng': longitude},
    );

    final data = response.data;
    if (data is! List) {
      throw Exception('Invalid server response. Please try again.');
    }

    return data;
  }

  Future<dynamic> submitIncident(Map<String, dynamic> payload) async {
    final response = await _apiClient.dio.post(
      ApiConstants.incidents,
      data: payload,
    );
    return response.data;
  }

  Future<void> resolveIncident(int incidentId) async {
    await _apiClient.dio.post('${ApiConstants.incidents}/$incidentId/resolve');
  }

  String mapDioError(
    DioException error, {
    required String fallback,
    required String connectionMessage,
    required String timeoutMessage,
  }) {
    if (error.type == DioExceptionType.connectionError) {
      return connectionMessage;
    }

    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return timeoutMessage;
    }

    final data = error.response?.data;
    if (data is Map<String, dynamic> && data['message'] != null) {
      return data['message'].toString();
    }

    return fallback;
  }
}
