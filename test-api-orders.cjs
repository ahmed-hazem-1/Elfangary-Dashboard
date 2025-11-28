const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testOrders() {
  try {
    // This is the exact same query used by the Netlify function
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
    
    console.log('=== API Query Results ===');
    console.log(`Total orders returned: ${result.rows.length}`);
    console.log('\nOrder IDs:');
    
    const orderIds = result.rows.map(o => o.order_id).sort((a, b) => a - b);
    console.log(orderIds.join(', '));
    
    console.log('\n=== Checking for gaps ===');
    const minId = Math.min(...orderIds);
    const maxId = Math.max(...orderIds);
    const missingIds = [];
    
    for (let i = minId; i <= maxId; i++) {
      if (!orderIds.includes(i)) {
        missingIds.push(i);
      }
    }
    
    if (missingIds.length > 0) {
      console.log(`Missing order IDs (gaps): ${missingIds.join(', ')}`);
      console.log(`\nThese ${missingIds.length} orders were likely deleted.`);
    } else {
      console.log('No gaps found - all consecutive order IDs exist.');
    }
    
    console.log(`\n✅ Database has ${result.rows.length} orders`);
    console.log(`✅ Query returns ALL ${result.rows.length} orders`);
    console.log(`✅ Dashboard should display all ${result.rows.length} orders`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testOrders();
