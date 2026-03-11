import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../viewmodels/auth_viewmodel.dart';
import '../widgets/input_field.dart';
import '../widgets/primary_button.dart';
import 'events_screen.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  static const routeName = '/register';

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    return Scaffold(
      appBar: AppBar(title: const Text('Complete Registration')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Welcome to GeoWatch',
                  style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(
                'Enter your full name and phone number once to continue.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 20),
              InputField(
                label: 'Full Name',
                hint: 'Enter your full name',
                controller: _nameController,
              ),
              const SizedBox(height: 16),
              InputField(
                label: 'Phone Number',
                hint: '10-digit mobile number',
                controller: _phoneController,
              ),
              const SizedBox(height: 12),
              if (auth.errorMessage != null)
                Text(
                  auth.errorMessage!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: auth.isSaving ? 'Saving...' : 'Continue',
                icon: Icons.arrow_forward_rounded,
                onPressed: auth.isSaving ? null : _register,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _register() async {
    final auth = context.read<AuthViewModel>();
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();

    if (name.isEmpty || phone.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter valid name and phone number.')),
      );
      return;
    }

    final ok = await auth.register(fullName: name, phoneNumber: phone);
    if (!mounted || !ok) return;

    Navigator.pushNamedAndRemoveUntil(
      context,
      EventsScreen.routeName,
      (_) => false,
    );
  }
}
