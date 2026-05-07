import 'product.dart';

class OrderItem {
  final String id;
  final String productId;
  final int quantity;
  final double price;
  final Product? product;

  OrderItem({
    required this.id,
    required this.productId,
    required this.quantity,
    required this.price,
    this.product,
  });

  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        id: j['id'] as String,
        productId: j['productId'] as String,
        quantity: j['quantity'] as int,
        price: (j['price'] as num).toDouble(),
        product: j['product'] != null
            ? Product.fromJson(Map<String, dynamic>.from(j['product'] as Map))
            : null,
      );
}

class ShippingAddress {
  final String name;
  final String phone;
  final String city;
  final String address;

  ShippingAddress({
    required this.name,
    required this.phone,
    required this.city,
    required this.address,
  });

  Map<String, dynamic> toJson() =>
      {'name': name, 'phone': phone, 'city': city, 'address': address};

  factory ShippingAddress.fromJson(Map<String, dynamic> j) => ShippingAddress(
        name: (j['name'] as String?) ?? '',
        phone: (j['phone'] as String?) ?? '',
        city: (j['city'] as String?) ?? '',
        address: (j['address'] as String?) ?? '',
      );
}

class Order {
  final String id;
  final String userId;
  final String storeId;
  final double totalPrice;
  final double shippingPrice;
  final String status;
  final ShippingAddress shippingAddress;
  final String? paymentUrl;
  final DateTime createdAt;
  final List<OrderItem> items;

  Order({
    required this.id,
    required this.userId,
    required this.storeId,
    required this.totalPrice,
    required this.shippingPrice,
    required this.status,
    required this.shippingAddress,
    this.paymentUrl,
    required this.createdAt,
    required this.items,
  });

  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id: j['id'] as String,
        userId: j['userId'] as String,
        storeId: j['storeId'] as String,
        totalPrice: (j['totalPrice'] as num).toDouble(),
        shippingPrice: (j['shippingPrice'] as num).toDouble(),
        status: j['status'] as String,
        shippingAddress: ShippingAddress.fromJson(
            Map<String, dynamic>.from(j['shippingAddress'] as Map)),
        paymentUrl: j['paymentUrl'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
        items: ((j['items'] as List?) ?? [])
            .map((e) => OrderItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}
