import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../state/cart_state.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartState>().refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<CartState>();
    final cart = state.cart;
    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: state.busy && cart == null
          ? const Center(child: CircularProgressIndicator())
          : (cart == null || cart.items.isEmpty)
              ? const Center(child: Text('Your cart is empty'))
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: cart.items.length,
                  separatorBuilder: (_, __) => const Divider(),
                  itemBuilder: (_, i) {
                    final item = cart.items[i];
                    return Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: CachedNetworkImage(
                            imageUrl: item.product.thumbnailUrl,
                            width: 64,
                            height: 64,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(
                                width: 64, height: 64, color: Colors.grey.shade100),
                            errorWidget: (_, __, ___) => Container(
                                width: 64, height: 64, color: Colors.grey.shade100),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.product.name,
                                  style: Theme.of(context).textTheme.titleSmall),
                              Text(
                                  'Qty ${item.quantity} · \$${item.product.price.toStringAsFixed(2)}'),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () async {
                            try {
                              await context
                                  .read<CartState>()
                                  .remove(item.productId);
                            } catch (e) {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString())),
                              );
                            }
                          },
                        ),
                      ],
                    );
                  },
                ),
      bottomNavigationBar: cart == null || cart.items.isEmpty
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Subtotal'),
                        Text('\$${cart.total.toStringAsFixed(2)}',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                            padding:
                                const EdgeInsets.symmetric(vertical: 14)),
                        onPressed: () =>
                            Navigator.pushNamed(context, '/checkout'),
                        child: const Text('Checkout'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
