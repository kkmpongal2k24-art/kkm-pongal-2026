import { useState, useEffect } from 'react'
import { expensesApi, yearsApi } from '../lib/api'
import { uploadToCloudinary } from '../lib/cloudinary'
import { useAuth } from '../contexts/AuthContext'
import ImageUpload from './ImageUpload'
import { ShoppingBag, Plus, DollarSign, AlertTriangle, CreditCard, Trophy, Package, Filter, Eye, ArrowLeft, Calendar, Tag, Pencil, Trash2, X } from 'lucide-react'
import Modal from './Modal'
import Skeleton from './Skeleton'
import LoadingButton from './LoadingButton'

function Expenses({ data, refreshData, currentYear, isLoading = false }) {
  const { isAdmin } = useAuth()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ item: '', amount: '', date: '', image: null })
  const [filterCategory, setFilterCategory] = useState('all') // 'all', 'Prize', 'Other'
  const [viewingExpenseId, setViewingExpenseId] = useState(null)

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingIds, setDeletingIds] = useState(new Set())

  const { expenses = [], contributors = [] } = data

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (viewingExpenseId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [viewingExpenseId]);

  // Filter expenses by category
  const filteredExpenses = expenses.filter(expense => {
    if (filterCategory === 'all') return true
    return expense.category === filterCategory || (!expense.category && filterCategory === 'Prize') // Default to Prize for legacy data
  })

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalCollected = contributors.reduce((sum, contributor) => sum + contributor.amount, 0)
  const remainingBalance = totalCollected - totalExpenses

  const prizeExpenses = expenses.filter(e => e.category === 'Prize' || !e.category).reduce((sum, expense) => sum + expense.amount, 0)
  const otherExpenses = expenses.filter(e => e.category === 'Other').reduce((sum, expense) => sum + expense.amount, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.item.trim() || !formData.amount || formData.amount <= 0) {
      alert('Please enter valid item name and amount')
      return
    }

    setIsSubmitting(true)
    try {
      // Get year record
      const yearRecord = await yearsApi.getByYear(currentYear)
      if (!yearRecord) {
        alert('Year not found. Please try again.')
        return
      }

      // Auto-set category based on current filter (except for 'all')
      const category = filterCategory === 'all' ? 'Prize' : filterCategory

      let imageUrl = null

      // Handle image upload to Cloudinary if there's a new image
      if (formData.image && typeof formData.image === 'object' && formData.image.file) {
        // Temporarily bypass configuration check for debugging
        console.log('Attempting image upload...')
        console.log('Cloudinary config:', {
          cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
          apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
          apiSecret: import.meta.env.CLOUDINARY_API_SECRET ? '***' : 'missing'
        })

        try {
          imageUrl = await uploadToCloudinary(formData.image.file, {
            folder: 'pongal-expenses'
          })
          console.log('Upload successful, URL:', imageUrl)
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          alert('Failed to upload image. Please try again.')
          return
        }
      } else if (typeof formData.image === 'string') {
        // Existing image URL (when editing)
        imageUrl = formData.image
      }
      // If formData.image is null, imageUrl remains null

      if (editingId !== null) {
        // Update existing expense
        await expensesApi.update(editingId, {
          item: formData.item.trim(),
          amount: parseFloat(formData.amount),
          date: formData.date || new Date().toISOString().split('T')[0],
          image: imageUrl,
          category: category
        })
      } else {
        // Create new expense
        await expensesApi.create({
          year_id: yearRecord.id,
          item: formData.item.trim(),
          amount: parseFloat(formData.amount),
          date: formData.date || new Date().toISOString().split('T')[0],
          image: imageUrl,
          category: category
        })
      }

      // Refresh data and reset form
      await refreshData()
      setFormData({ item: '', amount: '', date: '', image: null })
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      console.error('Failed to save expense:', error)
      alert('Failed to save expense. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (expense) => {
    setFormData({
      item: expense.item,
      amount: expense.amount.toString(),
      date: expense.date,
      image: expense.image || null
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const handleDelete = (expense) => {
    setExpenseToDelete(expense)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return

    const expenseId = expenseToDelete.id
    setDeletingIds(prev => new Set([...prev, expenseId]))
    setIsDeleteModalOpen(false)
    setExpenseToDelete(null)

    try {
      await expensesApi.delete(expenseId)
      await refreshData()
    } catch (error) {
      console.error('Failed to delete expense:', error)
      alert('Failed to delete expense. Please try again.')
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(expenseId)
        return newSet
      })
    }
  }

  const resetForm = () => {
    setFormData({ item: '', amount: '', date: '', image: null })
    setShowForm(false)
    setEditingId(null)
  }


  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Expenses & Purchases
            </div>
          </h2>
          <p className="text-gray-600 mt-1">Pongal {currentYear}</p>
          <div className="mt-3 space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-40" />
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  Total Expenses: <span className="font-semibold text-red-600 text-lg">₹{totalExpenses.toLocaleString()}</span>
                </p>
                <p className="text-gray-600">
                  Remaining Balance: <span className={`font-semibold text-lg ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{remainingBalance.toLocaleString()}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : expenses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="text-yellow-500 mr-3 h-6 w-6" />
                  <div>
                    <h4 className="text-yellow-800 font-semibold">Prize Expenses</h4>
                    <p className="text-yellow-700 text-sm">
                      {expenses.filter(e => e.category === 'Prize' || !e.category).length} item{expenses.filter(e => e.category === 'Prize' || !e.category).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-yellow-800 font-semibold text-lg">
                    ₹{prizeExpenses.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="text-gray-500 mr-3 h-6 w-6" />
                  <div>
                    <h4 className="text-gray-800 font-semibold">Other Expenses</h4>
                    <p className="text-gray-700 text-sm">
                      {expenses.filter(e => e.category === 'Other').length} item{expenses.filter(e => e.category === 'Other').length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-800 font-semibold text-lg">
                    ₹{otherExpenses.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {isLoading ? (
          <div className="bg-white shadow-md border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center space-x-1">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-28" />
                <Skeleton className="h-12 w-24" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center space-x-1">
                <button
                  onClick={() => {
                    setFilterCategory('all')
                    setShowForm(false)
                    setEditingId(null)
                    setViewingExpenseId(null)
                  }}
                  className={`px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                    filterCategory === 'all'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-semibold">All ({expenses.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setFilterCategory('Prize')
                    setShowForm(false)
                    setEditingId(null)
                    setViewingExpenseId(null)
                  }}
                  className={`px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                    filterCategory === 'Prize'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span className="font-semibold">Prize ({expenses.filter(e => e.category === 'Prize' || !e.category).length})</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setFilterCategory('Other')
                    setShowForm(false)
                    setEditingId(null)
                    setViewingExpenseId(null)
                  }}
                  className={`px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                    filterCategory === 'Other'
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="font-semibold">Others ({expenses.filter(e => e.category === 'Other').length})</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {!showForm && isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            disabled={filterCategory === 'all'}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center justify-center ${
              filterCategory === 'all'
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {filterCategory === 'all'
                ? 'Select Prize or Others tab to add'
                : `Add ${filterCategory === 'Prize' ? 'Prize' : 'Other Expense'}`
              }
            </div>
          </button>
        )}
      </div>

      {remainingBalance < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-3 h-6 w-6" />
            <div>
              <h4 className="text-red-800 font-semibold">Budget Alert</h4>
              <p className="text-red-700 text-sm">
                Your expenses exceed the collected funds by ₹{Math.abs(remainingBalance).toLocaleString()}.
                Consider collecting more funds or reducing expenses.
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId !== null
              ? 'Edit Expense'
              : `Add New ${filterCategory === 'Prize' ? 'Prize' : 'Other Expense'}`
            }
          </h3>
          {filterCategory !== 'all' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                {filterCategory === 'Prize' ? (
                  <Trophy className="h-4 w-4" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                This will be added as a <strong>{filterCategory === 'Prize' ? 'Prize' : 'Other Expense'}</strong>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="item" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  id="item"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={filterCategory === 'Prize' ? "e.g., Gift vouchers, Trophies, etc." : "e.g., Decorations, Food, etc."}
                  required
                />
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent md:max-w-xs"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ImageUpload
                  image={formData.image}
                  onImageChange={(image) => setFormData({ ...formData, image })}
                  label="Prize Image (Optional)"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <LoadingButton
                    type="submit"
                    loading={isSubmitting}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    {editingId !== null
                      ? 'Update Item'
                      : `Add ${filterCategory === 'Prize' ? 'Prize' : 'Other Expense'}`
                    }
                  </LoadingButton>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          {isLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <h3 className="text-lg font-semibold text-gray-800">
              {filterCategory === 'all'
                ? `Expense History (${expenses.length})`
                : `${filterCategory} Items (${filteredExpenses.length})`
              }
            </h3>
          )}
        </div>

        {isLoading ? (
          <>
            {/* Desktop Table View - Skeleton */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 3 }, (_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton variant="table-row" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Skeleton */}
            <div className="md:hidden divide-y divide-gray-200">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="p-4">
                  <Skeleton variant="card" />
                </div>
              ))}
            </div>
          </>
        ) : filteredExpenses.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense, index) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden bg-gray-100 border">
                            {expense.image ? (
                              <img
                                src={expense.image}
                                alt={expense.item}
                                className="h-12 w-12 object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 flex items-center justify-center text-gray-400">
                                <ShoppingBag className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {expense.item}
                            </div>
                            {expense.image && (
                              <div className="text-xs text-gray-500">
                                With image
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {expense.category === 'Other' ? (
                            <div className="flex items-center text-sm">
                              <Package className="h-4 w-4 text-gray-600 mr-1" />
                              <span className="text-gray-700">Other</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-sm">
                              <Trophy className="h-4 w-4 text-yellow-600 mr-1" />
                              <span className="text-gray-700">Prize</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-red-600">
                          ₹{expense.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setViewingExpenseId(expense.id)}
                            className="text-green-600 hover:text-green-900 transition-colors flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEdit(expense)}
                                className="text-blue-600 hover:text-blue-900 transition-colors flex items-center gap-1"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <LoadingButton
                                onClick={() => handleDelete(expense)}
                                loading={deletingIds.has(expense.id)}
                                className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1"
                                spinnerSize="small"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </LoadingButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredExpenses.map((expense, index) => (
                <div key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border">
                        {expense.image ? (
                          <img
                            src={expense.image}
                            alt={expense.item}
                            className="h-16 w-16 object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 flex items-center justify-center text-gray-400">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                              {index + 1}
                            </span>
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {expense.item}
                            </h3>
                          </div>
                          <div className="flex items-center mt-1">
                            {expense.category === 'Other' ? (
                              <div className="flex items-center text-xs">
                                <Package className="h-3 w-3 text-gray-600 mr-1" />
                                <span className="text-gray-600">Other</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-xs">
                                <Trophy className="h-3 w-3 text-yellow-600 mr-1" />
                                <span className="text-gray-600">Prize</span>
                              </div>
                            )}
                          </div>
                          <p className="text-lg font-semibold text-red-600 mt-1">
                            ₹{expense.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {expense.date ? new Date(expense.date).toLocaleDateString() : 'No date'}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => setViewingExpenseId(expense.id)}
                            className="text-green-600 hover:text-green-900 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEdit(expense)}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <LoadingButton
                                onClick={() => handleDelete(expense)}
                                loading={deletingIds.has(expense.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center gap-1"
                                spinnerSize="small"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </LoadingButton>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <ShoppingBag className="text-gray-400 h-16 w-16 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
            <p className="text-gray-500 mb-4">Start by adding your first expense or purchase.</p>
            {filterCategory !== 'all' && isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Expense
                </div>
              </button>
            )}
          </div>
        )}
      </div>



      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : expenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="text-blue-500 mr-3 h-6 w-6" />
              <div>
                <h4 className="text-blue-800 font-semibold">Total Collected</h4>
                <p className="text-blue-600 text-lg font-bold">₹{totalCollected.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ShoppingBag className="text-red-500 mr-3 h-6 w-6" />
              <div>
                <h4 className="text-red-800 font-semibold">Total Expenses</h4>
                <p className="text-red-600 text-lg font-bold">₹{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className={`${remainingBalance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
            <div className="flex items-center">
              {remainingBalance >= 0 ? (
                <CreditCard className="text-green-500 mr-3 h-6 w-6" />
              ) : (
                <AlertTriangle className="text-red-500 mr-3 h-6 w-6" />
              )}
              <div>
                <h4 className={`${remainingBalance >= 0 ? 'text-green-800' : 'text-red-800'} font-semibold`}>
                  Balance
                </h4>
                <p className={`${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'} text-lg font-bold`}>
                  ₹{remainingBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {viewingExpenseId && (() => {
        const viewingExpense = expenses.find(e => e.id === viewingExpenseId)
        if (!viewingExpense) {
          setViewingExpenseId(null)
          return null
        }

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {viewingExpense.item}
                  </h2>
                  <div className="flex items-center space-x-2">
                    {viewingExpense.category === 'Other' ? (
                      <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                        <Package className="h-4 w-4 text-gray-600 mr-1" />
                        <span className="text-sm text-gray-700">Other</span>
                      </div>
                    ) : (
                      <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                        <Trophy className="h-4 w-4 text-yellow-600 mr-1" />
                        <span className="text-sm text-gray-700">Prize</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingExpenseId(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Details</h3>

                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Amount</span>
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            ₹{viewingExpense.amount.toLocaleString()}
                          </div>
                        </div>

                        {viewingExpense.date && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Purchase Date</span>
                            </div>
                            <div className="text-lg text-gray-900">
                              {new Date(viewingExpense.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Tag className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Category</span>
                          </div>
                          <div className="text-lg text-gray-900">
                            {viewingExpense.category === 'Other' ? 'Other Expense' : 'Prize/Game Related'}
                          </div>
                        </div>

                        {viewingExpense.created && (
                          <div className="text-xs text-gray-500">
                            Added: {new Date(viewingExpense.created).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isAdmin && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={() => {
                            handleEdit(viewingExpense)
                            setViewingExpenseId(null)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Expense
                        </button>
                        <LoadingButton
                          onClick={() => {
                            handleDelete(viewingExpense)
                            setViewingExpenseId(null)
                          }}
                          loading={deletingIds.has(viewingExpense.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Expense
                        </LoadingButton>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Image */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Image</h3>
                    {viewingExpense.image ? (
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <img
                          src={viewingExpense.image}
                          alt={viewingExpense.item}
                          className="w-full h-64 sm:h-80 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg h-64 sm:h-80 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p>No image attached</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Expense"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{expenseToDelete?.item}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
              disabled={deletingIds.has(expenseToDelete?.id)}
            >
              Cancel
            </button>
            <LoadingButton
              onClick={handleConfirmDelete}
              loading={deletingIds.has(expenseToDelete?.id)}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md font-medium transition-colors"
              spinnerSize="small"
            >
              Delete
            </LoadingButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Expenses
