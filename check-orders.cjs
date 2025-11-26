const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrders() {
  try {
    // Check orders table
    const ordersResult = await pool.query(`
      SELECT order_id, status, client_id, order_date, total_amount 
      FROM orders 
      ORDER BY order_date DESC
    `);
    
    console.log('=== Orders in Database ===');
    console.log('Total orders:', ordersResult.rows.length);
    console.log('');
    
    ordersResult.rows.forEach(o => {
      console.log(`Order ${o.order_id}:`);
      console.log(`  Status: ${o.status}`);
      console.log(`  Client ID: ${o.client_id}`);
      console.log(`  Date: ${o.order_date}`);
      console.log(`  Total: ${o.total_amount} EGP`);
      console.log('');
    });
    
    // Check order items
    const itemsResult = await pool.query(`
      SELECT order_id, COUNT(*) as item_count
      FROM order_items
      GROUP BY order_id
    `);
    
    console.log('=== Order Items Count ===');
    itemsResult.rows.forEach(row => {
      console.log(`Order ${row.order_id}: ${row.item_count} items`);
    });
    
    // Check clients
    const clientsResult = await pool.query('SELECT client_id, full_name FROM clients');
    console.log('');
    console.log('=== Clients ===');
    console.log('Total clients:', clientsResult.rows.length);
    clientsResult.rows.forEach(c => {
      console.log(`Client ${c.client_id}: ${c.full_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrders();
