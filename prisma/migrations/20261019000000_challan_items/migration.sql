-- Add optional breakdown of individual fee line items to Challan.
ALTER TABLE "Challan" ADD COLUMN "items" JSONB;
