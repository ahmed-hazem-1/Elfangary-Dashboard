const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addDiscountFields() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration to add discount fields...\n');

    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('discount_percentage', 'subtotal')
    `);

    if (checkColumns.rows.length > 0) {
      console.log('⚠️  Discount columns already exist. Skipping creation.');
      const existingColumns = checkColumns.rows.map(r => r.column_name).join(', ');
      console.log(`   Existing columns: ${existingColumns}\n`);
    } else {
      console.log('Adding discount_percentage column...');
      await client.query(`
        ALTER TABLE orders 
        ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0 
        CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
      `);
      console.log('✅ discount_percentage column added\n');

      console.log('Adding subtotal column...');
      await client.query(`
        ALTER TABLE orders 
        ADD COLUMN subtotal DECIMAL(10, 2)
      `);
      console.log('✅ subtotal column added\n');
    }

    // Update existing orders
    console.log('Updating existing orders...');
    const updateResult = await client.query(`
      UPDATE orders 
      SET subtotal = total_amount 
      WHERE subtotal IS NULL
    `);
    console.log(`✅ Updated ${updateResult.rowCount} existing orders with subtotal\n`);

    // Verify changes
    console.log('Verifying changes...');
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN subtotal IS NOT NULL THEN 1 END) as orders_with_subtotal,
        COUNT(CASE WHEN discount_percentage > 0 THEN 1 END) as orders_with_discount
      FROM orders
    `);

    const stats = verifyResult.rows[0];
    console.log('📊 Database Statistics:');
    console.log(`   Total Orders: ${stats.total_orders}`);
    console.log(`   Orders with Subtotal: ${stats.orders_with_subtotal}`);
    console.log(`   Orders with Discount: ${stats.orders_with_discount}`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 What changed:');
    console.log('   - Added discount_percentage column (0-100%)');
    console.log('   - Added subtotal column (pre-discount amount)');
    console.log('   - Updated existing orders with current total as subtotal');
    console.log('\n💡 Next steps:');
    console.log('   - New orders can now include discounts');
    console.log('   - Dashboard will display subtotal and discount breakdown');
    console.log('   - All existing orders are preserved with their original totals\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addDiscountFields().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
