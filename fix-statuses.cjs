const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixOrderStatuses() {
  try {
    console.log('Fixing order statuses...\n');
    
    // Check current statuses
    const current = await pool.query(`
      SELECT order_id, status 
      FROM orders 
      ORDER BY order_id
    `);
    
    console.log('Current statuses:');
    current.rows.forEach(o => {
      console.log(`  Order ${o.order_id}: ${o.status}`);
    });
    
    // Update 'pending' to 'pending_confirmation'
    const result = await pool.query(`
      UPDATE orders 
      SET status = 'pending_confirmation' 
      WHERE status = 'pending'
      RETURNING order_id, status
    `);
    
    console.log(`\n✅ Updated ${result.rows.length} orders:`);
    result.rows.forEach(o => {
      console.log(`  Order ${o.order_id}: ${o.status}`);
    });
    
    // Also fix the source field if needed
    const sourceResult = await pool.query(`
      UPDATE clients
      SET source = 'Whatsapp'
      WHERE source = 'Whastapp'
      RETURNING client_id, full_name, source
    `);
    
    if (sourceResult.rows.length > 0) {
      console.log(`\n✅ Fixed source typo for ${sourceResult.rows.length} clients`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixOrderStatuses();
