import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/connectivity_service.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final isOnline = context.watch<ConnectivityService>().isOnline;
    if (isOnline) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: Theme.of(context).colorScheme.error,
      child: Text(
        'You are offline. Internet is required for event updates and reporting.',
        style: Theme.of(context)
            .textTheme
            .bodyMedium
            ?.copyWith(color: Theme.of(context).colorScheme.onError),
      ),
    );
  }
}
