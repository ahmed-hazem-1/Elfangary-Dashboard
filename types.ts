
// Enum matching n8n webhook values
export enum OrderStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELED = 'canceled'
}

// Matches `customers.source` logic
export enum Source {
  TELEGRAM = 'Telegram',
  WEB = 'Web',
  WHATSAPP = 'Whatsapp', // Replaced 'App' with 'Whatsapp'
  DINE_IN = 'Dine In'
}

// Matches `menu_items` table structure partially for order details
export interface OrderItem {
  item_id: string;
  item_name_ar: string; // Mapped from item_name in webhook
  quantity: number;     
  unit_price_at_order: number; // Mapped from item_price
}

// Represents a joined view of Orders + Customers + OrderItems
export interface Order {
  // orders table
  order_id: string;
  restaurant_id: number;
  status: OrderStatus;
  notes?: string;
  created_at: Date;
  address?: string;
  
  // customers table (joined data from webhook)
  customer: {
    customer_id: string;
    full_name: string;
    phone_number: string;
    source: Source; 
    full_address?: string;
    telegram_id?: string | null;
    whatsapp_id?: string | null;
  };

  // order_items table (joined)
  items: OrderItem[];

  // Computed/UI specific
  total_amount: number;
  subtotal?: number; // Amount before discount
  discount_percentage?: number; // Discount percentage (0-100)
  discount_amount?: number; // Calculated discount amount
  time_elapsed: string; // Helper for UI display
  is_paid: boolean; // Inferred from status or data
}

// Webhook Response Types
export interface WebhookOrder {
    order_id: number;
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    customer_source: string;
    delivery_address: string;
    order_time_cairo: string;
    status: string;
    total_price: number;
    notes: string;
    telegram_id: string | null;
    whatsapp_id: string | null;
    order_items: Array<{
        item_id: number;
        item_name: string;
        quantity: number;
        item_price: number;
        unit_price: number;
    }>;
}

export interface WebhookResponse {
    orders: WebhookOrder[];
    stats: any;
}

// Menu Item Interface based on menu_items table
export interface MenuItem {
  item_id: number;
  item_name_ar: string;
  category_ar: string;
  description_ar: string;
  price: number;
  is_available: boolean;
}
