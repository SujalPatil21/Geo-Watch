import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class PrimaryButton extends StatefulWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final button = widget.icon == null
        ? FilledButton(
            onPressed: widget.onPressed,
            child: Text(widget.label),
          )
        : FilledButton.icon(
            onPressed: widget.onPressed,
            icon: Icon(widget.icon),
            label: Text(widget.label),
          );

    return GestureDetector(
      onTapDown: (_) {
        if (widget.onPressed != null) {
          HapticFeedback.selectionClick();
        }
        setState(() => _isPressed = true);
      },
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.985 : 1,
        duration: const Duration(milliseconds: 110),
        child: button,
      ),
    );
  }
}
