import React from 'react'

function Skeleton({ className = '', variant = 'default', lines = 1 }) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className={`${baseClasses} h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}></div>
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'table-row') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
            <div className="w-16 h-6 bg-gray-300 rounded"></div>
            <div className="w-20 h-6 bg-gray-300 rounded"></div>
            <div className="w-24 h-6 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Default rectangle
  return <div className={`${baseClasses} ${className}`}></div>
}

export default Skeleton
