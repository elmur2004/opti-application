class Product {
  final String id;
  final String storeId;
  final String name;
  final String description;
  final double price;
  final String thumbnailUrl;
  final int stock;
  final Map<String, dynamic> tryOnConfig;

  Product({
    required this.id,
    required this.storeId,
    required this.name,
    required this.description,
    required this.price,
    required this.thumbnailUrl,
    required this.stock,
    required this.tryOnConfig,
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        storeId: j['storeId'] as String,
        name: j['name'] as String,
        description: (j['description'] as String?) ?? '',
        price: (j['price'] as num).toDouble(),
        thumbnailUrl: (j['thumbnailUrl'] as String?) ?? '',
        stock: (j['stock'] as int?) ?? 0,
        tryOnConfig: (j['tryOnConfig'] as Map?)?.cast<String, dynamic>() ?? {},
      );
}
