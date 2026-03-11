import 'package:shared_preferences/shared_preferences.dart';

class UserProfile {
  const UserProfile({
    required this.fullName,
    required this.phoneNumber,
  });

  final String fullName;
  final String phoneNumber;
}

class UserProfileService {
  static const _nameKey = 'user_full_name';
  static const _phoneKey = 'user_phone_number';

  Future<UserProfile?> loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString(_nameKey)?.trim();
    final phone = prefs.getString(_phoneKey)?.trim();
    if (name == null || phone == null || name.isEmpty || phone.isEmpty) {
      return null;
    }
    return UserProfile(fullName: name, phoneNumber: phone);
  }

  Future<void> saveProfile({
    required String fullName,
    required String phoneNumber,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_nameKey, fullName.trim());
    await prefs.setString(_phoneKey, phoneNumber.trim());
  }

  Future<void> clearProfile() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_nameKey);
    await prefs.remove(_phoneKey);
  }
}
