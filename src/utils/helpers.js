export const generateId = () => {
  return Date.now() + Math.random().toString(36).substring(2)
}

export const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString()}`
}

export const formatDate = (dateString) => {
  if (!dateString) return 'No date'
  return new Date(dateString).toLocaleDateString()
}