import 'package:flutter/foundation.dart';
import '../models/store.dart';

class StoreState extends ChangeNotifier {
  Store? _selected;
  Store? get selected => _selected;

  void select(Store s) {
    _selected = s;
    notifyListeners();
  }

  void clear() {
    _selected = null;
    notifyListeners();
  }
}
