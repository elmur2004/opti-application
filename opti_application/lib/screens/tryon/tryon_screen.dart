import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../config/app_config.dart';

/// Hosts the web AR / multi-angle PNG try-on module in a WebView.
///
/// Communication contract (matches spec doc §7):
///   web -> flutter via JS channel `FlutterChannel.postMessage(JSON.stringify({...}))`
///
/// Recognised message types:
///   - { type: 'ADD_TO_CART', productId, angle? }  → returns this map via Navigator.pop
///   - { type: 'CLOSE' }                          → pops with null
class TryOnScreen extends StatefulWidget {
  final String productId;
  const TryOnScreen({super.key, required this.productId});

  @override
  State<TryOnScreen> createState() => _TryOnScreenState();
}

class _TryOnScreenState extends State<TryOnScreen> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    final url =
        '${AppConfig.tryOnUrl}?productId=${widget.productId}&api=${Uri.encodeComponent(AppConfig.apiUrl)}';
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0B0B0C))
      ..addJavaScriptChannel(
        'FlutterChannel',
        onMessageReceived: _onMessage,
      )
      ..loadRequest(Uri.parse(url));
  }

  void _onMessage(JavaScriptMessage message) {
    if (!mounted) return;
    try {
      final data = jsonDecode(message.message) as Map<String, dynamic>;
      switch (data['type']) {
        case 'ADD_TO_CART':
          Navigator.pop(context, data);
          break;
        case 'CLOSE':
          Navigator.pop(context);
          break;
      }
    } catch (_) {
      // Ignore malformed payloads.
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0B0C),
      appBar: AppBar(
        title: const Text('Virtual try-on'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      body: WebViewWidget(controller: _controller),
    );
  }
}
