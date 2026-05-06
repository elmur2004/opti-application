#!/bin/bash
# End-to-end test mapped to mobile_app_test.md sections.
# Uses a freshly-created product per run so prior runs' depleted stock can't
# poison the new pass. Logs every finding with priority.
API=http://localhost:3000/api
ADMIN=http://localhost:3001
J() { node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const o=JSON.parse(s);console.log(typeof o[process.argv[1]]==='undefined'?'':o[process.argv[1]])}catch(e){}})" "$1"; }
itemslen() { node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).items.length)}catch{console.log('err')}})"; }
arrlen() { node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).length)}catch{console.log('err')}})"; }

CRIT=(); HIGH=(); MED=(); LOW=()
add_crit() { CRIT+=("$1"); echo "  [CRITICAL] $1"; }
add_high() { HIGH+=("$1"); echo "  [HIGH]     $1"; }
add_med() { MED+=("$1"); echo "  [MEDIUM]   $1"; }
add_low() { LOW+=("$1"); echo "  [LOW]      $1"; }
PASS=0
ok() { PASS=$((PASS+1)); }

# ---- Setup ----
CUST=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email":"customer@example.com","password":"password123"}' | J token)
OPT=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email":"admin@opticvision.com","password":"password123"}' | J token)
LENS=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email":"admin@lenscraft.com","password":"password123"}' | J token)
EMAIL="e2e_$RANDOM@x.com"
curl -s -X POST $API/auth/register -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"password123\"}" > /dev/null
TUSER=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"password123\"}" | J token)

OPTIC_ID=$(curl -s $API/stores | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).find(x=>x.domain==='opticvision').id))")
LENS_ID=$(curl -s $API/stores | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).find(x=>x.domain==='lenscraft').id))")

A_C="Authorization: Bearer $CUST"
A_O="Authorization: Bearer $OPT"
A_L="Authorization: Bearer $LENS"
A_T="Authorization: Bearer $TUSER"
CT="Content-Type: application/json"

# Fresh test product (stock plentiful) so prior runs can't break this one.
TP_RESP=$(curl -s -X POST $API/admin/products -H "$A_O" -H "$CT" -d '{"name":"E2E_TestProduct","description":"d","price":15.50,"thumbnailUrl":"http://x.example/x.jpg","stock":100,"tryOnConfig":{"scale":1.2}}')
TEST_PROD=$(echo "$TP_RESP" | J id)
LENS_TP_RESP=$(curl -s -X POST $API/admin/products -H "$A_L" -H "$CT" -d '{"name":"E2E_LensProd","description":"d","price":20,"thumbnailUrl":"http://x.example/y.jpg","stock":50}')
LENS_TEST_PROD=$(echo "$LENS_TP_RESP" | J id)
[ -z "$TEST_PROD" ] && { echo "FATAL: couldn't create test product: $TP_RESP"; exit 2; }

cleanup() {
  curl -s -X DELETE "$API/admin/products/$TEST_PROD" -H "$A_O" > /dev/null 2>&1
  curl -s -X DELETE "$API/admin/products/$LENS_TEST_PROD" -H "$A_L" > /dev/null 2>&1
}

echo "=== §5 AUTHENTICATION ==="
[ $(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/register -H "$CT" -d "{\"email\":\"new$RANDOM@x.com\",\"password\":\"password123\"}") = "201" ] && ok || add_high "register fresh user failed"
[ $(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/login -H "$CT" -d '{"email":"customer@example.com","password":"password123"}') = "201" ] && ok || add_high "valid login fails"
[ $(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/login -H "$CT" -d '{"email":"customer@example.com","password":"wrong"}') = "401" ] && ok || add_high "invalid login not 401"
[ -n "$CUST" ] && ok || add_high "token not returned"
[ $(curl -s -o /dev/null -w "%{http_code}" $API/cart) = "401" ] && ok || add_high "protected route doesn't enforce auth"
[ $(curl -s -o /dev/null -w "%{http_code}" $API/cart -H "$A_C") = "200" ] && ok || add_high "valid token rejected on protected route"
[ $(curl -s -o /dev/null -w "%{http_code}" $API/auth/me -H "$A_C") = "200" ] && ok || add_high "/auth/me broken"

echo ""
echo "=== §6 MULTI-TENANT ==="
[ $(curl -s $API/stores | arrlen) -ge "2" ] && ok || add_med "fewer than 2 stores seeded"
[ $(curl -s -o /dev/null -w "%{http_code}" "$API/admin/products/$LENS_TEST_PROD" -H "$A_O") = "403" ] && ok || add_crit "cross-store admin can read other store's product"
[ $(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/admin/products/$LENS_TEST_PROD" -H "$A_O" -H "$CT" -d '{"price":1}') = "403" ] && ok || add_crit "cross-store admin can patch"
if [ $(curl -s -o /dev/null -w "%{http_code}" -X POST $API/admin/stores -H "$A_O" -H "$CT" -d '{"name":"X","domain":"x"}') = "404" ]; then
  add_med "no store-create endpoint (test plan §6 'create multiple stores' — only seed creates them; SUPER_ADMIN should be able to provision)"
else ok; fi

echo ""
echo "=== §7 PRODUCT MANAGEMENT ==="
[ -n "$TEST_PROD" ] && ok || add_high "admin product create fails"
SCALE=$(echo "$TP_RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).tryOnConfig.scale)}catch(e){}})")
[ "$SCALE" = "1.2" ] && ok || add_med "tryOnConfig not persisted on create"
if [ $(curl -s -o /dev/null -w "%{http_code}" -X POST $API/admin/uploads -H "$A_O") = "404" ]; then
  add_high "no image-upload endpoint (test plan §7 'upload thumbnail / multi-angle images' — admin only accepts URL paste)"
else ok; fi
RESP=$(curl -s -X PUT "$API/admin/products/$TEST_PROD/assets" -H "$A_O" -H "$CT" -d '{"angle":"front","imageUrl":"http://x.example/front.jpg"}')
[ $(echo "$RESP" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).assets.length)}catch(e){console.log(0)}})") = "1" ] && ok || add_high "asset PUT broken"
[ -n "$(curl -s $API/products/$TEST_PROD | J id)" ] && ok || add_high "admin-created product not visible to customer API"

echo ""
echo "=== §8/§9 TRY-ON & WEBVIEW BRIDGE (code review) ==="
TRY="d:/opti application/backend/public/tryon.html"
TRY_FLUT="d:/opti application/opti_application/lib/screens/tryon/tryon_screen.dart"
grep -q "navigator.mediaDevices.getUserMedia" "$TRY" && ok || add_high "no camera request"
grep -q "FaceLandmarker.createFromOptions" "$TRY" && ok || add_high "no face detection"
grep -q "drawGlasses" "$TRY" && ok || add_high "no glasses overlay"
grep -q "yawToAngle" "$TRY" && ok || add_high "no yaw→angle mapping"
grep -q "toDataURL" "$TRY" && ok || add_high "no screenshot"
grep -q "addJavaScriptChannel" "$TRY_FLUT" && ok || add_high "Flutter WebView channel not registered"
grep -q "ADD_TO_CART" "$TRY_FLUT" && ok || add_high "Flutter doesn't handle ADD_TO_CART"
grep -q "try {" "$TRY_FLUT" && ok || add_med "Flutter postMessage parser not in try/catch"

echo ""
echo "=== §10 CART ==="
curl -s -X DELETE $API/cart/clear -H "$A_T" > /dev/null
[ $(curl -s -X POST $API/cart/add -H "$A_T" -H "$CT" -d "{\"productId\":\"$TEST_PROD\"}" | itemslen) = "1" ] && ok || add_high "cart add broken"
R=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/cart/items/$TEST_PROD" -H "$A_T" -H "$CT" -d '{"quantity":5}')
if [ "$R" = "404" ] || [ "$R" = "405" ]; then
  add_high "no cart 'update quantity' endpoint (test plan §10) — only add(increment)/remove exist"
else
  ok
  Q=$(curl -s $API/cart -H "$A_T" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{console.log(JSON.parse(s).items[0].quantity)}catch(e){console.log('err')}})")
  [ "$Q" = "5" ] && ok || add_high "PATCH /cart/items returned $R but quantity is $Q (expected 5)"
fi
[ $(curl -s -X POST $API/cart/remove -H "$A_T" -H "$CT" -d "{\"productId\":\"$TEST_PROD\"}" | itemslen) = "0" ] && ok || add_high "cart remove broken"
curl -s -X POST $API/cart/add -H "$A_T" -H "$CT" -d "{\"productId\":\"$TEST_PROD\",\"quantity\":2}" > /dev/null
TOT=$(curl -s $API/cart -H "$A_T" | J total)
EXP=$(node -e "console.log(15.50*2)")
[ "$TOT" = "$EXP" ] && ok || add_high "cart total math wrong (got $TOT, expected $EXP)"

echo ""
echo "=== §11 CHECKOUT (Paymob is documented mock; not a finding) ==="
ORD=$(curl -s -X POST $API/orders -H "$A_T" -H "$CT" -d '{"shippingAddress":{"name":"Test","phone":"+20100","city":"Cairo","address":"a"}}')
OID=$(echo "$ORD" | J id)
[ -n "$OID" ] && ok || add_high "order create broken: ${ORD:0:200}"
SHIP=$(echo "$ORD" | J shippingPrice)
[ "$SHIP" = "30" ] && ok || add_high "Cairo shipping = $SHIP, expected 30"
ST=$(echo "$ORD" | J status)
[ "$ST" = "PENDING" ] && ok || add_high "new order status = $ST, expected PENDING"
[ $(curl -s $API/cart -H "$A_T" | itemslen) = "0" ] && ok || add_high "cart not cleared after order"

echo ""
echo "=== §12 ORDERS ==="
[ $(curl -s $API/orders/my -H "$A_T" | arrlen) -ge "1" ] && ok || add_high "customer can't see own orders"
[ -n "$(curl -s "$API/orders/$OID" -H "$A_T" | J id)" ] && ok || add_high "order details broken"
[ $(curl -s $API/admin/orders -H "$A_O" | arrlen) -ge "1" ] && ok || add_high "admin can't see orders"
LEN_FILT=$(curl -s "$API/admin/orders?status=PENDING" -H "$A_O" | arrlen)
LEN_PAID=$(curl -s "$API/admin/orders?status=PAID" -H "$A_O" | arrlen)
LEN_ALL=$(curl -s $API/admin/orders -H "$A_O" | arrlen)
# A working filter should produce LEN_FILT + LEN_PAID + ... = LEN_ALL (modulo other statuses).
# If unfiltered, all three counts equal each other (the filter is silently ignored).
if [ "$LEN_FILT" = "$LEN_ALL" ] && [ "$LEN_PAID" = "$LEN_ALL" ] && [ "$LEN_ALL" -gt "0" ]; then
  add_med "no order status filter (test plan §12) — ?status=… returns all orders unfiltered"
else ok; fi
R=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/admin/orders/$OID" -H "$A_O" -H "$CT" -d '{"status":"SHIPPED"}')
if [ "$R" = "404" ] || [ "$R" = "405" ]; then
  add_med "no generic order-status update endpoint (test plan §12 'Update status'). Only mark-paid; can't set SHIPPED/CANCELLED"
else ok; fi
[ $(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/admin/orders/$OID/mark-paid" -H "$A_L") = "404" ] && ok || add_crit "cross-store mark-paid still allowed (regression)"

echo ""
echo "=== §13 SHIPPING ==="
[ "$(curl -s "$API/stores/$OPTIC_ID/shipping/quote?city=Cairo" | J price)" = "30" ] && ok || add_high "shipping quote broken"
[ "$(curl -s "$API/stores/$OPTIC_ID/shipping/quote?city=Atlantis" | J isDefault)" = "true" ] && ok || add_high "fallback shipping not flagged"

echo ""
echo "=== §14 API STATUS CODES ==="
[ $(curl -s -o /dev/null -w "%{http_code}" $API/products/notreal) = "404" ] && ok || add_med "404 not returned for missing product"
[ $(curl -s -o /dev/null -w "%{http_code}" -X POST $API/cart/add -H "$A_T" -H "$CT" -d '{}') = "400" ] && ok || add_med "400 not returned for invalid payload"
[ $(curl -s -o /dev/null -w "%{http_code}" $API/admin/products) = "401" ] && ok || add_high "401 not returned for unauth on admin route"
[ $(curl -s -o /dev/null -w "%{http_code}" $API/admin/products -H "$A_C") = "403" ] && ok || add_high "403 not returned for customer on admin route"

echo ""
echo "=== §15 DB INTEGRITY ==="
ORPHAN_OUT=$(cd "d:/opti application/backend" && node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const cartItems = await p.cartItem.findMany({ include: { product: true, cart: true } });
  const orphCart = cartItems.filter(i => !i.product || !i.cart).length;
  const wishItems = await p.wishlistItem.findMany({ include: { product: true, user: true } });
  const orphWish = wishItems.filter(i => !i.product || !i.user).length;
  const orderItems = await p.orderItem.findMany({ include: { order: true } });
  const orphOrder = orderItems.filter(i => !i.order).length;
  const assets = await p.productAsset.findMany({ include: { product: true } });
  const orphAss = assets.filter(a => !a.product).length;
  console.log(JSON.stringify({ cart: orphCart, wishlist: orphWish, orderItem: orphOrder, asset: orphAss }));
  await p.\$disconnect();
})();
" 2>&1 | tail -1)
echo "  orphan counts: $ORPHAN_OUT"
echo "$ORPHAN_OUT" | grep -q '"cart":0,"wishlist":0,"orderItem":0,"asset":0' && ok || add_high "orphan rows present: $ORPHAN_OUT"

echo ""
echo "=== §16 ERROR HANDLING ==="
grep -q "showError" "$TRY" && ok || add_med "try-on missing showError UI"
grep -q "navigator.mediaDevices.getUserMedia" "$TRY" && ok || add_med "try-on missing camera-permission code"
grep -q "Look straight\|hint" "$TRY" && ok || add_med "try-on missing face-not-found hint"
grep -q "TimeoutException\|.timeout(" "d:/opti application/opti_application/lib/services/api_client.dart" && ok || add_high "Flutter ApiClient missing timeout"

echo ""
echo "=== §17 PERFORMANCE ==="
START=$(node -e "console.log(Date.now())")
for i in 1 2 3 4 5; do curl -s -o /dev/null $API/stores; done
END=$(node -e "console.log(Date.now())")
AVG=$(node -e "console.log(Math.round(($END - $START) / 5))")
echo "  /api/stores avg latency over 5 calls: ${AVG}ms"
[ "$AVG" -lt "500" ] && ok || add_med "API latency >500ms ($AVG ms)"

echo ""
echo "=== §18 SECURITY ==="
[ $(curl -s -o /dev/null -w "%{http_code}" $API/cart) = "401" ] && ok || add_crit "/api/cart accessible without auth"
[ $(curl -s -o /dev/null -w "%{http_code}" $API/admin/products) = "401" ] && ok || add_crit "/api/admin/products accessible without auth"
[ $(curl -s -o /dev/null -w "%{http_code}" $API/admin/products -H "$A_C") = "403" ] && ok || add_crit "customer can hit /api/admin/products"
[ $(curl -s -o /dev/null -w "%{http_code}" $API/cart -H "Authorization: Bearer fake.tok.en") = "401" ] && ok || add_crit "fake JWT accepted"

cleanup
echo ""
echo "==========================================="
echo "  SUMMARY"
echo "==========================================="
echo "  Passed checks: $PASS"
echo "  Critical: ${#CRIT[@]}"
echo "  High:     ${#HIGH[@]}"
echo "  Medium:   ${#MED[@]}"
echo "  Low:      ${#LOW[@]}"
TOTAL=$(( ${#CRIT[@]} + ${#HIGH[@]} + ${#MED[@]} + ${#LOW[@]} ))
echo "  Total findings: $TOTAL"
if [ "$TOTAL" -gt 0 ]; then
  echo ""
  echo "  --- ALL FINDINGS ---"
  for f in "${CRIT[@]}"; do echo "  [CRITICAL] $f"; done
  for f in "${HIGH[@]}"; do echo "  [HIGH]     $f"; done
  for f in "${MED[@]}"; do echo "  [MEDIUM]   $f"; done
  for f in "${LOW[@]}"; do echo "  [LOW]      $f"; done
  exit 1
fi
echo ""
echo "  ALL CLEAN — zero findings"
exit 0
