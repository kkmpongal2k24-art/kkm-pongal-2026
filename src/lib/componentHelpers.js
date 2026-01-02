// Helper functions for component migration to Supabase
import { yearsApi } from './api'

/**
 * Get year record ID for current year
 * Creates the year if it doesn't exist
 */
export async function getYearId(currentYear) {
  let yearRecord = await yearsApi.getByYear(currentYear)
  if (!yearRecord) {
    yearRecord = await yearsApi.create(currentYear)
  }
  return yearRecord.id
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error, operation = 'operation') {
  console.error(`Failed to ${operation}:`, error)
  alert(`Failed to ${operation}. Please try again.`)
}

/**
 * Wrapper for form submission with loading state
 */
export function withLoading(asyncFn) {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      throw error
    }
  }
}

/**
 * Transform Supabase winner data to match component expectations
 */
export function transformWinnersData(winnersArray) {
  return winnersArray.reduce((acc, winner) => {
    if (!acc[winner.game_id]) {
      acc[winner.game_id] = []
    }
    acc[winner.game_id].push({
      ...winner,
      prizeGiven: winner.prize_given,
      prizeGivenDate: winner.prize_given_date
    })
    return acc
  }, {})
}