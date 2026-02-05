-- Run this SQL in your Supabase SQL Editor to fix the Business Module and Categories

-- Create Business Transactions Table if not exists
CREATE TABLE IF NOT EXISTS business_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'ingreso' or 'egreso'
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    client_name TEXT, -- Updated to snake_case
    invoice_number TEXT, -- Updated to snake_case
    status TEXT DEFAULT 'pendiente',
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for business_transactions
ALTER TABLE business_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for business_transactions
DROP POLICY IF EXISTS "Users can manage their own business transactions" ON business_transactions;
CREATE POLICY "Users can manage their own business transactions" 
ON business_transactions 
FOR ALL 
USING (auth.uid() = user_id);
