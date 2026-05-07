class Store {
  final String id;
  final String name;
  final String domain;
  final String? logoUrl;

  Store({required this.id, required this.name, required this.domain, this.logoUrl});

  factory Store.fromJson(Map<String, dynamic> j) => Store(
        id: j['id'] as String,
        name: j['name'] as String,
        domain: j['domain'] as String,
        logoUrl: j['logoUrl'] as String?,
      );
}
