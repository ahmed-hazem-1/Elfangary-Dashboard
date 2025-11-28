
import { Order, OrderStatus, Source } from '../types';
import { WEBHOOK_CONFIG } from './config';

/**
 * Service to handle Order interactions via the local Node.js backend.
 */
export const OrderService = {
  /**
   * Fetches orders from the backend.
   */
  getOrders: async (): Promise<Order[]> => {
    try {
        const response = await fetch(WEBHOOK_CONFIG.GET_ORDERS_URL, { 
            method: 'GET',
            headers: WEBHOOK_CONFIG.HEADERS
        });
        
        if (!response.ok) {
            // Fallback to empty if server isn't running to prevent crash
            console.warn("Backend not reachable. Ensure 'node server.cjs' is running.");
            return [];
        }
        
        const rawData = await response.json();
        console.log(`[API] Fetched ${rawData?.length || 0} orders.`);
        
        return rawData.map(mapDbOrderToAppOrder);

    } catch (error) {
        console.error("[API] Failed to fetch orders:", error);
        return [];
    }
  },

  /**
   * Creates a new order with optional customer information.
   */
  createOrder: async (orderData: {
    customer_name?: string;
    phone_number?: string;
    address?: string;
    items: Array<{ item_id: string; quantity: number }>;
    notes?: string;
    discount_percentage?: number;
  }): Promise<{ success: boolean; order_id?: number; error?: string }> => {
    try {
        const response = await fetch(WEBHOOK_CONFIG.CREATE_ORDER_URL, {
            method: 'POST',
            headers: WEBHOOK_CONFIG.HEADERS,
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const textResponse = await response.text();
                if (textResponse.includes('<!DOCTYPE')) {
                    errorMessage = 'Server returned HTML instead of JSON. Please ensure the backend server (node server.cjs) is running.';
                } else {
                    try {
                        const errorData = JSON.parse(textResponse);
                        errorMessage = errorData.error || errorMessage;
                    } catch {
                        errorMessage = textResponse || errorMessage;
                    }
                }
            } catch {
                errorMessage = `Server error: ${response.status}`;
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log(`[API] Created new order:`, result);
        return result;

    } catch (error) {
        console.error("[API] Failed to create order:", error);
        
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please ensure the backend server (node server.cjs) is running on port 3001.';
            } else if (error.message.includes('Unexpected token')) {
                errorMessage = 'Server returned invalid response. Please check if the backend server is running properly.';
            } else {
                errorMessage = error.message;
            }
        }
        
        return { success: false, error: errorMessage };
    }
  },

  /**
   * Updates an order status.
   */
  updateStatus: async (order: Order, newStatus: OrderStatus): Promise<boolean> => {
    try {
        const payload = {
            order_id: order.order_id,
            new_status: newStatus
        };

        console.log("[API] Sending Update Payload:", payload);

        const response = await fetch(WEBHOOK_CONFIG.UPDATE_ORDER_URL, {
            method: 'POST',
            headers: WEBHOOK_CONFIG.HEADERS,
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Update Failed: ${response.status}`);
        
        const result = await response.json();
        return result.success === true;

    } catch (error) {
        console.error(`[API] Update failed for order ${order.order_id}:`, error);
        return false;
    }
  },

  async deleteOrder(orderId: string): Promise<{success: boolean; error?: string}> {
    try {
      const response = await fetch(`${WEBHOOK_CONFIG.API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...WEBHOOK_CONFIG.HEADERS
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: true };
    } catch (error) {
      console.error('Error deleting order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Fixes order totals by recalculating them on the server
   */
  async fixOrderTotals(): Promise<{success: boolean; message?: string; error?: string}> {
    try {
      const response = await fetch(WEBHOOK_CONFIG.FIX_TOTALS_URL, {
        method: 'POST',
        headers: WEBHOOK_CONFIG.HEADERS
      });

      if (!response.ok) {
        throw new Error(`Failed to fix totals: ${response.status}`);
      }

      const result = await response.json();
      console.log('[API] Fixed order totals:', result.message);
      return { success: true, message: result.message };
    } catch (error) {
      console.error('[API] Failed to fix order totals:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

// Helper: Map Database Row to App Order Interface
function mapDbOrderToAppOrder(dbOrder: any): Order {
    const createdAt = new Date(dbOrder.order_date || new Date());
    
    // Map raw source string to Source Enum
    let source = Source.WEB;
    const rawSource = (dbOrder.source || '').toLowerCase();
    if (rawSource.includes('telegram')) source = Source.TELEGRAM;
    else if (rawSource.includes('whatsapp')) source = Source.WHATSAPP;
    else if (rawSource.includes('dine')) source = Source.DINE_IN;

    // Map items first
    const items = (dbOrder.items || []).map((item: any, idx: number) => ({
        item_id: item.item_id || `unknown_${idx}`,
        item_name_ar: item.item_name_ar || 'Unknown Item',
        quantity: item.quantity || 1,
        unit_price_at_order: parseFloat(item.unit_price_at_order || 0)
    }));

    // Calculate total from items if database total is 0 or missing
    let totalAmount = parseFloat(dbOrder.total_amount || 0);
    let subtotal = parseFloat(dbOrder.subtotal || 0);
    const discountPercentage = parseFloat(dbOrder.discount_percentage || 0);
    
    // If subtotal is 0 or missing, calculate from items
    if (subtotal === 0 && items.length > 0) {
        subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price_at_order), 0);
    }
    
    // If total is 0 or missing, use subtotal or calculate from items
    if (totalAmount === 0) {
        if (discountPercentage > 0 && subtotal > 0) {
            totalAmount = subtotal * (1 - discountPercentage / 100);
        } else {
            totalAmount = subtotal;
        }
        console.log(`[OrderService] Calculated total for order ${dbOrder.order_id}: ${totalAmount} EGP`);
    }
    
    // Calculate discount amount
    const discountAmount = subtotal > 0 ? subtotal - totalAmount : 0;

    return {
        order_id: dbOrder.order_id,
        restaurant_id: 3, 
        status: (dbOrder.status as OrderStatus) || OrderStatus.PENDING_CONFIRMATION,
        notes: dbOrder.payment_type ? `Payment: ${dbOrder.payment_type}` : '', // Mapping payment info to notes for visibility
        created_at: createdAt,
        time_elapsed: calculateTimeElapsed(createdAt),
        total_amount: totalAmount,
        subtotal: subtotal,
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        is_paid: dbOrder.status !== 'canceled', 
        address: dbOrder.shipping_address || dbOrder.client_address || '',
        
        customer: {
            customer_id: dbOrder.client_id,
            full_name: dbOrder.full_name || 'Unknown Customer',
            phone_number: dbOrder.phone_number || '',
            source: source,
            full_address: dbOrder.shipping_address || dbOrder.client_address || ''
        },
        
        items: items
    };
}

function calculateTimeElapsed(date: Date): string {
    if (isNaN(date.getTime())) return "00:00:00";
    const diff = new Date().getTime() - date.getTime();
    if (diff < 0) return "00:00:00";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
