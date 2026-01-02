import { useState } from 'react'
import { contributorsApi, yearsApi, logActivity } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { IndianRupee, Plus, CheckCircle, Clock, Pencil, Trash2 } from 'lucide-react'
import LoadingButton from './LoadingButton'
import Skeleton from './Skeleton'
import Modal from './Modal'

function Contributors({ data, refreshData, currentYear, isLoading = false }) {
  const { isAdmin, user } = useAuth()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', amount: '', isPaid: false })
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'paid', 'unpaid'
  const [activeTab, setActiveTab] = useState('boys-girls') // 'village-people', 'boys-girls'

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatingPaymentIds, setUpdatingPaymentIds] = useState(new Set())
  const [deletingIds, setDeletingIds] = useState(new Set())

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [contributorToDelete, setContributorToDelete] = useState(null)

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [contributorToEdit, setContributorToEdit] = useState(null)

  const { contributors = [] } = data

  // Ensure all contributors have a category (backward compatibility)
  const updatedContributors = contributors.map(contributor => ({
    ...contributor,
    category: contributor.category || 'boys-girls'
  }))

  // Filter contributors by active tab
  const categoryContributors = updatedContributors.filter(contributor => contributor.category === activeTab)

  // Overall totals (across all categories)
  const overallTotalAmount = updatedContributors.reduce((sum, contributor) => sum + contributor.amount, 0)
  const overallPaidAmount = updatedContributors.filter(c => c.isPaid).reduce((sum, contributor) => sum + contributor.amount, 0)
  const overallUnpaidAmount = updatedContributors.filter(c => !c.isPaid).reduce((sum, contributor) => sum + contributor.amount, 0)
  const overallPaidCount = updatedContributors.filter(c => c.isPaid).length
  const overallUnpaidCount = updatedContributors.filter(c => !c.isPaid).length

  // Category-specific totals
  const totalAmount = categoryContributors.reduce((sum, contributor) => sum + contributor.amount, 0)
  const paidAmount = categoryContributors.filter(c => c.isPaid).reduce((sum, contributor) => sum + contributor.amount, 0)
  const unpaidAmount = categoryContributors.filter(c => !c.isPaid).reduce((sum, contributor) => sum + contributor.amount, 0)
  const paidCount = categoryContributors.filter(c => c.isPaid).length
  const unpaidCount = categoryContributors.filter(c => !c.isPaid).length

  // Category breakdown
  const boysGirlsContributors = updatedContributors.filter(c => c.category === 'boys-girls')
  const villagePeopleContributors = updatedContributors.filter(c => c.category === 'village-people')

  const boysGirlsTotal = boysGirlsContributors.reduce((sum, c) => sum + c.amount, 0)
  const villagePeopleTotal = villagePeopleContributors.reduce((sum, c) => sum + c.amount, 0)

  const filteredContributors = categoryContributors.filter(contributor => {
    if (filterStatus === 'paid') return contributor.isPaid
    if (filterStatus === 'unpaid') return !contributor.isPaid
    return true
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.amount || formData.amount <= 0) {
      alert('Please enter valid name and amount')
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

      if (editingId !== null) {
        // Update existing contributor
        await contributorsApi.update(editingId, {
          name: formData.name.trim(),
          amount: parseFloat(formData.amount),
          is_paid: formData.isPaid
        })

        // Log history for update
        await logActivity(
          user?.email,
          'update',
          'contributor',
          formData.name.trim(),
          { amount: parseFloat(formData.amount), isPaid: formData.isPaid, category: activeTab },
          yearRecord.id
        )
      } else {
        // Create new contributor
        await contributorsApi.create({
          year_id: yearRecord.id,
          name: formData.name.trim(),
          amount: parseFloat(formData.amount),
          is_paid: formData.isPaid,
          category: activeTab,
          date: new Date().toISOString()
        })

        // Log history for create
        await logActivity(
          user?.email,
          'create',
          'contributor',
          formData.name.trim(),
          { amount: parseFloat(formData.amount), isPaid: formData.isPaid, category: activeTab },
          yearRecord.id
        )
      }

      // Refresh data and reset form
      await refreshData()
      setFormData({ name: '', amount: '', isPaid: false })
      setShowForm(false)
      setEditingId(null)
      setIsEditModalOpen(false)
      setContributorToEdit(null)
    } catch (error) {
      console.error('Failed to save contributor:', error)
      alert('Failed to save contributor. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (contributor) => {
    setContributorToEdit(contributor)
    setFormData({
      name: contributor.name,
      amount: contributor.amount.toString(),
      isPaid: contributor.isPaid || false
    })
    setEditingId(contributor.id)
    setIsEditModalOpen(true)
  }

  const handleDelete = (contributor) => {
    setContributorToDelete(contributor)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!contributorToDelete) return

    const contributorId = contributorToDelete.id
    const contributorName = contributorToDelete.name
    const contributorAmount = contributorToDelete.amount
    setDeletingIds(prev => new Set([...prev, contributorId]))
    setIsDeleteModalOpen(false)
    setContributorToDelete(null)

    try {
      await contributorsApi.delete(contributorId)

      // Log history for delete
      const yearRecord = await yearsApi.getByYear(currentYear)
      if (yearRecord) {
        await logActivity(
          user?.email,
          'delete',
          'contributor',
          contributorName,
          { amount: contributorAmount },
          yearRecord.id
        )
      }

      await refreshData()
    } catch (error) {
      console.error('Failed to delete contributor:', error)
      alert('Failed to delete contributor. Please try again.')
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(contributorId)
        return newSet
      })
    }
  }

  const resetForm = () => {
    setFormData({ name: '', amount: '', isPaid: false })
    setShowForm(false)
    setEditingId(null)
    setIsEditModalOpen(false)
    setContributorToEdit(null)
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-6 w-6" />
              Fund Collection
            </div>
          </h2>
          <p className="text-gray-600 mt-1">Pongal {currentYear}</p>
          <div className="mt-3 space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-48" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  Total Promised: <span className="font-semibold text-blue-600 text-lg">₹{overallTotalAmount.toLocaleString()}</span>
                </p>
                <div className="flex flex-wrap gap-4">
                  <p className="text-gray-600">
                    Paid: <span className="font-semibold text-green-600 text-lg">₹{overallPaidAmount.toLocaleString()}</span> <span className="text-gray-500">({overallPaidCount})</span>
                  </p>
                  <p className="text-gray-600">
                    Unpaid: <span className="font-semibold text-red-600 text-lg">₹{overallUnpaidAmount.toLocaleString()}</span> <span className="text-gray-500">({overallUnpaidCount})</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-blue-500 mr-3 text-lg">👨‍👩‍👧‍👦</div>
                  <div>
                    <h4 className="text-blue-800 font-semibold">Boys & Girls</h4>
                    <p className="text-blue-700 text-sm">
                      {boysGirlsContributors.length} contributor{boysGirlsContributors.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-800 font-semibold text-lg">
                    ₹{boysGirlsTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-green-500 mr-3 text-lg">🏘️</div>
                  <div>
                    <h4 className="text-green-800 font-semibold">Village People</h4>
                    <p className="text-green-700 text-sm">
                      {villagePeopleContributors.length} contributor{villagePeopleContributors.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-800 font-semibold text-lg">
                    ₹{villagePeopleTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Contributor Button - Admin Only */}
      {isAdmin && !showForm && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Contributor
          </button>
        </div>
      )}

      {/* Category Tabs - Only show for admin users */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('boys-girls')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'boys-girls'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Boys & Girls
            </button>
            <button
              onClick={() => setActiveTab('village-people')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'village-people'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Village People
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId !== null ? 'Edit Contributor' : 'Add New Contributor'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contributor name"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Status
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPaid" className="ml-2 text-sm text-gray-700">
                  <div className="flex items-center gap-1">
                    {formData.isPaid ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Paid
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        Unpaid
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row items-start sm:items-end space-y-2 sm:space-y-0 sm:space-x-2">
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                spinnerSize="small"
              >
                {editingId !== null ? 'Update' : 'Add'}
              </LoadingButton>
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contributors List - Only show for admin users */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Contributors List</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({categoryContributors.length})
                </button>
                <button
                  onClick={() => setFilterStatus('paid')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'paid'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Paid ({paidCount})
                </button>
                <button
                  onClick={() => setFilterStatus('unpaid')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'unpaid'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Unpaid ({unpaidCount})
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <>
              {/* Desktop Table View - Skeleton */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
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
          ) : categoryContributors.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
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
                    {filteredContributors.map((contributor) => (
                      <tr key={contributor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-900 font-medium text-sm">
                                {contributor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {contributor.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            ₹{contributor.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isAdmin ? (
                            <LoadingButton
                              onClick={async () => {
                                setUpdatingPaymentIds(prev => new Set([...prev, contributor.id]))
                                try {
                                  const newPaymentStatus = !contributor.isPaid
                                  await contributorsApi.update(contributor.id, {
                                    is_paid: newPaymentStatus
                                  })

                                  // Log history for payment status update
                                  const yearRecord = await yearsApi.getByYear(currentYear)
                                  if (yearRecord) {
                                    await logActivity(
                                      user?.email,
                                      'update',
                                      'contributor',
                                      contributor.name,
                                      {
                                        amount: contributor.amount,
                                        isPaid: newPaymentStatus,
                                        paymentStatusChanged: true
                                      },
                                      yearRecord.id
                                    )
                                  }

                                  await refreshData()
                                } catch (error) {
                                  console.error('Failed to update payment status:', error)
                                  alert('Failed to update payment status. Please try again.')
                                } finally {
                                  setUpdatingPaymentIds(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(contributor.id)
                                    return newSet
                                  })
                                }
                              }}
                              loading={updatingPaymentIds.has(contributor.id)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                contributor.isPaid
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                              spinnerSize="small"
                            >
                              <div className="flex items-center gap-1">
                                {contributor.isPaid ? (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4" />
                                    Unpaid
                                  </>
                                )}
                              </div>
                            </LoadingButton>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              contributor.isPaid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              <div className="flex items-center gap-1">
                                {contributor.isPaid ? (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4" />
                                    Unpaid
                                  </>
                                )}
                              </div>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {contributor.date ? new Date(contributor.date).toLocaleDateString() : 'No date'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isAdmin && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(contributor)}
                                disabled={deletingIds.has(contributor.id)}
                                className="text-blue-600 hover:text-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <LoadingButton
                                onClick={() => handleDelete(contributor)}
                                loading={deletingIds.has(contributor.id)}
                                className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1"
                                spinnerSize="small"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </LoadingButton>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredContributors.map((contributor) => (
                  <div key={contributor.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center flex-1">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          contributor.isPaid ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <span className={`font-medium ${
                            contributor.isPaid ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {contributor.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {contributor.name}
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            ₹{contributor.amount.toLocaleString()}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {isAdmin ? (
                              <LoadingButton
                                onClick={async () => {
                                  setUpdatingPaymentIds(prev => new Set([...prev, contributor.id]))
                                  try {
                                    const newPaymentStatus = !contributor.isPaid
                                    await contributorsApi.update(contributor.id, {
                                      is_paid: newPaymentStatus
                                    })

                                    // Log history for payment status update
                                    const yearRecord = await yearsApi.getByYear(currentYear)
                                    if (yearRecord) {
                                      await logActivity(
                                        user?.email,
                                        'update',
                                        'contributor',
                                        contributor.name,
                                        {
                                          amount: contributor.amount,
                                          isPaid: newPaymentStatus,
                                          paymentStatusChanged: true
                                        },
                                        yearRecord.id
                                      )
                                    }

                                    await refreshData()
                                  } catch (error) {
                                    console.error('Failed to update payment status:', error)
                                    alert('Failed to update payment status. Please try again.')
                                  } finally {
                                    setUpdatingPaymentIds(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(contributor.id)
                                      return newSet
                                    })
                                  }
                                }}
                                loading={updatingPaymentIds.has(contributor.id)}
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  contributor.isPaid
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                                spinnerSize="small"
                              >
                                <div className="flex items-center gap-1">
                                {contributor.isPaid ? (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4" />
                                    Unpaid
                                  </>
                                )}
                              </div>
                              </LoadingButton>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                contributor.isPaid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                <div className="flex items-center gap-1">
                                  {contributor.isPaid ? (
                                    <>
                                      <CheckCircle className="h-4 w-4" />
                                      Paid
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-4 w-4" />
                                      Unpaid
                                    </>
                                  )}
                                </div>
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {contributor.date ? new Date(contributor.date).toLocaleDateString() : 'No date'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => handleEdit(contributor)}
                            disabled={deletingIds.has(contributor.id)}
                            className="text-blue-600 hover:text-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <LoadingButton
                            onClick={() => handleDelete(contributor)}
                            loading={deletingIds.has(contributor.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center gap-1"
                            spinnerSize="small"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </LoadingButton>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="flex justify-center mb-4">
                <IndianRupee className="text-gray-400 h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contributors yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first contributor to track funds.</p>
              {filterStatus === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Add First Contributor
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : categoryContributors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IndianRupee className="text-blue-500 mr-3 h-6 w-6" />
                <div>
                  <h4 className="text-blue-800 font-semibold">Total Promised</h4>
                  <p className="text-blue-700 text-sm">
                    {categoryContributors.length} contributor{categoryContributors.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-800 font-semibold text-lg">
                  ₹{totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IndianRupee className="text-green-500 mr-3 h-6 w-6" />
                <div>
                  <h4 className="text-green-800 font-semibold">Paid Amount</h4>
                  <p className="text-green-700 text-sm">
                    {paidCount} paid • {unpaidCount} pending
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-800 font-semibold text-lg">
                  ₹{paidAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <IndianRupee className="text-red-500 mr-3 h-6 w-6" />
                <div>
                  <h4 className="text-red-800 font-semibold">Pending Amount</h4>
                  <p className="text-red-700 text-sm">
                    {Math.round((paidAmount/totalAmount) * 100) || 0}% collected
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-red-800 font-semibold text-lg">
                  ₹{unpaidAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Contributor"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{contributorToDelete?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Contributor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contributor"
      >
        <div className="space-y-6">
          {contributorToEdit && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <IndianRupee className="h-4 w-4" />
                Editing contributor from{" "}
                <strong>
                  {contributorToEdit.category === 'boys-girls' ? 'Boys & Girls' : 'Village People'}
                </strong>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contributor name"
                required
              />
            </div>

            <div>
              <label htmlFor="edit-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                id="edit-amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="1"
                step="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Status
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-isPaid"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="edit-isPaid" className="ml-2 text-sm text-gray-700">
                  <div className="flex items-center gap-1">
                    {formData.isPaid ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Paid
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        Unpaid
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col sm:flex-row items-start sm:items-end space-y-2 sm:space-y-0 sm:space-x-2">
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                spinnerSize="small"
              >
                Update Contributor
              </LoadingButton>
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}

export default Contributors
