// ============================
// Order Types
// ============================

export type Order = {
  name: string;
  price: number;
};

export type CartItem = {
  name: string;
  price: number;
  quantity: number;
};

// ============================
// Database Types
// ============================

export type DbOrder = {
  id: string;
  restaurant_slug: string | null;
  customer_name: string | null;
  phone_number: string | null;
  total_price: number | null;
  status: string | null;
  created_at: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  item_name: string | null;
  quantity: number | null;
  price: number | null;
};

export type DbOrderWithItems = DbOrder & { items: DbOrderItem[] };

export type PaymentLog = {
  id: string;
  stripe_session_id: string | null;
  restaurant_slug: string | null;
  event_type: string;
  status: 'success' | 'failed' | 'expired' | 'pending';
  amount: number | null;
  currency: string;
  customer_email: string | null;
  customer_phone: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

// ============================
// Payment Types (Transactional)
// ============================

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type DbPayment = {
  id: string;
  order_id: string;
  tenant_id: string | null;
  stripe_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  refunded_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type DbPaymentWithOrder = DbPayment & { order: DbOrder };

// ============================
// Audit Log Types
// ============================

export type AuditAction =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'DELETE_ORDER'
  | 'CREATE_PAYMENT'
  | 'UPDATE_PAYMENT_STATUS'
  | 'REFUND_PAYMENT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CHANGE_ROLE'
  | 'UPDATE_TENANT'
  | 'CREATE_USER'
  | 'DELETE_USER';

export type DbAuditLog = {
  id: string;
  actor_id: string | null;
  action: AuditAction | string;
  entity: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

// ============================
// RBAC Types
// ============================

export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

export type DbUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  tenant_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbTenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ============================
// Menu Types
// ============================

export type MenuItem = {
  category: string;
  img: string;
  title: string;
  description: string;
  price: number;
  slug: string;
};

export type MenuCategory = 'appetizers' | 'main' | 'grills' | 'drinks';

// ============================
// Reservation Types
// ============================

export type Reservation = {
  name: string;
  phone: string;
  date: string;
  guests: number;
  orders: Order[];
};

// ============================
// API Types
// ============================

export type CheckoutRequest = {
  items: CartItem[];
  restaurantSlug: string;
};

export type CheckoutResponse = {
  url: string;
};

export type ApiError = {
  error: string;
};
