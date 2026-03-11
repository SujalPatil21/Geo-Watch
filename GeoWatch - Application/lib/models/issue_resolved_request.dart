class IssueResolvedRequest {
  IssueResolvedRequest({
    required this.eventId,
    required this.name,
    required this.phoneNumber,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    this.reportedAt,
  });

  final int eventId;
  final String name;
  final String phoneNumber;
  final double latitude;
  final double longitude;
  final DateTime timestamp;
  final DateTime? reportedAt;

  Map<String, dynamic> toJson() {
    return {
      'eventId': eventId,
      'name': name,
      'phoneNumber': phoneNumber,
      'latitude': latitude,
      'longitude': longitude,
      'timestamp': timestamp.toIso8601String(),
      'reportedAt': reportedAt?.toIso8601String(),
      'status': 'RESOLVED',
    };
  }
}
