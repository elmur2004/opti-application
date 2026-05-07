class User {
  final String id;
  final String email;
  final String role;
  final String? storeId;

  User({required this.id, required this.email, required this.role, this.storeId});

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as String,
        email: j['email'] as String,
        role: j['role'] as String,
        storeId: j['storeId'] as String?,
      );
}
