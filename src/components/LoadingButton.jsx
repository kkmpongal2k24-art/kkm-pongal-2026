import React from 'react'

function LoadingButton({
  children,
  loading = false,
  disabled = false,
  className = '',
  spinnerSize = 'small',
  ...props
}) {
  const spinnerClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }

  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`${className} ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${spinnerClasses[spinnerSize]}`}></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

export default LoadingButton
