import '../models/cart.dart';
import 'api_client.dart';

class CartService {
  final ApiClient api;
  CartService(this.api);

  Future<Cart> get() async =>
      Cart.fromJson(Map<String, dynamic>.from(await api.get('/cart') as Map));

  Future<Cart> add(String productId, {int quantity = 1}) async => Cart.fromJson(
      Map<String, dynamic>.from(await api.post('/cart/add',
          body: {'productId': productId, 'quantity': quantity}) as Map));

  Future<Cart> remove(String productId) async => Cart.fromJson(
      Map<String, dynamic>.from(await api
          .post('/cart/remove', body: {'productId': productId}) as Map));

  Future<Cart> clear() async => Cart.fromJson(
      Map<String, dynamic>.from(await api.delete('/cart/clear') as Map));
}
