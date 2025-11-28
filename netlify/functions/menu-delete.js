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
    const { item_id } = JSON.parse(body || '{}');

    if (!item_id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing item_id' })
      };
    }

    try {
      // First check if item exists in any orders
      const orderCheck = await pool.query(
        'SELECT COUNT(*) as count FROM order_items WHERE item_id = $1',
        [item_id]
      );

      if (parseInt(orderCheck.rows[0].count) > 0) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Cannot delete product. It is referenced in existing orders. Consider marking it as unavailable instead.' 
          })
        };
      }

      const result = await pool.query(
        'DELETE FROM items WHERE item_id = $1 RETURNING *',
        [item_id]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Menu item not found' })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: 'Product deleted successfully' })
      };
    } catch (error) {
      console.error('Database error:', error.message);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to delete menu item: ' + error.message })
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
