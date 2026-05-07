import '../models/user.dart';
import 'api_client.dart';

class AuthResult {
  final String token;
  final User user;
  AuthResult(this.token, this.user);
}

class AuthService {
  final ApiClient api;
  AuthService(this.api);

  Future<AuthResult> login(String email, String password) async {
    final res = await api.post('/auth/login',
        body: {'email': email, 'password': password}, auth: false);
    return _parse(res);
  }

  Future<AuthResult> register(String email, String password) async {
    final res = await api.post('/auth/register',
        body: {'email': email, 'password': password}, auth: false);
    return _parse(res);
  }

  AuthResult _parse(dynamic res) {
    final m = Map<String, dynamic>.from(res as Map);
    return AuthResult(
      m['token'] as String,
      User.fromJson(Map<String, dynamic>.from(m['user'] as Map)),
    );
  }
}
