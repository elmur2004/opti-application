import 'package:flutter/foundation.dart';
import '../models/cart.dart';
import '../services/cart_service.dart';

class CartState extends ChangeNotifier {
  final CartService _svc;
  Cart? _cart;
  bool _busy = false;
  String? _error;

  CartState(this._svc);

  Cart? get cart => _cart;
  bool get busy => _busy;
  String? get error => _error;
  int get count => _cart?.count ?? 0;

  Future<void> refresh() async {
    _busy = true;
    notifyListeners();
    try {
      _cart = await _svc.get();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> add(String productId, {int quantity = 1}) async {
    _cart = await _svc.add(productId, quantity: quantity);
    notifyListeners();
  }

  Future<void> remove(String productId) async {
    _cart = await _svc.remove(productId);
    notifyListeners();
  }

  Future<void> clear() async {
    _cart = await _svc.clear();
    notifyListeners();
  }
}
