const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixBrokenOrders() {
  try {
    console.log('Finding orders with no items...');
    
    // Find orders that have no order_items
    const brokenOrders = await pool.query(`
      SELECT o.order_id, o.status, o.total_amount, o.order_date
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE oi.id IS NULL
      ORDER BY o.order_date DESC
    `);
    
    console.log(`Found ${brokenOrders.rows.length} orders without items:`);
    brokenOrders.rows.forEach(o => {
      console.log(`  - Order ${o.order_id} (${o.status}, ${o.total_amount} EGP, ${o.order_date})`);
    });
    
    if (brokenOrders.rows.length === 0) {
      console.log('No broken orders found. All good!');
      return;
    }
    
    console.log('\nDeleting broken orders...');
    
    for (const order of brokenOrders.rows) {
      await pool.query('DELETE FROM orders WHERE order_id = $1', [order.order_id]);
      console.log(`  ✓ Deleted order ${order.order_id}`);
    }
    
    console.log(`\n✅ Successfully deleted ${brokenOrders.rows.length} broken orders!`);
    console.log('Your dashboard should now display correctly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixBrokenOrders();
