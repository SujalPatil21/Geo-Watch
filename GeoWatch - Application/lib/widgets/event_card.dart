import 'package:flutter/material.dart';

class EventCard extends StatelessWidget {
  const EventCard({
    super.key,
    required this.title,
    required this.radius,
    required this.startTimeLabel,
    required this.onJoin,
    this.joinEnabled = true,
    this.lightSurface = false,
  });

  final String title;
  final String radius;
  final String startTimeLabel;
  final VoidCallback onJoin;
  final bool joinEnabled;
  final bool lightSurface;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final textColor = lightSurface ? const Color(0xFF1F2937) : Colors.white;
    final cardColor = lightSurface ? Colors.white : const Color(0xFF0F223A);

    return Card(
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(color: textColor),
              ),
              const SizedBox(height: 8),
              Text(
                'Radius: $radius',
                style: theme.textTheme.bodyMedium?.copyWith(color: textColor),
              ),
              const SizedBox(height: 4),
              Text(
                'Starts: $startTimeLabel',
                style: theme.textTheme.bodyMedium?.copyWith(color: textColor),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 46,
                child: FilledButton(
                  onPressed: joinEnabled ? onJoin : null,
                  child: const Text('Join Event'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
