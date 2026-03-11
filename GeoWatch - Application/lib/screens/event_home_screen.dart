import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_theme.dart';
import '../models/event_model.dart';
import '../repositories/incident_repository.dart';
import '../services/connectivity_service.dart';
import '../services/incident_service.dart';
import '../services/location_service.dart';
import '../viewmodels/auth_viewmodel.dart';
import '../viewmodels/incident_viewmodel.dart';
import '../widgets/offline_banner.dart';
import 'success_screen.dart';

class EventHomeScreen extends StatelessWidget {
  const EventHomeScreen({super.key});

  static const routeName = '/event-home';

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => IncidentViewModel(
        incidentRepository: IncidentRepository(incidentService: IncidentService()),
        locationService: LocationService(),
      ),
      child: const _EventHomeView(),
    );
  }
}

class _EventHomeView extends StatefulWidget {
  const _EventHomeView();

  @override
  State<_EventHomeView> createState() => _EventHomeViewState();
}

class _EventHomeViewState extends State<_EventHomeView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _holdController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );

  bool _didTrigger = false;

  @override
  void dispose() {
    _holdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final event = ModalRoute.of(context)?.settings.arguments as EventModel?;
    final isOnline = context.watch<ConnectivityService>().isOnline;
    final incidentVm = context.watch<IncidentViewModel>();
    final auth = context.watch<AuthViewModel>();

    return Scaffold(
      appBar: AppBar(
        title: Text(event?.name ?? 'Event Home', style: const TextStyle(color: Colors.white)),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppTheme.navyGradient),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            const OfflineBanner(),
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Theme.of(context).colorScheme.surface,
                      Theme.of(context).scaffoldBackgroundColor,
                    ],
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      event?.name ?? 'Emergency Event',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Emergency help needed? Press and hold to report.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withValues(alpha: 0.72),
                          ),
                    ),
                    const SizedBox(height: 34),
                    GestureDetector(
                      onLongPressStart: (!isOnline || incidentVm.isSubmitting)
                          ? null
                          : (_) {
                              HapticFeedback.mediumImpact();
                              _startHold(event, auth, incidentVm);
                            },
                      onLongPressEnd: (!isOnline || incidentVm.isSubmitting)
                          ? null
                          : (_) => _cancelHold(),
                      child: AnimatedBuilder(
                        animation: _holdController,
                        builder: (context, _) {
                          return Container(
                            height: 252,
                            width: 252,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  AppTheme.alert.withValues(alpha: 0.2),
                                  AppTheme.alert.withValues(alpha: 0.07),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                SizedBox(
                                  height: 218,
                                  width: 218,
                                  child: CircularProgressIndicator(
                                    value: _holdController.value,
                                    strokeWidth: 8,
                                    backgroundColor: Colors.white.withValues(alpha: 0.18),
                                    valueColor: const AlwaysStoppedAnimation<Color>(
                                      Color(0xFFFFD0CC),
                                    ),
                                  ),
                                ),
                                Container(
                                  height: 190,
                                  width: 190,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppTheme.alert,
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppTheme.alert.withValues(alpha: 0.45),
                                        blurRadius: 26,
                                        spreadRadius: 3,
                                      ),
                                    ],
                                  ),
                                  alignment: Alignment.center,
                                  child: incidentVm.isSubmitting
                                      ? const SizedBox(
                                          height: 38,
                                          width: 38,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 3,
                                          ),
                                        )
                                      : const Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              Icons.sensors_rounded,
                                              color: Colors.white,
                                              size: 34,
                                            ),
                                            SizedBox(height: 8),
                                            Text(
                                              'Report',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 34,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ],
                                        ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      isOnline
                          ? 'Keep holding until the ring completes.'
                          : 'Connect to internet to report.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: isOnline
                                ? Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withValues(alpha: 0.7)
                                : Theme.of(context).colorScheme.error,
                          ),
                    ),
                    if (incidentVm.errorMessage != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        incidentVm.errorMessage!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Theme.of(context).colorScheme.error),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _startHold(
    EventModel? event,
    AuthViewModel auth,
    IncidentViewModel vm,
  ) async {
    _didTrigger = false;
    await _holdController.forward(from: 0);

    if (!mounted || _didTrigger || vm.isSubmitting) return;
    _didTrigger = true;

    if (event == null || auth.fullName == null || auth.phoneNumber == null) return;
    final ok = await vm.submitIncident(
      eventId: event.id,
      name: auth.fullName!,
      phoneNumber: auth.phoneNumber!,
    );
    if (!mounted || !ok) return;
    HapticFeedback.heavyImpact();
    _holdController.value = 0;
    Navigator.pushNamed(
      context,
      SuccessScreen.routeName,
      arguments: {
        'incidentId': vm.lastSubmittedIncidentId,
      },
    );
  }

  void _cancelHold() {
    if (_didTrigger) return;
    _holdController.stop();
    _holdController.animateBack(0, duration: const Duration(milliseconds: 180));
  }
}
