
import { Order, OrderStatus, Source, OrderItem } from '../types';
import { TARGET_RESTAURANT_ID } from './config';
import { MOCK_CUSTOMER_NAMES, MOCK_ADDRESSES, MOCK_MENU_ITEMS_POOL } from '../constants';

type EventHandler = (data: any) => void;

/**
 * MockWebSocketService
 * Simulates a real-time WebSocket connection to the backend.
 * It automatically generates new orders to demonstrate live updates.
 */
class MockWebSocketService {
  private handlers: Record<string, EventHandler[]> = {};
  private intervalId: any;
  private lastOrderId = 2000; // Start ID for generated orders

  /**
   * Connects to the "socket"
   */
  connect() {
    console.log("[WebSocket] Connected to wss://api.elfangary-honey.com/orders");
    this.startSimulation();
    return this;
  }

  /**
   * Disconnects and stops simulation
   */
  disconnect() {
    console.log("[WebSocket] Disconnected");
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  private emit(event: string, data: any) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(h => h(data));
    }
  }

  /**
   * Simulates incoming events from the server
   */
  private startSimulation() {
    // Simulate a new order every 10-20 seconds
    this.intervalId = setInterval(() => {
      const shouldCreateOrder = Math.random() > 0.3; // 70% chance to create order each interval

      if (shouldCreateOrder) {
        const newOrder = this.generateRandomOrder();
        console.log(`[WebSocket] New Order Event Received: #${newOrder.order_id}`);
        this.emit('order_created', newOrder);
      }
    }, 12000);
  }

  /**
   * Helper to generate a realistic looking random order
   */
  private generateRandomOrder(): Order {
    this.lastOrderId++;
    
    // Random Customer
    const randomName = MOCK_CUSTOMER_NAMES[Math.floor(Math.random() * MOCK_CUSTOMER_NAMES.length)];
    const randomSource = [Source.WEB, Source.WHATSAPP, Source.TELEGRAM][Math.floor(Math.random() * 3)];
    const randomAddress = MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];

    // Random Items (1 to 4 items)
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const items: OrderItem[] = [];
    let totalAmount = 0;

    for (let i = 0; i < itemCount; i++) {
        const randomItem = MOCK_MENU_ITEMS_POOL[Math.floor(Math.random() * MOCK_MENU_ITEMS_POOL.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        
        items.push({
            item_id: `gen_${this.lastOrderId}_${i}`,
            item_name_ar: randomItem.name_ar,
            quantity: qty,
            unit_price_at_order: randomItem.price
        });
        totalAmount += (randomItem.price * qty);
    }

    return {
        order_id: this.lastOrderId.toString(),
        restaurant_id: TARGET_RESTAURANT_ID,
        created_at: new Date(),
        status: OrderStatus.PENDING_CONFIRMATION,
        total_amount: totalAmount,
        time_elapsed: '00:00:05',
        is_paid: Math.random() > 0.5,
        notes: Math.random() > 0.8 ? 'Please ensure it is well packaged' : undefined,
        address: randomAddress,
        customer: {
            customer_id: `c_gen_${this.lastOrderId}`,
            full_name: randomName,
            phone_number: '+966 5X XXX XXXX',
            source: randomSource as Source,
            full_address: randomAddress
        },
        items: items
    };
  }
}

export const socketService = new MockWebSocketService();