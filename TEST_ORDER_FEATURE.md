# Test Order Feature

## Overview
The test order feature allows you to create orders that are labeled as "TEST" and are excluded from all revenue and profit calculations. This is useful for:
- Testing the order flow without affecting your analytics
- Demo purposes
- Training staff
- Quality assurance testing

## How to Use

### Creating a Test Order
1. Click "New Order" button
2. Add items to the order
3. Check the **"Test Order"** checkbox (yellow highlighted section)
4. Complete and submit the order

### Visual Indicators
Test orders are clearly marked with a yellow "TEST" badge:
- **Order List**: Small "TEST" label next to order ID
- **Order Modal**: "TEST ORDER" badge in the header

### What's Excluded from Analytics
Test orders are **NOT** counted in:
- Total revenue calculations
- Profit calculations  
- Order count statistics
- Product analytics
- Dashboard metrics

Test orders **ARE** still:
- Visible in the orders list
- Trackable through their lifecycle (pending → confirmed → delivered)
- Stored in the database
- Manageable like regular orders

## Database Update Required

If you have an existing database, run this SQL command to add the test order column:

\`\`\`sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_test_order BOOLEAN DEFAULT FALSE;
\`\`\`

Or use the provided migration file:
\`\`\`bash
psql -d your_database_name -f add_test_order_column.sql
\`\`\`

## Technical Details

### Files Modified
- `types.ts` - Added `is_test_order` field to Order interface
- `schema.sql` - Added `is_test_order` column to orders table
- `NewOrderForm.tsx` - Added test order checkbox
- `OrderRow.tsx` - Added TEST badge display
- `OrderModal.tsx` - Added TEST badge in order details
- `DashboardView.tsx` - Excluded test orders from analytics
- `server.cjs` - Added test order handling in API

### API Changes
The POST `/api/orders` endpoint now accepts an `is_test_order` boolean field:
\`\`\`javascript
{
  customer_name: "Test Customer",
  items: [...],
  is_test_order: true  // New field
}
\`\`\`

The GET `/api/orders` endpoint now returns the `is_test_order` field for each order.
