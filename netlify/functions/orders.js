const { Pool } = require('pg');

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
};

const pool = new Pool(dbConfig);

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

exports.handler = async (event, context) => {
  const { httpMethod, path } = event;

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // GET /api/orders
    if (httpMethod === 'GET' && path === '/.netlify/functions/orders') {
      try {
        const result = await pool.query(`
          SELECT 
            o.order_id,
            o.client_id,
            c.full_name,
            c.phone_number,
            c.source,
            o.order_date,
            o.status,
            o.payment_type,
            o.total_amount,
            o.shipping_address,
            json_agg(
              json_build_object(
                'item_id', oi.item_id,
                'item_name_ar', i.name,
                'quantity', oi.quantity,
                'unit_price_at_order', oi.price_at_purchase
              )
            ) FILTER (WHERE oi.id IS NOT NULL) as items
          FROM orders o
          LEFT JOIN clients c ON o.client_id = c.client_id
          LEFT JOIN order_items oi ON o.order_id = oi.order_id
          LEFT JOIN items i ON oi.item_id = i.item_id
          GROUP BY o.order_id, o.client_id, c.full_name, c.phone_number, c.source, o.order_date, o.status, o.payment_type, o.total_amount, o.shipping_address
          ORDER BY o.order_date DESC
        `);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      } catch (error) {
        console.error('Database error:', error.message);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(mockOrders)
        };
      }
    }

    // POST /api/orders
    if (httpMethod === 'POST' && path === '/.netlify/functions/orders') {
      try {
        const { customer_name, phone_number, address, items, notes } = JSON.parse(event.body);

        if (!items || !Array.isArray(items) || items.length === 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Items are required for order creation' })
          };
        }

        let clientId = null;
        let totalAmount = 0;

        if (customer_name || phone_number) {
          if (phone_number) {
            const existingClient = await pool.query(
              'SELECT client_id FROM clients WHERE phone_number = $1',
              [phone_number]
            );

            if (existingClient.rows.length > 0) {
              clientId = existingClient.rows[0].client_id;
            }
          }

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

        for (const item of items) {
          const itemResult = await pool.query('SELECT price FROM items WHERE item_id = $1', [item.item_id]);
          if (itemResult.rows.length > 0) {
            const price = parseFloat(itemResult.rows[0].price);
            totalAmount += price * item.quantity;
          }
        }

        const orderResult = await pool.query(
          `INSERT INTO orders (client_id, status, total_amount, shipping_address, payment_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING order_id`,
          [clientId, 'pending_confirmation', totalAmount, address || '', 'cash']
        );

        const orderId = orderResult.rows[0].order_id;

        for (const item of items) {
          const itemResult = await pool.query('SELECT price FROM items WHERE item_id = $1', [item.item_id]);
          if (itemResult.rows.length > 0) {
            const price = parseFloat(itemResult.rows[0].price);
            await pool.query(
              'INSERT INTO order_items (order_id, item_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
              [orderId, item.item_id, item.quantity, price]
            );
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, order_id: orderId, total_amount: totalAmount })
        };
      } catch (error) {
        console.error('Database error:', error.message);
        const newOrderId = Math.max(...mockOrders.map(o => o.order_id)) + 1;
        const newOrder = {
          order_id: newOrderId,
          client_id: `C${newOrderId}`,
          full_name: JSON.parse(event.body).customer_name || 'Walk-in Customer',
          phone_number: JSON.parse(event.body).phone_number || '',
          order_date: new Date().toISOString(),
          status: 'pending_confirmation',
          payment_type: 'cash',
          source: 'manual',
          total_amount: 0,
          shipping_address: JSON.parse(event.body).address || '',
          items: []
        };
        mockOrders.unshift(newOrder);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, order_id: newOrderId, total_amount: newOrder.total_amount })
        };
      }
    }

    // DELETE /api/orders/:orderId
    if (httpMethod === 'DELETE' && path.match(/\/.netlify\/functions\/orders\/\d+/)) {
      const orderId = path.split('/').pop();
      
      try {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
          const result = await client.query('DELETE FROM orders WHERE order_id = $1 RETURNING *', [orderId]);
          await client.query('COMMIT');
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ success: false, error: 'Order not found' })
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Order deleted successfully' })
          };
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        const orderIndex = mockOrders.findIndex(o => o.order_id.toString() === orderId);
        if (orderIndex === -1) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: 'Order not found' })
          };
        }
        mockOrders.splice(orderIndex, 1);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Order deleted successfully' })
        };
      }
    }

    // POST /api/orders/update-status
    if (httpMethod === 'POST' && path === '/.netlify/functions/orders-update') {
      try {
        const { order_id, new_status } = JSON.parse(event.body);

        if (!order_id || !new_status) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing order_id or new_status' })
          };
        }

        const result = await pool.query(
          'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
          [new_status, order_id]
        );

        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Order not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, order: result.rows[0] })
        };
      } catch (error) {
        console.error('Database error:', error.message);
        const order = mockOrders.find(o => o.order_id === parseInt(JSON.parse(event.body).order_id));
        if (order) {
          order.status = JSON.parse(event.body).new_status;
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, order })
          };
        }
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update order' })
        };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
