import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/event_model.dart';
import '../repositories/incident_repository.dart';
import '../services/connectivity_service.dart';
import '../services/incident_service.dart';
import '../services/location_service.dart';
import '../viewmodels/incident_viewmodel.dart';
import '../widgets/input_field.dart';
import '../widgets/loading_indicator.dart';
import '../widgets/offline_banner.dart';
import '../widgets/primary_button.dart';
import '../widgets/section_title.dart';
import 'success_screen.dart';

class IncidentReportScreen extends StatelessWidget {
  const IncidentReportScreen({super.key});

  static const routeName = '/incident-report';

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => IncidentViewModel(
        incidentRepository: IncidentRepository(incidentService: IncidentService()),
        locationService: LocationService(),
      ),
      child: const _IncidentReportView(),
    );
  }
}

class _IncidentReportView extends StatefulWidget {
  const _IncidentReportView();

  @override
  State<_IncidentReportView> createState() => _IncidentReportViewState();
}

class _IncidentReportViewState extends State<_IncidentReportView> {
  static const List<String> _incidentTypes = [
    'Harassment',
    'Unsafe Crowd Movement',
    'Medical Emergency',
    'Other',
  ];

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  String _selectedType = _incidentTypes.first;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final event = ModalRoute.of(context)?.settings.arguments as EventModel?;
    final vm = context.watch<IncidentViewModel>();
    final isOnline = context.watch<ConnectivityService>().isOnline;

    return Scaffold(
      appBar: AppBar(title: const Text('Report Incident')),
      body: SafeArea(
        child: Column(
          children: [
            const OfflineBanner(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SectionTitle(
                      title: 'Quick Incident Report',
                      subtitle: event == null
                          ? 'Share what happened to alert organizers quickly.'
                          : 'Reporting for ${event.name}',
                    ),
                    const SizedBox(height: 24),
                    InputField(
                      label: 'Your Name',
                      hint: 'Enter your name',
                      controller: _nameController,
                    ),
                    const SizedBox(height: 16),
                    InputField(
                      label: 'Phone Number',
                      hint: '10-digit mobile number',
                      controller: _phoneController,
                    ),
                    const SizedBox(height: 16),
                    Text('Incident Type',
                        style: Theme.of(context).textTheme.bodyLarge),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedType,
                      items: _incidentTypes
                          .map((type) => DropdownMenuItem(
                                value: type,
                                child: Text(type),
                              ))
                          .toList(),
                      onChanged: (value) {
                        if (value == null) return;
                        setState(() => _selectedType = value);
                      },
                    ),
                    const SizedBox(height: 16),
                    InputField(
                      label: 'Description (Optional)',
                      hint: 'Describe what you observed',
                      maxLines: 4,
                      controller: _descriptionController,
                    ),
                    const SizedBox(height: 16),
                    if (vm.errorMessage != null)
                      Text(
                        vm.errorMessage!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                          fontSize: 13,
                        ),
                      ),
                    const SizedBox(height: 16),
                    vm.isSubmitting
                        ? const LoadingIndicator(label: 'Submitting incident...')
                        : PrimaryButton(
                            label: 'Submit Report',
                            icon: Icons.send_rounded,
                            onPressed: isOnline ? () => _submit(vm, event) : null,
                          ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit(IncidentViewModel vm, EventModel? event) async {
    if (event == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an event before reporting.')),
      );
      return;
    }

    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();

    if (name.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name and phone number are required.')),
      );
      return;
    }
    
final success = await vm.submitIncident(
  eventId: event.id,
  name: name,
  phoneNumber: phone,
);

if (!mounted || !success) return;

Navigator.pushReplacementNamed(
  context,
  SuccessScreen.routeName,
  arguments: {
    'incidentId': vm.lastSubmittedIncidentId,
  },
);
  }
}
