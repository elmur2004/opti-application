import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../state/cart_state.dart';
import '../../state/store_state.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  String? _city;
  List<String> _cities = const [];
  double _shipping = 0;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _loadCities();
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _loadCities() async {
    final store = context.read<StoreState>().selected;
    if (store == null) return;
    try {
      final rules = await context.read<OrderService>().shippingRules(store.id);
      if (!mounted) return;
      setState(() {
        _cities = rules.map((e) => e['city'] as String).toList();
        if (_cities.isNotEmpty) {
          _city = _cities.first;
          _shipping = (rules.first['price'] as num).toDouble();
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Failed to load cities: $e')));
      }
    }
  }

  Future<void> _quote(String city) async {
    final store = context.read<StoreState>().selected;
    if (store == null) return;
    try {
      final q = await context.read<OrderService>().shippingQuote(store.id, city);
      if (!mounted) return;
      setState(() => _shipping = (q['price'] as num).toDouble());
    } catch (_) {/* ignore */}
  }

  Future<void> _placeOrder() async {
    if (_name.text.isEmpty ||
        _phone.text.isEmpty ||
        _address.text.isEmpty ||
        _city == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final order = await context.read<OrderService>().create(ShippingAddress(
            name: _name.text,
            phone: _phone.text,
            city: _city!,
            address: _address.text,
          ));
      await context.read<CartState>().refresh();
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(
          context, '/orders', (r) => r.settings.name == '/products' || r.isFirst);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Order placed: #${order.id.substring(0, 8)}')),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartState>().cart;
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _name,
            decoration: const InputDecoration(
                labelText: 'Full name', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            decoration: const InputDecoration(
                labelText: 'Phone', border: OutlineInputBorder()),
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _city,
            decoration: const InputDecoration(
                labelText: 'City', border: OutlineInputBorder()),
            items: _cities
                .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                .toList(),
            onChanged: (v) {
              setState(() => _city = v);
              if (v != null) _quote(v);
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _address,
            decoration: const InputDecoration(
                labelText: 'Address', border: OutlineInputBorder()),
            maxLines: 2,
          ),
          const SizedBox(height: 24),
          if (cart != null) ...[
            _row('Subtotal', '\$${cart.total.toStringAsFixed(2)}'),
            const SizedBox(height: 6),
            _row('Shipping', '\$${_shipping.toStringAsFixed(2)}'),
            const Divider(),
            _row('Total', '\$${(cart.total + _shipping).toStringAsFixed(2)}',
                bold: true),
          ],
          const SizedBox(height: 24),
          FilledButton(
            style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14)),
            onPressed: _busy ? null : _placeOrder,
            child: _busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Place order (Paymob)'),
          ),
          const SizedBox(height: 8),
          const Text(
            'Paymob is mocked: the backend creates the order with status PENDING and returns a fake payment URL.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _row(String l, String r, {bool bold = false}) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(l, style: bold ? const TextStyle(fontWeight: FontWeight.bold) : null),
          Text(r, style: bold ? const TextStyle(fontWeight: FontWeight.bold) : null),
        ],
      );
}
