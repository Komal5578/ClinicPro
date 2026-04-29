#!/bin/bash
# Supabase Migration Setup Script
# Run this to automatically set up your Supabase database

echo "🚀 ClinicPro Supabase Migration Setup"
echo "======================================"
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
  echo "❌ Error: backend/.env file not found"
  echo "Please ensure you have created the .env file in the backend directory"
  exit 1
fi

# Load environment variables
export $(cat backend/.env | grep -v '^#' | xargs)

echo "✓ Environment variables loaded"
echo "  Supabase URL: $SUPABASE_URL"
echo ""

echo "📋 Next steps:"
echo ""
echo "1️⃣  Create Database Schema"
echo "   - Go to: https://zbnoagxioabwcrabiyjt.supabase.co/project/default/sql/new"
echo "   - Copy all SQL from: database/schema/supabase_schema.sql"
echo "   - Paste into the SQL Editor"
echo "   - Click 'Run'"
echo ""

echo "2️⃣  Migrate Your Data (Optional)"
echo "   If you have existing MySQL data:"
echo "   - Export from MySQL: mysqldump -h [host] -u [user] -p[password] clinic_db > backup.sql"
echo "   - Use Supabase Data Import feature"
echo "   - Or use the migration scripts in database/migrate/"
echo ""

echo "3️⃣  Test API Endpoints"
echo "   Start the backend:"
echo "   $ cd backend && node server.js"
echo ""
echo "   Test a simple endpoint:"
echo "   $ curl http://localhost:5000/"
echo ""

echo "4️⃣  Deploy to Production"
echo "   When ready, deploy to your hosting platform"
echo ""

echo "======================================"
echo "✓ Setup script completed!"
echo ""
echo "For more details, see: SUPABASE_MIGRATION_GUIDE.md"
