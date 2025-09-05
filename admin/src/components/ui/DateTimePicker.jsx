import React, { forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Clock } from 'lucide-react'
import { isValid, parseISO } from 'date-fns'

const DateTimePicker = forwardRef(({ 
  value, 
  onChange, 
  placeholder = "Select date and time",
  className = "",
  disabled = false,
  _id,
  name,
  ...props 
}, _ref) => {
  // Convert value to Date object if it's a string
  const getDateValue = () => {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value === 'string') {
      const parsed = parseISO(value)
      return isValid(parsed) ? parsed : null
    }
    return null
  }

  // Handle date change and convert back to ISO string
  const handleChange = (date) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: date ? date.toISOString() : ''
        }
      })
    }
  }

  // Custom input component
  const CustomInput = forwardRef(({ value, onClick, onChange, onBlur, placeholder, disabled }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        value={value || ''}
        onClick={onClick}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly
        className={`block w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1 pointer-events-none">
        <Calendar className="w-4 h-4 text-gray-400" />
        <Clock className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  ))

  CustomInput.displayName = 'CustomInput'

  return (
    <DatePicker
      selected={getDateValue()}
      onChange={handleChange}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      timeCaption="Time"
      dateFormat="MMM d, yyyy h:mm aa"
      placeholderText={placeholder}
      disabled={disabled}
      customInput={<CustomInput />}
      popperClassName="date-picker-popper"
      calendarClassName="date-picker-calendar"
      wrapperClassName="date-picker-wrapper"
      withPortal
      popperPlacement="bottom-start"
      popperModifiers={[
        {
          name: "offset",
          options: {
            offset: [0, 5]
          }
        },
        {
          name: "preventOverflow",
          options: {
            boundary: "viewport",
            padding: 10
          }
        }
      ]}
      {...props}
    />
  )
})

DateTimePicker.displayName = 'DateTimePicker'

export { DateTimePicker }
