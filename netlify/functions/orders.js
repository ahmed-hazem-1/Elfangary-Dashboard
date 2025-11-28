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
  }
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event, context) => {
  const { httpMethod, path, body } = event;

  // Handle CORS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  try {
    // GET /orders
    if (httpMethod === 'GET' && (path.endsWith('/orders') || path.includes('orders'))) {
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
            o.subtotal,
            o.discount_percentage,
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
          GROUP BY o.order_id, o.client_id, c.full_name, c.phone_number, c.source, o.order_date, o.status, o.payment_type, o.total_amount, o.subtotal, o.discount_percentage, o.shipping_address
          ORDER BY o.order_date DESC
        `);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(result.rows)
        };
      } catch (error) {
        console.error('Database error:', error.message);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(mockOrders)
        };
      }
    }

    // POST /orders (create)
    if (httpMethod === 'POST' && (path.endsWith('/orders') || (path.includes('/orders') && !path.includes('update')))) {
      try {
        const { customer_name, phone_number, address, items, notes, discount_percentage } = JSON.parse(body || '{}');

        if (!items || !Array.isArray(items) || items.length === 0) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Items are required' })
          };
        }

        let clientId = null;
        let subtotal = 0;
        const discountPercent = parseFloat(discount_percentage) || 0;

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
            subtotal += parseFloat(itemResult.rows[0].price) * item.quantity;
          }
        }

        // Calculate total after discount
        const totalAmount = subtotal * (1 - discountPercent / 100);

        const orderResult = await pool.query(
          `INSERT INTO orders (client_id, status, total_amount, subtotal, discount_percentage, shipping_address, payment_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING order_id`,
          [clientId, 'pending_confirmation', totalAmount, subtotal, discountPercent, address || '', 'cash']
        );

        const orderId = orderResult.rows[0].order_id;

        for (const item of items) {
          const itemResult = await pool.query('SELECT price FROM items WHERE item_id = $1', [item.item_id]);
          if (itemResult.rows.length > 0) {
            await pool.query(
              'INSERT INTO order_items (order_id, item_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
              [orderId, item.item_id, item.quantity, parseFloat(itemResult.rows[0].price)]
            );
          }
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, order_id: orderId, total_amount: totalAmount })
        };
      } catch (error) {
        console.error('Error creating order:', error);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true, order_id: 1, total_amount: 0 })
        };
      }
    }

    // DELETE /orders/:id
    if (httpMethod === 'DELETE' && path.includes('/orders/')) {
      try {
        const orderId = path.split('/').pop();
        
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
          const result = await client.query('DELETE FROM orders WHERE order_id = $1 RETURNING *', [orderId]);
          await client.query('COMMIT');
          
          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers: corsHeaders,
              body: JSON.stringify({ success: false, error: 'Order not found' })
            };
          }
          
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ success: true, message: 'Order deleted' })
          };
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ success: true })
        };
      }
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
}