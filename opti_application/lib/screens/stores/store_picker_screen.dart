import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../models/store.dart';
import '../../services/store_service.dart';
import '../../state/auth_state.dart';
import '../../state/store_state.dart';

class StorePickerScreen extends StatefulWidget {
  const StorePickerScreen({super.key});

  @override
  State<StorePickerScreen> createState() => _StorePickerScreenState();
}

class _StorePickerScreenState extends State<StorePickerScreen> {
  late Future<List<Store>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<StoreService>().list();
  }

  void _retry() => setState(() => _future = context.read<StoreService>().list());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose a store'),
        actions: [
          IconButton(
            icon: const Icon(Icons.receipt_long_outlined),
            tooltip: 'My orders',
            onPressed: () => Navigator.pushNamed(context, '/orders'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () async {
              await context.read<AuthState>().logout();
              if (!mounted) return;
              Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
            },
          ),
        ],
      ),
      body: FutureBuilder<List<Store>>(
        future: _future,
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return _ErrorView(message: snap.error.toString(), onRetry: _retry);
          }
          final stores = snap.data ?? const [];
          if (stores.isEmpty) {
            return const Center(child: Text('No stores available'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: stores.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) {
              final s = stores[i];
              return InkWell(
                onTap: () {
                  context.read<StoreState>().select(s);
                  Navigator.pushNamed(context, '/products');
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      if (s.logoUrl != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: CachedNetworkImage(
                            imageUrl: s.logoUrl!,
                            width: 80,
                            height: 40,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const SizedBox(width: 80, height: 40),
                            errorWidget: (_, __, ___) => const SizedBox(width: 80, height: 40),
                          ),
                        ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s.name,
                                style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 4),
                            Text(s.domain,
                                style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 12),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ),
        ),
      );
}
