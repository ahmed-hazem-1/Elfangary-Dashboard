const { Pool } = require('pg');

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
};

const pool = new Pool(dbConfig);

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
    // GET /api/menu
    if (httpMethod === 'GET' && path === '/.netlify/functions/menu') {
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
          headers,
          body: JSON.stringify(result.rows)
        };
      } catch (error) {
        console.error('Database error:', error.message);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(mockMenu)
        };
      }
    }

    // POST /api/menu/toggle
    if (httpMethod === 'POST' && path === '/.netlify/functions/menu-toggle') {
      try {
        const { item_id } = JSON.parse(event.body);

        if (!item_id) {
          return {
            statusCode: 400,
            headers,
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
            headers,
            body: JSON.stringify({ error: 'Menu item not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, item: result.rows[0] })
        };
      } catch (error) {
        console.error('Database error:', error.message);
        const item = mockMenu.find(m => m.item_id === JSON.parse(event.body).item_id);
        if (item) {
          item.is_available = !item.is_available;
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, item })
          };
        }
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to toggle menu item' })
        };
      }
    }

    // POST /api/menu/update
    if (httpMethod === 'POST' && path === '/.netlify/functions/menu-update') {
      try {
        const { item_id, item_name_ar, description, price, old_price, stock_quantity, image_url } = JSON.parse(event.body);

        if (!item_id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing item_id' })
          };
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (item_name_ar !== undefined) {
          updates.push(`name = $${paramIndex++}`);
          values.push(item_name_ar);
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
          return {
            statusCode: 400,
            headers,
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
            headers,
            body: JSON.stringify({ error: 'Menu item not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, item: result.rows[0] })
        };
      } catch (error) {
        console.error('Database error:', error.message);
        const item = mockMenu.find(m => m.item_id === JSON.parse(event.body).item_id);
        if (item) {
          Object.assign(item, JSON.parse(event.body));
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, item })
          };
        }
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update menu item' })
        };
      }
    }

    // POST /api/menu/add
    if (httpMethod === 'POST' && path === '/.netlify/functions/menu-add') {
      try {
        const { item_id, item_name_ar, description, price, old_price, stock_quantity, is_available, image_url } = JSON.parse(event.body);

        if (!item_id || !item_name_ar || !price) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required fields: item_id, item_name_ar, price' })
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
          headers,
          body: JSON.stringify({ success: true, item: result.rows[0] })
        };
      } catch (error) {
        console.error('Database error:', error.message);
        const newItem = JSON.parse(event.body);
        mockMenu.push(newItem);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, item: newItem })
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
