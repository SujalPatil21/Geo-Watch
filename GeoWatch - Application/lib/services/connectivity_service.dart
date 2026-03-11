import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

class ConnectivityService extends ChangeNotifier {
  ConnectivityService() {
    _init();
  }

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _subscription;
  bool _isOnline = true;

  bool get isOnline => _isOnline;

  Future<void> _init() async {
    final result = await _connectivity.checkConnectivity();
    _isOnline = result != ConnectivityResult.none;
    notifyListeners();

    _subscription = _connectivity.onConnectivityChanged.listen((result) {
      final next = result != ConnectivityResult.none;
      if (next == _isOnline) return;
      _isOnline = next;
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
