/// Runtime configuration for the app.
///
/// Override at run time:
///   flutter run --dart-define=API_URL=http://192.168.1.10:3000/api
///                --dart-define=TRYON_URL=http://192.168.1.10:3000/tryon.html
class AppConfig {
  /// Backend base URL.
  /// - Android emulator default: 10.0.2.2 maps to host's localhost.
  /// - iOS simulator: use http://localhost:3000/api
  /// - Physical device: use your machine's LAN IP (e.g. http://192.168.x.x:3000/api)
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:3000/api',
  );

  /// Web AR / try-on module URL. Defaults to backend's static stub.
  static const String tryOnUrl = String.fromEnvironment(
    'TRYON_URL',
    defaultValue: 'http://10.0.2.2:3000/tryon.html',
  );
}
