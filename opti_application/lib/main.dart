import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/cart_service.dart';
import 'services/order_service.dart';
import 'services/product_service.dart';
import 'services/store_service.dart';
import 'services/wishlist_service.dart';
import 'state/auth_state.dart';
import 'state/cart_state.dart';
import 'state/store_state.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient();
  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        Provider<AuthService>(create: (_) => AuthService(api)),
        Provider<StoreService>(create: (_) => StoreService(api)),
        Provider<ProductService>(create: (_) => ProductService(api)),
        Provider<CartService>(create: (_) => CartService(api)),
        Provider<OrderService>(create: (_) => OrderService(api)),
        Provider<WishlistService>(create: (_) => WishlistService(api)),
        ChangeNotifierProvider(
            create: (ctx) => AuthState(ctx.read<AuthService>(), api)),
        ChangeNotifierProvider(
            create: (ctx) => CartState(ctx.read<CartService>())),
        ChangeNotifierProvider(create: (_) => StoreState()),
      ],
      child: const OptiApp(),
    ),
  );
}
