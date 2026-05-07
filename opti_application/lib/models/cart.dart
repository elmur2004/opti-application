import 'product.dart';

class CartItem {
  final String id;
  final String productId;
  final int quantity;
  final Product product;

  CartItem({
    required this.id,
    required this.productId,
    required this.quantity,
    required this.product,
  });

  factory CartItem.fromJson(Map<String, dynamic> j) => CartItem(
        id: j['id'] as String,
        productId: j['productId'] as String,
        quantity: j['quantity'] as int,
        product: Product.fromJson(Map<String, dynamic>.from(j['product'] as Map)),
      );
}

class Cart {
  final String id;
  final List<CartItem> items;
  final double total;

  Cart({required this.id, required this.items, required this.total});

  int get count => items.fold(0, (s, i) => s + i.quantity);

  factory Cart.fromJson(Map<String, dynamic> j) => Cart(
        id: j['id'] as String,
        items: ((j['items'] as List?) ?? [])
            .map((e) => CartItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        total: (j['total'] as num).toDouble(),
      );
}
