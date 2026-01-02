import { supabase } from './supabase.js'

// ==================== YEARS API ====================
export const yearsApi = {
  // Get all years
  async getAll() {
    const { data, error } = await supabase
      .from('years')
      .select('*')
      .order('year', { ascending: false })

    if (error) throw error
    return data
  },

  // Create a new year
  async create(year) {
    const { data, error } = await supabase
      .from('years')
      .insert([{ year }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get year by year string
  async getByYear(year) {
    const { data, error } = await supabase
      .from('years')
      .select('*')
      .eq('year', year)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// ==================== CONTRIBUTORS API ====================
export const contributorsApi = {
  // Get contributors for a specific year
  async getByYear(yearId) {
    const { data, error } = await supabase
      .from('contributors')
      .select('*')
      .eq('year_id', yearId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create a new contributor
  async create(contributor) {
    const { data, error } = await supabase
      .from('contributors')
      .insert([contributor])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a contributor
  async update(id, updates) {
    const { data, error } = await supabase
      .from('contributors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a contributor
  async delete(id) {
    const { error } = await supabase
      .from('contributors')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ==================== EXPENSES API ====================
export const expensesApi = {
  // Get expenses for a specific year
  async getByYear(yearId) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('year_id', yearId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create a new expense
  async create(expense) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update an expense
  async update(id, updates) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete an expense
  async delete(id) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ==================== GAMES API ====================
export const gamesApi = {
  // Get games for a specific year
  async getByYear(yearId) {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        first_prize:first_prize_id(id, item, amount, image),
        second_prize:second_prize_id(id, item, amount, image),
        third_prize:third_prize_id(id, item, amount, image)
      `)
      .eq('year_id', yearId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create a new game
  async create(game) {
    const { data, error } = await supabase
      .from('games')
      .insert([game])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a game
  async update(id, updates) {
    const { data, error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a game
  async delete(id) {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// ==================== WINNERS API ====================
export const winnersApi = {
  // Get winners for a specific year
  async getByYear(yearId) {
    const { data, error } = await supabase
      .from('winners')
      .select(`
        *,
        game:game_id(id, name, organizer)
      `)
      .eq('year_id', yearId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get winners for a specific game
  async getByGame(gameId) {
    const { data, error } = await supabase
      .from('winners')
      .select('*')
      .eq('game_id', gameId)
      .order('position', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create a new winner
  async create(winner) {
    const { data, error } = await supabase
      .from('winners')
      .insert([winner])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a winner
  async update(id, updates) {
    const { data, error } = await supabase
      .from('winners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a winner
  async delete(id) {
    const { error } = await supabase
      .from('winners')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Toggle prize given status
  async togglePrizeGiven(id, prizeGiven) {
    const updates = {
      prize_given: prizeGiven,
      prize_given_date: prizeGiven ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('winners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ==================== UTILITY FUNCTIONS ====================

// Get all data for a specific year (similar to localStorage structure)
export async function getYearData(year) {
  try {
    // Get or create year
    let yearRecord = await yearsApi.getByYear(year)
    if (!yearRecord) {
      yearRecord = await yearsApi.create(year)
    }

    // Get all related data
    const [contributors, expenses, games, winners] = await Promise.all([
      contributorsApi.getByYear(yearRecord.id),
      expensesApi.getByYear(yearRecord.id),
      gamesApi.getByYear(yearRecord.id),
      winnersApi.getByYear(yearRecord.id)
    ])

    // Transform winners to the expected format (grouped by game_id)
    const winnersGrouped = winners.reduce((acc, winner) => {
      if (!acc[winner.game_id]) {
        acc[winner.game_id] = []
      }
      acc[winner.game_id].push(winner)
      return acc
    }, {})

    return {
      contributors: contributors.map(transformContributor),
      expenses: expenses.map(transformExpense),
      games: games.map(transformGame),
      winners: winnersGrouped
    }
  } catch (error) {
    console.error('Error fetching year data:', error)
    throw error
  }
}

// Transform database records to match current app structure
function transformContributor(dbRecord) {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    amount: parseFloat(dbRecord.amount),
    isPaid: dbRecord.is_paid,
    category: dbRecord.category,
    date: dbRecord.date
  }
}

function transformExpense(dbRecord) {
  return {
    id: dbRecord.id,
    item: dbRecord.item,
    amount: parseFloat(dbRecord.amount),
    category: dbRecord.category,
    date: dbRecord.date,
    image: dbRecord.image,
    created: dbRecord.created_at
  }
}

function transformGame(dbRecord) {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    organizer: dbRecord.organizer,
    referenceLink: dbRecord.reference_link,
    prizeIds: {
      first: dbRecord.first_prize_id,
      second: dbRecord.second_prize_id,
      third: dbRecord.third_prize_id
    },
    participants: dbRecord.participants || [],
    created: dbRecord.created_at,
    updated: dbRecord.updated_at
  }
}

// ==================== HISTORY API ====================
export const historyApi = {
  // Get all history activities for a specific year
  async getByYear(yearId) {
    const { data, error } = await supabase
      .from('activity_history')
      .select('*')
      .eq('year_id', yearId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Log a new activity
  async logActivity(activity) {
    const { data, error } = await supabase
      .from('activity_history')
      .insert([activity])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete old history entries (optional cleanup function)
  async cleanup(daysToKeep = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const { error } = await supabase
      .from('activity_history')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) throw error
  }
}

// ==================== HISTORY HELPER FUNCTIONS ====================

// Extract username from email (e.g., arjunan@gmail.com -> arjunan)
export function extractUsernameFromEmail(email) {
  if (!email) return 'Unknown User'
  return email.split('@')[0]
}

// Log activity helper function
export async function logActivity(userEmail, action, entity, entityName, details = {}, yearId) {
  try {
    const username = extractUsernameFromEmail(userEmail)

    const activity = {
      year_id: yearId,
      username: username,
      user_email: userEmail,
      action: action, // 'create', 'update', 'delete'
      entity_type: entity, // 'contributor', 'expense', 'game', 'winner'
      entity_name: entityName,
      description: generateActivityDescription(username, action, entity, entityName, details),
      details: details, // JSON object with additional info
      created_at: new Date().toISOString()
    }

    await historyApi.logActivity(activity)
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw error to prevent breaking the main operation
  }
}

// Generate human-readable activity description
function generateActivityDescription(username, action, entity, entityName, details) {
  const actionMap = {
    create: 'added',
    update: 'updated',
    delete: 'deleted'
  }

  const actionText = actionMap[action] || action

  // Build description based on entity type and details
  let description = `${username} ${actionText} ${entity} "${entityName}"`

  // Add specific details based on entity type
  if (entity === 'expense' && details.amount) {
    description += ` for ₹${details.amount}`
  }

  if (entity === 'contributor' && details.amount) {
    description += ` with contribution ₹${details.amount}`
  }

  if (entity === 'game' && details.organizer) {
    description += ` (organized by ${details.organizer})`
  }

  if (entity === 'winner' && details.position) {
    description += ` as ${details.position} place winner`
  }

  if (details.image && action === 'update') {
    description += ` and updated image`
  }

  if (details.prize_given !== undefined) {
    description += details.prize_given ? ` and marked prize as given` : ` and marked prize as pending`
  }

  return description
}

// Error handler wrapper
export function withErrorHandler(apiFunction) {
  return async (...args) => {
    try {
      return await apiFunction(...args)
    } catch (error) {
      console.error('API Error:', error)
      throw new Error(`Database operation failed: ${error.message}`)
    }
  }
}