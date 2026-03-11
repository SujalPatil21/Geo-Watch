class EventModel {
  final int id;
  final String name;
  final double centerLat;
  final double centerLng;
  final double radius;
  final DateTime startTime;
  final DateTime endTime;

  EventModel({
    required this.id,
    required this.name,
    required this.centerLat,
    required this.centerLng,
    required this.radius,
    required this.startTime,
    required this.endTime,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['eventId'],
      name: json['eventName'],
      centerLat: json['centerLat'],
      centerLng: json['centerLng'],
      radius: json['radius'],
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
    );
  }
}