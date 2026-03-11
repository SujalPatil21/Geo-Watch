import 'package:dio/dio.dart';

import '../constants/api_constants.dart';

class ApiClient {
  ApiClient()
      : dio = Dio(
          BaseOptions(
            baseUrl: ApiConstants.baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {'Content-Type': 'application/json'},
          ),
        );

  final Dio dio;
}
