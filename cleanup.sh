#!/bin/bash

echo "🧹 Cleaning up unnecessary files..."

# Remove unnecessary components
rm -rf src/components/payment
rm -rf src/components/subscription
rm -rf src/components/dashboard
rm -rf src/components/pricing
rm -rf src/components/admin
rm -rf src/components/billing

# Remove unnecessary lib files
rm -rf src/lib/payment
rm -rf src/lib/stripe
rm -rf src/lib/subscription
rm -rf src/lib/billing

# Remove config files not needed
rm -rf src/config

# Remove unnecessary app routes
rm -rf src/app/api-keys
rm -rf src/app/api-test
rm -rf src/app/test-dashboard
rm -rf src/app/translate
rm -rf src/app/dashboard
rm -rf src/app/subscription
rm -rf src/app/payment
rm -rf src/app/test-api
rm -rf src/app/pricing
rm -rf src/app/admin
rm -rf src/app/settings
rm -rf src/app/profile
rm -rf src/app/docs
rm -rf src/app/about

# Remove seed files
rm -rf prisma/seed
rm -f prisma/seed*.ts

# Remove backup files
find . -name "*.bak" -delete
find . -name "*.backup" -delete
find . -name "*.backup.*" -delete

# Remove test files
find . -name "*.test.ts" -delete
find . -name "*.test.tsx" -delete

# Clear Next.js cache
rm -rf .next

echo "✅ Cleanup complete!"
