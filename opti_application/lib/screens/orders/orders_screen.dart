import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late Future<List<Order>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<OrderService>().mine();
  }

  Future<void> _refresh() async {
    setState(() => _future = context.read<OrderService>().mine());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My orders')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Order>>(
          future: _future,
          builder: (ctx, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snap.hasError) {
              return ListView(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(32),
                    child: Center(child: Text(snap.error.toString())),
                  ),
                ],
              );
            }
            final orders = snap.data ?? const [];
            if (orders.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 200),
                  Center(child: Text('No orders yet')),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (_, i) {
                final o = orders[i];
                return ListTile(
                  title: Text('Order #${o.id.substring(0, 8)}'),
                  subtitle: Text(
                    '${DateFormat.yMMMd().add_jm().format(o.createdAt)}\n'
                    '${o.items.length} item${o.items.length == 1 ? '' : 's'} · ${o.status}',
                  ),
                  trailing: Text('\$${o.totalPrice.toStringAsFixed(2)}'),
                  isThreeLine: true,
                );
              },
            );
          },
        ),
      ),
    );
  }
}
