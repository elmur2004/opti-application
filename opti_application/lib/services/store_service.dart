import '../models/store.dart';
import 'api_client.dart';

class StoreService {
  final ApiClient api;
  StoreService(this.api);

  Future<List<Store>> list() async {
    final res = await api.get('/stores', auth: false);
    return (res as List)
        .map((e) => Store.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}
