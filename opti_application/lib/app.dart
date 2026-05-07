import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/stores/store_picker_screen.dart';
import 'screens/products/product_list_screen.dart';
import 'screens/products/product_detail_screen.dart';
import 'screens/cart/cart_screen.dart';
import 'screens/checkout/checkout_screen.dart';
import 'screens/orders/orders_screen.dart';
import 'state/auth_state.dart';

class OptiApp extends StatelessWidget {
  const OptiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Opti',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(centerTitle: false),
      ),
      home: const _Root(),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/stores': (_) => const StorePickerScreen(),
        '/products': (_) => const ProductListScreen(),
        '/cart': (_) => const CartScreen(),
        '/checkout': (_) => const CheckoutScreen(),
        '/orders': (_) => const OrdersScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/product') {
          final id = settings.arguments as String;
          return MaterialPageRoute(
              builder: (_) => ProductDetailScreen(productId: id));
        }
        return null;
      },
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    if (auth.loading) return const SplashScreen();
    if (!auth.isAuthenticated) return const LoginScreen();
    return const StorePickerScreen();
  }
}
