import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../state/cart_state.dart';
import '../tryon/tryon_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;
  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late Future<Product> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<ProductService>().one(widget.productId);
  }

  Future<void> _addToCart(Product p) async {
    try {
      await context.read<CartState>().add(p.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Added to cart')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: FutureBuilder<Product>(
        future: _future,
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) return Center(child: Text(snap.error.toString()));
          final p = snap.data!;
          return Column(
            children: [
              AspectRatio(
                aspectRatio: 4 / 3,
                child: CachedNetworkImage(
                  imageUrl: p.thumbnailUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: Colors.grey.shade100),
                  errorWidget: (_, __, ___) => Container(
                    color: Colors.grey.shade100,
                    child: const Icon(Icons.image_not_supported_outlined, size: 48),
                  ),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.name,
                          style: Theme.of(context).textTheme.headlineSmall),
                      const SizedBox(height: 8),
                      Text('\$${p.price.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 16),
                      Text(p.description),
                    ],
                  ),
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.face_outlined),
                          label: const Text('Try on'),
                          style: OutlinedButton.styleFrom(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 14)),
                          onPressed: () async {
                            final result = await Navigator.push<Map<String, dynamic>?>(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => TryOnScreen(productId: p.id)),
                            );
                            if (result != null &&
                                result['type'] == 'ADD_TO_CART' &&
                                mounted) {
                              await _addToCart(p);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton.icon(
                          icon: const Icon(Icons.add_shopping_cart),
                          label: const Text('Add to cart'),
                          style: FilledButton.styleFrom(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 14)),
                          onPressed: () => _addToCart(p),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
