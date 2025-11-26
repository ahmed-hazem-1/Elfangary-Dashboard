const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testAPIQuery() {
  try {
    console.log('Testing the exact query used by the API...\n');
    
    const result = await pool.query(`
      SELECT 
        o.order_id,
        o.client_id,
        COALESCE(c.full_name, 'Unknown Customer') as full_name,
        COALESCE(c.phone_number, '') as phone_number,
        COALESCE(c.source, 'external') as source,
        o.order_date,
        o.status,
        o.payment_type,
        o.total_amount,
        COALESCE(o.shipping_address, c.shipping_address, '') as shipping_address,
        json_agg(
          json_build_object(
            'item_id', COALESCE(oi.item_id::text, 'unknown'),
            'item_name_ar', COALESCE(i.name, 'Unknown Item'),
            'quantity', COALESCE(oi.quantity, 1),
            'unit_price_at_order', COALESCE(oi.price_at_purchase, 0)
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.client_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN items i ON oi.item_id = i.item_id
      GROUP BY o.order_id, o.client_id, c.full_name, c.phone_number, c.source, o.order_date, o.status, o.payment_type, o.total_amount, o.shipping_address, c.shipping_address
      ORDER BY o.order_date DESC
    `);
    
    console.log(`Found ${result.rows.length} orders\n`);
    
    result.rows.forEach((order, index) => {
      console.log(`\n===== ORDER ${index + 1} =====`);
      console.log('Order ID:', order.order_id);
      console.log('Customer:', order.full_name);
      console.log('Phone:', order.phone_number);
      console.log('Status:', order.status);
      console.log('Source:', order.source);
      console.log('Total:', order.total_amount, 'EGP');
      console.log('Date:', order.order_date);
      console.log('Address:', order.shipping_address);
      console.log('Items:', JSON.stringify(order.items, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAPIQuery();
