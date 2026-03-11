import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_theme.dart';
import '../models/event_model.dart';
import '../repositories/event_repository.dart';
import '../services/connectivity_service.dart';
import '../services/event_service.dart';
import '../services/location_service.dart';
import '../viewmodels/event_viewmodel.dart';
import '../widgets/event_card.dart';
import '../widgets/offline_banner.dart';
import 'event_home_screen.dart';
import 'settings_screen.dart';

class EventsScreen extends StatelessWidget {
  const EventsScreen({super.key});

  static const routeName = '/events';

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => EventViewModel(
        eventRepository: EventRepository(eventService: EventService()),
        locationService: LocationService(),
      )..loadNearbyEvents(),
      child: const _EventsView(),
    );
  }
}

class _EventsView extends StatelessWidget {
  const _EventsView();

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<EventViewModel>();
    final isOnline = context.watch<ConnectivityService>().isOnline;
    const titleColor = Color(0xFF0F223A);
    const subtitleColor = Color(0xFF475569);
    final bodyBackground =
        BoxDecoration(color: Theme.of(context).scaffoldBackgroundColor);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby Events', style: TextStyle(color: Colors.white)),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppTheme.navyGradient),
        ),
        actions: [
          IconButton(
            onPressed: () => Navigator.pushNamed(context, SettingsScreen.routeName),
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
          ),
        ],
      ),
      body: Container(
        decoration: bodyBackground,
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              const SizedBox(height: 8),
              const OfflineBanner(),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: _buildBody(context, vm, isOnline, titleColor, subtitleColor),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    EventViewModel vm,
    bool isOnline,
    Color titleColor,
    Color subtitleColor,
  ) {
    if (vm.isLoading) {
      return const _ScanningLoader();
    }

    if (vm.errorMessage != null) {
      return _StateCard(
        title: 'Unable to load events',
        message: vm.errorMessage!,
        actionLabel: 'Try Again',
        actionEnabled: isOnline,
        onPressed: vm.loadNearbyEvents,
      );
    }

    if (vm.events.isEmpty) {
      return _StateCard(
        title: 'No Events Nearby',
        message: 'No active events were found around your current location.',
        actionLabel: 'Refresh',
        actionEnabled: isOnline,
        onPressed: vm.loadNearbyEvents,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Choose Your Event',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: titleColor,
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 6),
        Text(
          'Select an event to open quick safety actions.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: subtitleColor,
              ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: ListView.separated(
            itemCount: vm.events.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (_, index) {
              final event = vm.events[index];
              return EventCard(
                title: event.name,
                radius: '${event.radius.toStringAsFixed(0)} m',
                startTimeLabel: _formatDateTime(event.startTime),
                joinEnabled: isOnline,
                lightSurface: false,
                onJoin: () => _openEventHome(context, event),
              );
            },
          ),
        ),
      ],
    );
  }

  void _openEventHome(BuildContext context, EventModel event) {
    Navigator.pushNamed(
      context,
      EventHomeScreen.routeName,
      arguments: event,
    );
  }

  String _formatDateTime(DateTime? dateTime) {
    if (dateTime == null) return 'TBD';
    final local = dateTime.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final suffix = local.hour >= 12 ? 'PM' : 'AM';
    return '${local.day}/${local.month}/${local.year} $hour:$minute $suffix';
  }
}

class _ScanningLoader extends StatefulWidget {
  const _ScanningLoader();

  @override
  State<_ScanningLoader> createState() => _ScanningLoaderState();
}

class _ScanningLoaderState extends State<_ScanningLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 2),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _controller,
            builder: (_, child) {
              return Container(
                height: 170,
                width: 170,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppTheme.accent.withValues(alpha: 0.42),
                      AppTheme.secondary.withValues(alpha: 0.12),
                    ],
                  ),
                ),
                child: Transform.rotate(
                  angle: _controller.value * 6.2831,
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: Container(
                      margin: const EdgeInsets.only(top: 4),
                      height: 72,
                      width: 4,
                      decoration: BoxDecoration(
                        color: AppTheme.accent,
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 14),
          Text(
            'Scanning nearby events...',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }
}

class _StateCard extends StatelessWidget {
  const _StateCard({
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onPressed,
    required this.actionEnabled,
  });

  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onPressed;
  final bool actionEnabled;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(message, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: actionEnabled ? onPressed : null,
                child: Text(actionLabel),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
