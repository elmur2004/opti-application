export interface AdminUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'STORE_ADMIN' | 'SUPER_ADMIN';
  storeId: string | null;
}

export interface Store {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
}

export interface ProductAsset {
  id: string;
  productId: string;
  angle: 'front' | 'left_45' | 'right_45' | 'left_side' | 'right_side';
  imageUrl: string;
}

export interface TryOnConfig {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  rotationSensitivity?: number;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  stock: number;
  tryOnConfig: TryOnConfig;
  createdAt: string;
  assets?: ProductAsset[];
  store?: { id: string; name: string };
}

export interface ShippingRule {
  id: string;
  storeId: string;
  city: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  city: string;
  address: string;
}

export interface Order {
  id: string;
  userId: string;
  storeId: string;
  totalPrice: number;
  shippingPrice: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED';
  shippingAddress: ShippingAddress;
  paymentUrl: string | null;
  createdAt: string;
  items: OrderItem[];
  user?: { email: string };
}

export const ANGLES = ['front', 'left_45', 'right_45', 'left_side', 'right_side'] as const;
export type Angle = (typeof ANGLES)[number];
