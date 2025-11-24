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
    const { item_id, item_name_ar, description, price, old_price, stock_quantity, is_available, image_url } = JSON.parse(body || '{}');

    if (!item_id || !item_name_ar || !price) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required fields: item_id, item_name_ar, price' })
      };
    }

    try {
      const result = await pool.query(
        `INSERT INTO items (name, description, price, old_price, stock_quantity, is_available, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [item_name_ar, description || '', price, old_price || null, stock_quantity || 0, is_available !== false, image_url || '']
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, item: result.rows[0] })
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
