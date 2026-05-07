import '../models/product.dart';
import 'api_client.dart';

class WishlistEntry {
  final String id;
  final String productId;
  final Product product;

  WishlistEntry({required this.id, required this.productId, required this.product});

  factory WishlistEntry.fromJson(Map<String, dynamic> j) => WishlistEntry(
        id: j['id'] as String,
        productId: j['productId'] as String,
        product: Product.fromJson(Map<String, dynamic>.from(j['product'] as Map)),
      );
}

class WishlistService {
  final ApiClient api;
  WishlistService(this.api);

  Future<List<WishlistEntry>> list() async => (await api.get('/wishlist') as List)
      .map((e) => WishlistEntry.fromJson(Map<String, dynamic>.from(e as Map)))
      .toList();

  Future<List<WishlistEntry>> add(String productId) async =>
      (await api.post('/wishlist/add', body: {'productId': productId}) as List)
          .map((e) => WishlistEntry.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();

  Future<List<WishlistEntry>> remove(String productId) async =>
      (await api.delete('/wishlist/$productId') as List)
          .map((e) => WishlistEntry.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
}
