import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../viewmodels/auth_viewmodel.dart';
import '../widgets/section_title.dart';
import 'registration_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  static const routeName = '/settings';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SectionTitle(
              title: 'About Project',
              subtitle:
                  'GeoWatch helps organizers and participants report and monitor crowd safety incidents in real-time.',
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('App: GeoWatch',
                        style: Theme.of(context).textTheme.bodyLarge),
                    const SizedBox(height: 8),
                    Text('Version: 1.0.0',
                        style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 8),
                    Text('User: ${auth.fullName ?? "Not Registered"}',
                        style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 8),
                    Text('Phone: ${auth.phoneNumber ?? "-"}',
                        style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.tonalIcon(
              onPressed: () async {
                await context.read<AuthViewModel>().logout();
                if (!context.mounted) return;
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  RegistrationScreen.routeName,
                  (_) => false,
                );
              },
              icon: const Icon(Icons.logout),
              label: const Text('Logout'),
            ),
          ],
        ),
      ),
    );
  }
}
