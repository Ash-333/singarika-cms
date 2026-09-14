-- Singarika sells from Nepal: origin defaults to Nepal and sales tax is
-- Nepal VAT (13%) rather than Indian GST (5%).

ALTER TABLE "products" ALTER COLUMN "countryOfOrigin" SET DEFAULT 'Nepal';
ALTER TABLE "products" ALTER COLUMN "taxRatePct" SET DEFAULT 13;

UPDATE "products" SET "countryOfOrigin" = 'Nepal' WHERE "countryOfOrigin" = 'India';
UPDATE "products" SET "taxRatePct" = 13 WHERE "taxRatePct" = 5;
