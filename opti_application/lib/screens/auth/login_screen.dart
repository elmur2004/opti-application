import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/auth_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: 'customer@example.com');
  final _password = TextEditingController(text: 'password123');
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _busy = true);
    final ok = await context
        .read<AuthState>()
        .login(_email.text.trim(), _password.text);
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      Navigator.pushNamedAndRemoveUntil(context, '/stores', (_) => false);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<AuthState>().error ?? 'Login failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              Text('Opti', style: Theme.of(context).textTheme.displaySmall),
              const SizedBox(height: 8),
              Text('Sign in to continue',
                  style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 32),
              TextField(
                controller: _email,
                decoration: const InputDecoration(
                    labelText: 'Email', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _password,
                decoration: const InputDecoration(
                    labelText: 'Password', border: OutlineInputBorder()),
                obscureText: true,
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _busy ? null : _submit,
                style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14)),
                child: _busy
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Sign in'),
              ),
              TextButton(
                onPressed: _busy
                    ? null
                    : () => Navigator.pushNamed(context, '/register'),
                child: const Text('Create an account'),
              ),
              const SizedBox(height: 16),
              const Text(
                'Demo: customer@example.com / password123',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
