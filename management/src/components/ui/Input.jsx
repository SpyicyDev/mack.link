import { forwardRef } from 'react'

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  required = false,
  className = '',
  ...props 
}, ref) => {
  const inputClasses = `block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors ${
    error 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  } ${className}`

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${props.id}-error` : helperText ? `${props.id}-help` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${props.id}-help`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export { Input }