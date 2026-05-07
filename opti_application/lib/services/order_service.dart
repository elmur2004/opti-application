import '../models/order.dart';
import 'api_client.dart';

class OrderService {
  final ApiClient api;
  OrderService(this.api);

  Future<List<Order>> mine() async {
    final res = await api.get('/orders/my');
    return (res as List)
        .map((e) => Order.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<Order> create(ShippingAddress address) async {
    final res = await api
        .post('/orders', body: {'shippingAddress': address.toJson()});
    return Order.fromJson(Map<String, dynamic>.from(res as Map));
  }

  Future<Map<String, dynamic>> shippingQuote(String storeId, String city) async {
    final res = await api.get(
      '/stores/$storeId/shipping/quote',
      query: {'city': city},
      auth: false,
    );
    return Map<String, dynamic>.from(res as Map);
  }

  Future<List<Map<String, dynamic>>> shippingRules(String storeId) async {
    final res = await api.get('/stores/$storeId/shipping', auth: false);
    return (res as List)
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();
  }
}
