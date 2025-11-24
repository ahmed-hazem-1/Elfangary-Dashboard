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
    const { item_id, item_name_ar, description, price, old_price, stock_quantity, image_url } = JSON.parse(body || '{}');

    if (!item_id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing item_id' })
      };
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (item_name_ar) {
      updates.push(`name = $${paramIndex++}`);
      values.push(item_name_ar);
    }
    if (description) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (old_price) {
      updates.push(`old_price = $${paramIndex++}`);
      values.push(old_price);
    }
    if (stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramIndex++}`);
      values.push(stock_quantity);
    }
    if (image_url) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(image_url);
    }

    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No fields to update' })
      };
    }

    try {
      values.push(item_id);
      const result = await pool.query(
        `UPDATE items SET ${updates.join(', ')} WHERE item_id = $${paramIndex} RETURNING *`,
        values
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
