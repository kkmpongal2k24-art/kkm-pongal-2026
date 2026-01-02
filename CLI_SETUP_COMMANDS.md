# Supabase CLI Setup Commands

Use these commands to complete your Supabase setup. I've prepared everything for you!

## ✅ COMPLETED
- ✅ Supabase CLI installed (v2.67.1)
- ✅ Project initialized (`supabase init`)
- ✅ Migration file created: `supabase/migrations/20260102092128_create_pongal_tables.sql`
- ✅ Database schema ready to deploy

## 🚀 NEXT STEPS FOR YOU

### 1. Login to Supabase
```bash
# Get your access token from: https://supabase.com/dashboard → Profile → Access Tokens
supabase login --token YOUR_ACCESS_TOKEN_HERE
```

### 2. Link to Your Remote Project
```bash
# From your Supabase project URL: postgresql://postgres:[YOUR-PASSWORD]@db.tbplqbtkyhhetzffhrej.supabase.co:5432/postgres
# Extract the project reference ID: tbplqbtkyhhetzffhrej

supabase link --project-ref tbplqbtkyhhetzffhrej
```

### 3. Push Database Schema
```bash
# This will create all your tables in the cloud database
supabase db push
```

### 4. Update Environment Variables
Edit your `.env` file with these values:
```env
VITE_SUPABASE_URL=https://tbplqbtkyhhetzffhrej.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
```

### 5. Test the Setup
```bash
# Start your development server
npm run dev

# Your app should now connect to Supabase!
```

## 📋 WHAT THE MIGRATION CREATES

When you run `supabase db push`, it will create:

### Tables:
- **years** - Manages different Pongal celebration years
- **contributors** - Fund contributors with payment tracking
- **expenses** - Purchases and prizes with image support
- **games** - Game management with prize assignments
- **winners** - Winner tracking with prize distribution status

### Features:
- **Automatic timestamps** - created_at and updated_at
- **Performance indexes** - Fast queries
- **Foreign key constraints** - Data integrity
- **Row Level Security** - Basic security policies

## 🔧 ALTERNATIVE METHOD (If CLI doesn't work)

If you prefer to use the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20260102092128_create_pongal_tables.sql`
4. Click **Run** to execute

## ⚡ QUICK VERIFICATION

After setup, test these in your browser console:
```javascript
// Test API connection
import { supabase } from './src/lib/supabase.js'

// Should return your Supabase client
console.log(supabase)

// Test database connection (should return empty array initially)
const { data, error } = await supabase.from('years').select('*')
console.log('Years:', data, 'Error:', error)
```

## 🎯 READY TO GO!

Once you complete these steps:
1. ✅ All your data will be stored in the cloud
2. ✅ The Contributors section is fully functional
3. ✅ You can add years, manage contributors with payments
4. ✅ Data persists across browser sessions and devices

The remaining components (Expenses, Games, Winners) follow the same pattern as Contributors and can be updated later.

## 📞 SUPPORT

If you encounter issues:
1. Check the browser console for errors
2. Verify your `.env` file has the correct URLs
3. Make sure the database migration ran successfully
4. Test with simple API calls first

Your Pongal event management system is ready for the cloud! 🎉