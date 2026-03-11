import 'package:flutter/foundation.dart';

import '../services/user_profile_service.dart';

class AuthViewModel extends ChangeNotifier {
  AuthViewModel({UserProfileService? profileService})
      : _profileService = profileService ?? UserProfileService();

  final UserProfileService _profileService;

  bool _isInitialized = false;
  bool _isRegistered = false;
  bool _isSaving = false;
  String? _fullName;
  String? _phoneNumber;
  String? _errorMessage;

  bool get isInitialized => _isInitialized;
  bool get isRegistered => _isRegistered;
  bool get isSaving => _isSaving;
  String? get fullName => _fullName;
  String? get phoneNumber => _phoneNumber;
  String? get errorMessage => _errorMessage;

  Future<void> initialize() async {
    if (_isInitialized) return;
    final profile = await _profileService.loadProfile();
    if (profile != null) {
      _isRegistered = true;
      _fullName = profile.fullName;
      _phoneNumber = profile.phoneNumber;
    }
    _isInitialized = true;
    notifyListeners();
  }

  Future<bool> register({
    required String fullName,
    required String phoneNumber,
  }) async {
    _isSaving = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _profileService.saveProfile(
        fullName: fullName,
        phoneNumber: phoneNumber,
      );
      _fullName = fullName.trim();
      _phoneNumber = phoneNumber;
      _isRegistered = true;
      return true;
    } catch (_) {
      _errorMessage = 'Unable to save registration. Please try again.';
      return false;
    } finally {
      _isSaving = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _profileService.clearProfile();
    _isRegistered = false;
    _fullName = null;
    _phoneNumber = null;
    _errorMessage = null;
    notifyListeners();
  }
}
