export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
export type OrderType = "pickup" | "delivery";

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  modifiers: Record<string, unknown>;
  allergens: string[];
}

export interface Order {
  id: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  order_type: OrderType;
  delivery_address: string | null;
  status: OrderStatus;
  created_at: string;
}

export interface CallLog {
  id: string;
  call_uuid: string;
  customer_phone: string | null;
  duration_seconds: number;
  transcript: string | null;
  recording_url: string | null;
  detected_language: string | null;
  ai_confidence_avg: number | null;
  outcome: string | null;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  base_price: number;
  price?: string;
  size_prices?: Record<string, string>;
  ingredients?: string[];
  description: string | null;
  is_available: boolean;
  allergens: string[];
  modifiers: Record<string, unknown>;
  sort_order: number;
}

export interface AnalyticsSummary {
  total_calls: number;
  total_orders: number;
  revenue: number;
  conversion_rate: number;
  missed_calls: number;
}
