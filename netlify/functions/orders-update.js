const { Pool } = require('pg');

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
};

const pool = new Pool(dbConfig);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const mockOrders = [];

exports.handler = async (event, context) => {
  const { httpMethod, body } = event;
  console.log('[orders-update] Received request:', { httpMethod, body });

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  if (httpMethod !== 'POST') {
    console.log('[orders-update] Method not allowed:', httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { order_id, new_status } = JSON.parse(body || '{}');
    console.log('[orders-update] Parsed payload:', { order_id, new_status });

    if (!order_id || !new_status) {
      console.log('[orders-update] Missing required fields');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing order_id or new_status' })
      };
    }

    try {
      console.log('[orders-update] Executing query for order:', order_id);
      const result = await pool.query(
        'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
        [new_status, order_id]
      );
      console.log('[orders-update] Query result rows:', result.rows.length);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Order not found' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, order: result.rows[0] })
      };
    } catch (error) {
      console.error('[orders-update] Database error:', error.message);
      console.error('[orders-update] Full error:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Database error: ' + error.message })
      };
    }
  } catch (error) {
    console.error('[orders-update] Parse/general error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
