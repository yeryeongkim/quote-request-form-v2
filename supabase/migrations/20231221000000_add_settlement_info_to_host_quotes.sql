-- Add settlement_info column to host_quotes table for storing host bank account information
-- This is used when payment_method is 'online' to store country-specific settlement details

ALTER TABLE host_quotes
ADD COLUMN IF NOT EXISTS settlement_info jsonb;

-- Add comment to describe the column
COMMENT ON COLUMN host_quotes.settlement_info IS 'Host bank account information for settlements. Structure varies by country:
Korea: {bankName, accountNumber, accountHolder}
UK: {bankName, sortCode, accountNumber, accountHolder}
USA: {bankName, routingNumber, accountNumber, accountHolder}
Japan: {bankName, branchName, accountNumber, accountHolder}
Canada: {bankName, transitNumber, institutionNumber, accountNumber, accountHolder}';
