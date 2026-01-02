# Supabase Migration Setup Guide

This guide will help you migrate your Pongal 2026 application from localStorage to Supabase cloud database.

## Prerequisites

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

## Step 1: Configure Supabase Project

### 1.1 Get Your Credentials
After creating a project in Supabase:

1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public key**

### 1.2 Update Environment Variables
Edit the `.env` file in your project root:

```env
# Replace with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Create Database Schema

### 2.1 Run SQL Schema
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** to execute the schema

This will create:
- `years` table for managing different Pongal years
- `contributors` table for fund contributors
- `expenses` table for purchases and prizes
- `games` table for game management
- `winners` table for storing game winners

## Step 3: Configure Row Level Security (Optional)

The schema includes basic RLS policies that allow all operations. For production, you may want to customize these:

```sql
-- Example: Only allow operations on current user's data
CREATE POLICY "Users can only access their own data"
ON public.contributors
FOR ALL
USING (auth.uid()::text = user_id);
```

## Step 4: Test the Migration

### 4.1 Start Development Server
```bash
npm run dev
```

### 4.2 Verify Data Operations
1. **Add a new year** - Test the year creation functionality
2. **Add contributors** - Verify fund collection works
3. **Add expenses** - Test purchase tracking
4. **Create games** - Ensure game creation works
5. **Add winners** - Verify winner selection

## Step 5: Migrate Existing Data (If Any)

If you have existing localStorage data, you can migrate it manually:

### 5.1 Export Existing Data
Open browser console on your old app:
```javascript
// Export existing data
const data = JSON.parse(localStorage.getItem('pongalGameData'));
console.log(JSON.stringify(data, null, 2));
```

### 5.2 Import to Supabase
Use the Supabase dashboard or the API to import your data:

1. **Create years** first
2. **Import contributors** with the correct year_id
3. **Import expenses** with the correct year_id
4. **Import games** with prize references
5. **Import winners** with game and year references

## API Reference

The application now uses these API functions:

### Years API
- `yearsApi.getAll()` - Get all years
- `yearsApi.create(year)` - Create new year
- `yearsApi.getByYear(year)` - Get specific year

### Contributors API
- `contributorsApi.getByYear(yearId)` - Get contributors for year
- `contributorsApi.create(contributor)` - Add new contributor
- `contributorsApi.update(id, updates)` - Update contributor
- `contributorsApi.delete(id)` - Delete contributor

### Expenses API
- `expensesApi.getByYear(yearId)` - Get expenses for year
- `expensesApi.create(expense)` - Add new expense
- `expensesApi.update(id, updates)` - Update expense
- `expensesApi.delete(id)` - Delete expense

### Games API
- `gamesApi.getByYear(yearId)` - Get games for year
- `gamesApi.create(game)` - Create new game
- `gamesApi.update(id, updates)` - Update game
- `gamesApi.delete(id)` - Delete game

### Winners API
- `winnersApi.getByYear(yearId)` - Get winners for year
- `winnersApi.getByGame(gameId)` - Get winners for specific game
- `winnersApi.create(winner)` - Add new winner
- `winnersApi.update(id, updates)` - Update winner
- `winnersApi.delete(id)` - Delete winner
- `winnersApi.togglePrizeGiven(id, status)` - Toggle prize status

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env` file is in the project root
   - Restart the development server after changes
   - Variables must start with `VITE_`

2. **Database Connection Errors**
   - Verify your Supabase URL and key are correct
   - Check that RLS policies allow your operations
   - Ensure the schema was created successfully

3. **Data Not Appearing**
   - Check browser console for errors
   - Verify API calls in Network tab
   - Ensure the correct year is selected

4. **Performance Issues**
   - Consider adding indexes for large datasets
   - Implement pagination for large lists
   - Use Supabase's real-time features if needed

### Development Tips

1. **Enable Real-time Updates** (Optional)
```javascript
// Listen for changes in contributors table
const subscription = supabase
  .channel('contributors-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'contributors' },
    (payload) => {
      console.log('Change received!', payload)
      refreshData() // Refresh your data
    }
  )
  .subscribe()
```

2. **Add Data Validation**
   - Use Supabase's built-in validation
   - Add custom triggers for complex validation
   - Implement client-side validation for better UX

3. **Backup Your Data**
   - Use Supabase's backup features
   - Export data regularly during development
   - Consider implementing data export functionality

## Next Steps

- Set up authentication if needed
- Add real-time features for collaborative editing
- Implement data export/import functionality
- Add advanced filtering and search
- Set up automated backups
- Deploy to production with proper environment variables

## Support

For issues with this migration:
1. Check the browser console for errors
2. Verify your Supabase project configuration
3. Test API endpoints individually
4. Check Supabase logs in the dashboard