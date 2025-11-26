const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL Connection Pool
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/elfangary_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
};

console.log(`[Database] Attempting to connect to: ${dbConfig.connectionString.split('@')[1] || 'local'}`);

const pool = new Pool(dbConfig);

let dbConnected = false;

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    console.log('⚠️  Falling back to mock data mode');
    dbConnected = false;
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
    dbConnected = true;
  }
});

// Set up error handler for connection pool
pool.on('error', (err) => {
  console.error('⚠️  Unexpected error on idle client:', err);
  dbConnected = false;
});

// Middleware
app.use(cors());
app.use(express.json());

// Mock database - Orders
const mockOrders = [
  {
    order_id: 1001,
    client_id: 'C001',
    full_name: 'Ahmed Hassan',
    phone_number: '01001234567',
    order_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'pending_confirmation',
    payment_type: 'cash',
    source: 'telegram',
    total_amount: 250.50,
    shipping_address: 'Cairo, Egypt',
    items: [
      { item_id: 'I001', item_name_ar: 'عسل السدر', quantity: 2, unit_price_at_order: 125.25 }
    ]
  },
  {
    order_id: 1002,
    client_id: 'C002',
    full_name: 'Fatima Mohamed',
    phone_number: '01098765432',
    order_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'in_preparation',
    payment_type: 'card',
    source: 'whatsapp',
    total_amount: 180.00,
    shipping_address: 'Giza, Egypt',
    items: [
      { item_id: 'I002', item_name_ar: 'عسل الزهور البرية', quantity: 1, unit_price_at_order: 180.00 }
    ]
  },
  {
    order_id: 1003,
    client_id: 'C003',
    full_name: 'Mohammad Ali',
    phone_number: '01111234567',
    order_date: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'ready',
    payment_type: 'cash',
    source: 'dine-in',
    total_amount: 320.75,
    shipping_address: 'Alexandria, Egypt',
    items: [
      { item_id: 'I001', item_name_ar: 'عسل السدر', quantity: 1, unit_price_at_order: 150.00 },
      { item_id: 'I003', item_name_ar: 'غذاء الملكات', quantity: 2, unit_price_at_order: 85.375 }
    ]
  }
];

// Mock database - Menu
const mockMenu = [
  {
    item_id: 'I001',
    item_name_ar: 'عسل السدر',
    item_name_en: 'Sidr Honey',
    description: 'Premium acacia honey',
    price: 150.00,
    is_available: true,
    image_url: '/images/sidr-honey.jpg'
  },
  {
    item_id: 'I002',
    item_name_ar: 'عسل الزهور البرية',
    item_name_en: 'Wild Flower Honey',
    description: 'Natural mixed flower honey',
    price: 180.00,
    is_available: true,
    image_url: '/images/wildflower-honey.jpg'
  },
  {
    item_id: 'I003',
    item_name_ar: 'غذاء الملكات',
    item_name_en: 'Royal Jelly',
    description: 'Pure royal jelly',
    price: 85.50,
    is_available: false,
    image_url: '/images/royal-jelly.jpg'
  }
];

// Routes

/**
 * GET /api/orders
 * Fetches all orders from database
 */
app.get('/api/orders', async (req, res) => {
  try {
    console.log('[API] Fetching orders from database...');
    
    const result = await pool.query(`
      SELECT 
        o.order_id,
        o.client_id,
        COALESCE(c.full_name, 'Unknown Customer') as full_name,
        COALESCE(c.phone_number, '') as phone_number,
        COALESCE(c.source, 'external') as source,
        o.order_date,
        o.status,
        o.payment_type,
        o.total_amount,
        COALESCE(o.shipping_address, c.shipping_address, '') as shipping_address,
        json_agg(
          json_build_object(
            'item_id', COALESCE(oi.item_id::text, 'unknown'),
            'item_name_ar', COALESCE(i.name, 'Unknown Item'),
            'quantity', COALESCE(oi.quantity, 1),
            'unit_price_at_order', COALESCE(oi.price_at_purchase, 0)
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.client_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN items i ON oi.item_id = i.item_id
      GROUP BY o.order_id, o.client_id, c.full_name, c.phone_number, c.source, o.order_date, o.status, o.payment_type, o.total_amount, o.shipping_address, c.shipping_address
      ORDER BY o.order_date DESC
    `);
    
    console.log(`[API] Database returned ${result.rows.length} orders`);
    
    // Debug: Check for orders without client relationships
    const debugResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(c.client_id) as orders_with_clients,
        COUNT(*) - COUNT(c.client_id) as orders_without_clients
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.client_id
    `);
    
    if (debugResult.rows[0]) {
      const stats = debugResult.rows[0];
      console.log(`[DEBUG] Order-Client relationship stats:`, {
        total_orders: stats.total_orders,
        orders_with_clients: stats.orders_with_clients,
        orders_without_clients: stats.orders_without_clients
      });
    }
    
    // Debug: Log sample orders to understand the data structure
    if (result.rows.length > 0) {
      console.log('[DEBUG] Sample order data:');
      result.rows.slice(0, 3).forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          order_id: order.order_id,
          client_id: order.client_id,
          full_name: order.full_name,
          source: order.source,
          total_amount: order.total_amount,
          items_count: order.items ? order.items.length : 0,
          has_items: !!order.items && order.items.length > 0
        });
        
        // Log first item details if available
        if (order.items && order.items.length > 0 && order.items[0]) {
          console.log(`  First item:`, order.items[0]);
        }
      });
      
      // Count orders with zero totals
      const zeroTotalOrders = result.rows.filter(order => 
        order.total_amount === null || order.total_amount === 0
      );
      console.log(`[DEBUG] Orders with zero total_amount: ${zeroTotalOrders.length} out of ${result.rows.length}`);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('[API] Database error:', error.message);
    // Fallback to mock data if database fails
    console.log('[API] Falling back to mock data');
    res.json(mockOrders);
  }
});

/**
 * POST /api/orders
 * Creates a new order with optional customer information
 */
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, phone_number, address, items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required for order creation' });
    }

    let clientId = null;
    let totalAmount = 0;

    // If customer information is provided, create/find the client
    if (customer_name || phone_number) {
      // Check if client exists by phone number
      if (phone_number) {
        const existingClient = await pool.query(
          'SELECT client_id FROM clients WHERE phone_number = $1',
          [phone_number]
        );

        if (existingClient.rows.length > 0) {
          clientId = existingClient.rows[0].client_id;
        }
      }

      // If client doesn't exist, create a new one
      if (!clientId) {
        const clientResult = await pool.query(
          `INSERT INTO clients (full_name, phone_number, shipping_address, source)
           VALUES ($1, $2, $3, $4)
           RETURNING client_id`,
          [customer_name || 'Walk-in Customer', phone_number || '', address || '', 'manual']
        );
        clientId = clientResult.rows[0].client_id;
      }
    }

    // Calculate total amount
    for (const item of items) {
      // Use provided unit_price_at_order if available, otherwise look it up
      let price = item.unit_price_at_order;
      
      if (!price) {
        const itemResult = await pool.query('SELECT price FROM items WHERE item_id = $1', [item.item_id]);
        if (itemResult.rows.length > 0) {
          price = parseFloat(itemResult.rows[0].price);
        } else {
          console.warn(`[API] Item ${item.item_id} not found in menu, using 0`);
          price = 0;
        }
      }
      
      totalAmount += parseFloat(price) * item.quantity;
    }

    // Create the order
    const orderResult = await pool.query(
      `INSERT INTO orders (client_id, status, total_amount, shipping_address, payment_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING order_id`,
      [clientId, 'pending_confirmation', totalAmount, address || '', 'cash']
    );

    const orderId = orderResult.rows[0].order_id;

    // Add order items
    for (const item of items) {
      // Use provided unit_price_at_order if available, otherwise look it up
      let price = item.unit_price_at_order;
      
      if (!price) {
        const itemResult = await pool.query('SELECT price FROM items WHERE item_id = $1', [item.item_id]);
        if (itemResult.rows.length > 0) {
          price = parseFloat(itemResult.rows[0].price);
        } else {
          price = 0;
        }
      }
      
      await pool.query(
        'INSERT INTO order_items (order_id, item_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [orderId, item.item_id, item.quantity, parseFloat(price)]
      );
    }

    console.log(`[API] Created new order ${orderId} with total amount ${totalAmount}`);
    res.json({ success: true, order_id: orderId, total_amount: totalAmount });
  } catch (error) {
    console.error('[API] Database error:', error.message);
    // Fallback to mock data for creation
    const newOrderId = Math.max(...mockOrders.map(o => o.order_id)) + 1;
    const newOrder = {
      order_id: newOrderId,
      client_id: customer_name ? `C${newOrderId}` : null,
      full_name: customer_name || 'Walk-in Customer',
      phone_number: phone_number || '',
      order_date: new Date().toISOString(),
      status: 'pending_confirmation',
      payment_type: 'cash',
      source: 'manual',
      total_amount: items.reduce((sum, item) => sum + (item.quantity * 150), 0), // Mock price
      shipping_address: address || '',
      items: items.map(item => ({
        item_id: item.item_id,
        item_name_ar: 'عسل السدر', // Mock name
        quantity: item.quantity,
        unit_price_at_order: 150 // Mock price
      }))
    };
    mockOrders.unshift(newOrder);
    console.log(`[API] Created new mock order ${newOrderId}`);
    res.json({ success: true, order_id: newOrderId, total_amount: newOrder.total_amount });
  }
});

/**
 * POST /api/orders/update-status
 * Updates order status in database
 */
app.post('/api/orders/update-status', async (req, res) => {
  try {
    const { order_id, new_status } = req.body;

    if (!order_id || !new_status) {
      return res.status(400).json({ error: 'Missing order_id or new_status' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
      [new_status, order_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`[API] Updated order ${order_id} status to ${new_status}`);
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('[API] Database error:', error.message);
    // Fallback to mock data update
    const order = mockOrders.find(o => o.order_id === parseInt(order_id));
    if (order) {
      order.status = new_status;
      console.log(`[API] Updated mock order ${order_id} status to ${new_status}`);
      res.json({ success: true, order });
    } else {
      res.status(500).json({ error: 'Failed to update order' });
    }
  }
});

/**
 * GET /api/menu
 * Fetches menu items from database
 */
app.get('/api/menu', async (req, res) => {
  try {
    console.log('[API] Fetching menu from database...');
    
    const result = await pool.query(`
      SELECT 
        item_id,
        name as item_name_ar,
        name as item_name_en,
        description,
        price,
        old_price,
        stock_quantity,
        is_available,
        image_url
      FROM items
      ORDER BY name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('[API] Database error:', error.message);
    console.log('[API] Falling back to mock menu data');
    res.json(mockMenu);
  }
});

/**
 * POST /api/menu/toggle
 * Toggles menu item availability in database
 */
app.post('/api/menu/toggle', async (req, res) => {
  try {
    const { item_id, is_available } = req.body;

    if (!item_id) {
      return res.status(400).json({ error: 'Missing item_id' });
    }

    let result;
    if (is_available !== undefined) {
      // Set specific availability status
      result = await pool.query(
        'UPDATE items SET is_available = $1 WHERE item_id = $2 RETURNING *',
        [is_available, item_id]
      );
    } else {
      // Toggle availability
      result = await pool.query(
        'UPDATE items SET is_available = NOT is_available WHERE item_id = $1 RETURNING *',
        [item_id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.log(`[API] Updated item ${item_id} availability to ${result.rows[0].is_available}`);
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('[API] Database error:', error.message);
    // Fallback to mock data
    const item = mockMenu.find(m => m.item_id === item_id);
    if (item) {
      item.is_available = is_available !== undefined ? is_available : !item.is_available;
      console.log(`[API] Updated mock item ${item_id} availability to ${item.is_available}`);
      res.json({ success: true, item });
    } else {
      res.status(500).json({ error: 'Failed to toggle menu item' });
    }
  }
});

/**
 * POST /api/menu/update
 * Updates menu item details in database
 */
app.post('/api/menu/update', async (req, res) => {
  try {
    const { item_id, name, description, price, old_price, stock_quantity, image_url } = req.body;

    if (!item_id) {
      return res.status(400).json({ error: 'Missing item_id' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (old_price !== undefined) {
      updates.push(`old_price = $${paramIndex++}`);
      values.push(old_price);
    }
    if (stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramIndex++}`);
      values.push(stock_quantity);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(item_id);
    const result = await pool.query(
      `UPDATE items SET ${updates.join(', ')} WHERE item_id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    console.log(`[API] Updated menu item ${item_id}`);
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('[API] Database error:', error.message);
    // Fallback to mock data
    const item = mockMenu.find(m => m.item_id === item_id);
    if (item) {
      Object.assign(item, req.body);
      console.log(`[API] Updated mock menu item ${item_id}`);
      res.json({ success: true, item });
    } else {
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
});

/**
 * POST /api/menu/add
 * Adds a new menu item to database
 */
app.post('/api/menu/add', async (req, res) => {
  try {
    const { name, description, price, category, old_price, stock_quantity, is_available, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Missing required fields: name, price' });
    }

    const result = await pool.query(
      `INSERT INTO items (name, description, price, old_price, stock_quantity, is_available, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description || '', parseFloat(price), old_price || null, stock_quantity || 0, is_available !== false, image_url || '']
    );

    console.log(`[API] Added new menu item:`, result.rows[0]);
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('[API] Database error:', error.message);
    
    if (!dbConnected) {
      // Fallback to mock data when DB is not connected
      const newItem = {
        item_id: 'I' + (Math.max(...mockMenu.map(m => parseInt(m.item_id.substring(1)))) + 1).toString().padStart(3, '0'),
        item_name_ar: name,
        item_name_en: name,
        description: description || '',
        price: parseFloat(price),
        is_available: is_available !== false,
        image_url: image_url || ''
      };
      mockMenu.push(newItem);
      console.log(`[API] Added new mock menu item:`, newItem);
      res.json({ success: true, item: newItem });
    } else {
      res.status(500).json({ error: 'Failed to add menu item: ' + error.message });
    }
  }
});

/**
 * Delete an order by ID
 */
app.delete('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  if (dbConnected) {
    try {
      // Start a transaction to delete order items first, then the order
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // First delete order items
        await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
        
        // Then delete the order itself
        const result = await client.query('DELETE FROM orders WHERE order_id = $1 RETURNING *', [orderId]);
        
        await client.query('COMMIT');
        
        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        console.log(`[API] Deleted order ${orderId}`);
        res.json({ success: true, message: 'Order deleted successfully' });
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('[API] Error deleting order:', error);
      res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
  } else {
    // Mock mode - find and remove the order
    const orderIndex = mockOrders.findIndex(o => o.order_id.toString() === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    mockOrders.splice(orderIndex, 1);
    console.log(`[API] Deleted mock order ${orderId}`);
    res.json({ success: true, message: 'Order deleted successfully' });
  }
});

/**
 * GET /api/debug/tables
 * Debug endpoint to check table structures and sample data
 */
app.get('/api/debug/tables', async (req, res) => {
  try {
    console.log('[DEBUG] Checking table structures...');
    
    // Check orders table structure
    const ordersStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `);
    
    // Check clients table structure
    const clientsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY ordinal_position
    `);
    
    // Check order_items table structure
    const orderItemsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position
    `);
    
    // Get sample orders data (first 5 orders)
    const sampleOrders = await pool.query(`
      SELECT * FROM orders 
      ORDER BY order_date DESC 
      LIMIT 5
    `);
    
    // Get sample order_items data
    const sampleOrderItems = await pool.query(`
      SELECT * FROM order_items 
      WHERE order_id IN (SELECT order_id FROM orders ORDER BY order_date DESC LIMIT 3)
    `);
    
    res.json({
      success: true,
      tables: {
        orders: {
          structure: ordersStructure.rows,
          sample_data: sampleOrders.rows
        },
        clients: {
          structure: clientsStructure.rows
        },
        order_items: {
          structure: orderItemsStructure.rows,
          sample_data: sampleOrderItems.rows
        }
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error checking tables:', error);
    res.status(500).json({ error: 'Failed to check table structure: ' + error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint with debug info
 */
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'running',
    database: 'disconnected',
    mode: 'mock-data'
  };

  if (dbConnected) {
    try {
      await pool.query('SELECT NOW()');
      dbStatus = 'connected';
      healthInfo.database = 'connected';
      healthInfo.mode = 'database';
      
      // Add debug info about tables if requested
      if (req.query.debug === 'true') {
        try {
          // Check orders table structure
          const ordersStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            ORDER BY ordinal_position
          `);
          
          // Get sample orders data (first 3 orders)
          const sampleOrders = await pool.query(`
            SELECT * FROM orders 
            ORDER BY order_date DESC 
            LIMIT 3
          `);
          
          healthInfo.debug = {
            orders_table_structure: ordersStructure.rows,
            sample_orders: sampleOrders.rows
          };
        } catch (debugError) {
          healthInfo.debug = { error: debugError.message };
        }
      }
    } catch (err) {
      dbStatus = 'error: ' + err.message;
      healthInfo.database = 'error';
    }
  } else {
    healthInfo.database = 'disconnected';
  }
  
  res.json(healthInfo);
});

/**
 * POST /api/fix-totals
 * Recalculate and fix total amounts for existing orders
 */
app.post('/api/fix-totals', async (req, res) => {
  try {
    console.log('[API] Starting total amount fix for existing orders...');
    
    // Get all orders that need fixing
    const ordersResult = await pool.query(`
      SELECT o.order_id, 
             COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as calculated_total,
             o.total_amount as current_total
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      GROUP BY o.order_id, o.total_amount
      HAVING o.total_amount != COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0)
         OR o.total_amount = 0
    `);

    const ordersToFix = ordersResult.rows;
    console.log(`[API] Found ${ordersToFix.length} orders to fix`);

    let fixedCount = 0;
    for (const order of ordersToFix) {
      await pool.query(
        'UPDATE orders SET total_amount = $1 WHERE order_id = $2',
        [order.calculated_total, order.order_id]
      );
      console.log(`[API] Fixed order ${order.order_id}: ${order.current_total} → ${order.calculated_total}`);
      fixedCount++;
    }

    res.json({ 
      success: true, 
      message: `Fixed ${fixedCount} orders`, 
      fixed_orders: ordersToFix.map(o => ({
        order_id: o.order_id,
        old_total: o.current_total,
        new_total: o.calculated_total
      }))
    });
  } catch (error) {
    console.error('[API] Error fixing totals:', error);
    res.status(500).json({ error: 'Failed to fix totals: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard at http://localhost:3000`);
  console.log(`\nDatabase: ${process.env.DATABASE_URL ? 'PostgreSQL (configured)' : 'Mock data mode'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET    /api/health`);
  console.log(`  GET    /api/debug/tables`);
  console.log(`  GET    /api/orders`);
  console.log(`  POST   /api/orders`);
  console.log(`  DELETE /api/orders/:orderId`);
  console.log(`  POST   /api/orders/update-status`);
  console.log(`  POST   /api/fix-totals`);
  console.log(`  GET    /api/menu`);
  console.log(`  POST   /api/menu/toggle`);
  console.log(`  POST   /api/menu/update`);
  console.log(`  POST   /api/menu/add\n`);
});
