class ProductAssets {
  final String productId;
  final Map<String, String> angles;
  final Map<String, dynamic> tryOnConfig;

  ProductAssets({
    required this.productId,
    required this.angles,
    required this.tryOnConfig,
  });

  factory ProductAssets.fromJson(Map<String, dynamic> j) => ProductAssets(
        productId: j['productId'] as String,
        angles: (j['angles'] as Map)
            .map((k, v) => MapEntry(k.toString(), v.toString())),
        tryOnConfig: (j['tryOnConfig'] as Map?)?.cast<String, dynamic>() ?? {},
      );
}
