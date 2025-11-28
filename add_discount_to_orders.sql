-- Add discount_percentage column to orders table
ALTER TABLE orders 
ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Add a column to store the amount before discount (original total)
ALTER TABLE orders 
ADD COLUMN subtotal DECIMAL(10, 2);

-- Update existing orders: set subtotal to current total_amount (pre-discount)
-- and keep total_amount as is (this assumes no discounts were applied before)
UPDATE orders 
SET subtotal = total_amount 
WHERE subtotal IS NULL;

-- Optional: Update total_amount based on discount_percentage for existing orders
-- (This will only apply if discount_percentage is set)
UPDATE orders 
SET total_amount = subtotal * (1 - discount_percentage / 100)
WHERE discount_percentage > 0 AND subtotal IS NOT NULL;
