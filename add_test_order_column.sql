-- Migration: Add is_test_order column to orders table
-- This allows marking orders as test orders that won't be counted in revenue/profit

-- Add the is_test_order column with a default value of FALSE
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_test_order BOOLEAN DEFAULT FALSE;

-- Optionally, you can add a comment to document the column
COMMENT ON COLUMN orders.is_test_order IS 'Flag to mark test orders that should not be included in revenue/profit calculations';
