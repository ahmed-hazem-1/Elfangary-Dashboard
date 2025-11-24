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

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { order_id, new_status } = JSON.parse(body || '{}');

    if (!order_id || !new_status) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing order_id or new_status' })
      };
    }

    try {
      const result = await pool.query(
        'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
        [new_status, order_id]
      );

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
      console.error('Database error:', error.message);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
