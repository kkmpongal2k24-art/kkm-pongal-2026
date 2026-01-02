// Quick test to verify Supabase connection
// Run this with: node test-connection.js

import { createClient } from '@supabase/supabase-js'

// Use your project credentials
const supabaseUrl = 'https://tbplqbtkyhhetzffhrej.supabase.co'
const supabaseKey = 'sb_publishable_Xccur5Gzqk65yRqhUtWAdw_hf35S67A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🚀 Testing Supabase connection...')

  try {
    // Test 1: Check if years table exists
    const { data, error } = await supabase
      .from('years')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Database error:', error.message)
      if (error.message.includes('relation "years" does not exist')) {
        console.log('📋 Tables not created yet. Need to run schema.')
      }
    } else {
      console.log('✅ Database connection successful!')
      console.log('📊 Years table data:', data)
    }

    // Test 2: Check all tables exist
    const tables = ['years', 'contributors', 'expenses', 'games', 'winners']
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (tableError) {
          console.log(`❌ Table "${table}" not found:`, tableError.message)
        } else {
          console.log(`✅ Table "${table}" exists`)
        }
      } catch (e) {
        console.log(`❌ Table "${table}" error:`, e.message)
      }
    }

  } catch (error) {
    console.log('💥 Connection failed:', error.message)
  }
}

testConnection()