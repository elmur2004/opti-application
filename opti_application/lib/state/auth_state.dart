import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

class AuthState extends ChangeNotifier {
  final AuthService _auth;
  final ApiClient _api;
  User? _user;
  bool _loading = true;
  String? _error;

  AuthState(this._auth, this._api) {
    // Auto-logout on any 401 from anywhere in the app — covers expired and
    // revoked JWTs as well as any backend rejection.
    _api.onUnauthorized = _onUnauthorized;
    _bootstrap();
  }

  User? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  Future<void> _bootstrap() async {
    await _api.init();
    final token = _api.token;
    if (token == null) {
      _loading = false;
      notifyListeners();
      return;
    }
    // Validate the saved token by calling /auth/me. If the server rejects it,
    // the 401 handler will already have cleared the token; we just confirm the
    // signed-out state. If the network is offline, fall back to a "trust the
    // saved token" view so the user isn't bounced to /login mid-flight.
    try {
      final res = await _api.get('/auth/me');
      final userJson = (res as Map)['user'] as Map;
      _user = User.fromJson(Map<String, dynamic>.from(userJson));
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        _user = null;
      } else {
        // Network/offline — keep the user "logged in" optimistically so the UI
        // can render. Subsequent calls will fail visibly.
        _user = null;
      }
    } catch (_) {
      _user = null;
    }
    _loading = false;
    notifyListeners();
  }

  /// Called when ApiClient sees a 401 from any request.
  void _onUnauthorized() {
    if (_user == null) return;
    _api.setToken(null);
    _user = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _error = null;
    try {
      final r = await _auth.login(email, password);
      await _api.setToken(r.token);
      _user = r.user;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String email, String password) async {
    _error = null;
    try {
      final r = await _auth.register(email, password);
      await _api.setToken(r.token);
      _user = r.user;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _api.setToken(null);
    _user = null;
    notifyListeners();
  }
}
