import '../models/product.dart';
import '../models/product_assets.dart';
import 'api_client.dart';

class ProductService {
  final ApiClient api;
  ProductService(this.api);

  Future<List<Product>> byStore(String storeId, {String? search}) async {
    final res = await api.get(
      '/stores/$storeId/products',
      query: (search != null && search.isNotEmpty) ? {'search': search} : null,
      auth: false,
    );
    return (res as List)
        .map((e) => Product.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<Product> one(String id) async {
    final res = await api.get('/products/$id', auth: false);
    return Product.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<ProductAssets> assets(String id) async {
    final res = await api.get('/products/$id/assets', auth: false);
    return ProductAssets.fromJson(Map<String, dynamic>.from(res as Map));
  }
}
