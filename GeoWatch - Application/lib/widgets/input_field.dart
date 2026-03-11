import 'package:flutter/material.dart';

class InputField extends StatelessWidget {
  const InputField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.maxLines = 1,
    this.onChanged,
  });

  final String label;
  final String? hint;
  final TextEditingController? controller;
  final int maxLines;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
          onChanged: onChanged,
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }
}
