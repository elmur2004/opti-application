import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../state/cart_state.dart';
import '../../state/store_state.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  late Future<List<Product>> _future;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartState>().refresh();
    });
  }

  void _load() {
    final store = context.read<StoreState>().selected;
    if (store == null) {
      _future = Future.value([]);
      return;
    }
    _future = context
        .read<ProductService>()
        .byStore(store.id, search: _search.isEmpty ? null : _search);
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<StoreState>().selected;
    if (store == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: TextButton(
            onPressed: () => Navigator.pushNamedAndRemoveUntil(
                context, '/stores', (_) => false),
            child: const Text('Pick a store'),
          ),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(store.name),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: () => Navigator.pushNamed(context, '/cart'),
              ),
              Positioned(
                top: 6,
                right: 6,
                child: Consumer<CartState>(
                  builder: (_, cart, __) => cart.count == 0
                      ? const SizedBox.shrink()
                      : Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                              color: Colors.red, shape: BoxShape.circle),
                          constraints:
                              const BoxConstraints(minWidth: 16, minHeight: 16),
                          child: Text(
                            '${cart.count}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                color: Colors.white, fontSize: 10),
                          ),
                        ),
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.receipt_long_outlined),
            onPressed: () => Navigator.pushNamed(context, '/orders'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: 'Search ${store.name}',
                border: const OutlineInputBorder(),
              ),
              onSubmitted: (v) => setState(() {
                _search = v;
                _load();
              }),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Product>>(
              future: _future,
              builder: (ctx, snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snap.hasError) {
                  return Center(child: Text(snap.error.toString()));
                }
                final products = snap.data ?? const [];
                if (products.isEmpty) {
                  return const Center(child: Text('No products yet'));
                }
                return GridView.builder(
                  padding: const EdgeInsets.all(12),
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.7,
                  ),
                  itemCount: products.length,
                  itemBuilder: (_, i) => _ProductCard(product: products[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () =>
          Navigator.pushNamed(context, '/product', arguments: product.id),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
                child: CachedNetworkImage(
                  imageUrl: product.thumbnailUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: Colors.grey.shade100),
                  errorWidget: (_, __, ___) => Container(
                    color: Colors.grey.shade100,
                    child: const Icon(Icons.image_not_supported_outlined),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 2),
                  Text('\$${product.price.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
