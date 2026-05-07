import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}

class ApiClient {
  static const Duration _defaultTimeout = Duration(seconds: 15);

  String? _token;
  bool _ready = false;

  /// Called when the server returns 401 — used by AuthState to log the user
  /// out automatically when the JWT is rejected (expired, revoked, garbled).
  void Function()? onUnauthorized;

  Future<void> init() async {
    if (_ready) return;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _ready = true;
  }

  String? get token => _token;

  Future<void> setToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null) {
      await prefs.remove('auth_token');
    } else {
      await prefs.setString('auth_token', token);
    }
  }

  Map<String, String> _headers({bool withAuth = true}) {
    final h = <String, String>{'Content-Type': 'application/json'};
    if (withAuth && _token != null) h['Authorization'] = 'Bearer $_token';
    return h;
  }

  Uri _u(String path, [Map<String, String>? query]) {
    var s = AppConfig.apiUrl + path;
    if (query != null && query.isNotEmpty) {
      final qs = query.entries
          .map((e) =>
              '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
          .join('&');
      s += '?$qs';
    }
    return Uri.parse(s);
  }

  Future<http.Response> _send(Future<http.Response> Function() fn) async {
    try {
      return await fn().timeout(_defaultTimeout);
    } on TimeoutException {
      throw ApiException(0, 'Request timed out (no response after 15s)');
    } catch (e) {
      // Network errors (no internet, DNS, refused, TLS) — surface as 0.
      throw ApiException(0, 'Network error: ${e.toString()}');
    }
  }

  Future<dynamic> get(String path, {Map<String, String>? query, bool auth = true}) async {
    final r = await _send(() => http.get(_u(path, query), headers: _headers(withAuth: auth)));
    return _decode(r);
  }

  Future<dynamic> post(String path, {Object? body, bool auth = true}) async {
    final r = await _send(() => http.post(
          _u(path),
          headers: _headers(withAuth: auth),
          body: jsonEncode(body ?? {}),
        ));
    return _decode(r);
  }

  Future<dynamic> delete(String path, {bool auth = true}) async {
    final r = await _send(() => http.delete(_u(path), headers: _headers(withAuth: auth)));
    return _decode(r);
  }

  dynamic _decode(http.Response r) {
    final body = r.body.isEmpty ? null : jsonDecode(r.body);
    if (r.statusCode >= 200 && r.statusCode < 300) return body;
    if (r.statusCode == 401) {
      // Fire-and-forget: signal the auth state so it can clear the token and
      // route back to /login. The caller still gets the exception.
      onUnauthorized?.call();
    }
    String msg = 'Request failed (${r.statusCode})';
    if (body is Map && body['message'] != null) {
      final m = body['message'];
      msg = m is List ? m.join(', ') : m.toString();
    }
    throw ApiException(r.statusCode, msg);
  }
}
