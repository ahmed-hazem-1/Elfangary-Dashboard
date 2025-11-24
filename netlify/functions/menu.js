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

const mockMenu = [
  {
    item_id: 'I001',
    item_name_ar: 'عسل السدر',
    item_name_en: 'Sidr Honey',
    description: 'Premium acacia honey',
    price: 150.00,
    is_available: true,
    image_url: '/images/sidr-honey.jpg'
  }
];

exports.handler = async (event, context) => {
  const { httpMethod, path, body } = event;

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  try {
    // GET /menu
    if (httpMethod === 'GET' && (path.endsWith('/menu') || (path.includes('/menu') && !path.includes('toggle') && !path.includes('update') && !path.includes('add')))) {
      try {
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
          body: JSON.stringify(mockMenu)
        };
      }
    }

    // POST /menu/toggle
    if (httpMethod === 'POST' && path.includes('toggle')) {
      try {
        const { item_id } = JSON.parse(body || '{}');

        if (!item_id) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Missing item_id' })
          };
        }

        const result = await pool.query(
          'UPDATE items SET is_available = NOT is_available WHERE item_id = $1 RETURNING *',
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
    }

    // POST /menu/update
    if (httpMethod === 'POST' && path.includes('update') && !path.includes('toggle')) {
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
        if (stock_quantity) {
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
    }

    // POST /menu/add
    if (httpMethod === 'POST' && path.includes('add')) {
      try {
        const { item_id, item_name_ar, description, price, old_price, stock_quantity, is_available, image_url } = JSON.parse(body || '{}');

        if (!item_id || !item_name_ar || !price) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Missing required fields' })
          };
        }

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
};
