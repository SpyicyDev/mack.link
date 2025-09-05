import React, { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Calendar, Clock, ChevronDown } from 'lucide-react'
import { format, isValid, parseISO, setHours, setMinutes } from 'date-fns'

function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return isValid(value) ? value : null
  if (typeof value === 'string') {
    const d = parseISO(value)
    return isValid(d) ? d : null
  }
  return null
}

function toISOOrEmpty(d) {
  return d && isValid(d) ? d.toISOString() : ''
}


function timeOptions(interval = 15) {
  const opts = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const label = format(new Date(2000, 0, 1, h, m), 'h:mm aa')
      opts.push({ value: `${hh}:${mm}`, label })
    }
  }
  return opts
}

const TIME_OPTIONS = timeOptions(15)

export function DateTimePicker({ name, value, onChange, placeholder = 'Select date and time', disabled = false }) {
  const initialDate = useMemo(() => toDate(value), [value])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(initialDate)
  const [month, setMonth] = useState(initialDate || new Date())

  const selectedTime = useMemo(() => {
    if (!selected) return '09:00'
    const hh = String(selected.getHours()).padStart(2, '0')
    const mm = String(selected.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  }, [selected])

  const applyChange = (d) => {
    setSelected(d)
    if (onChange) {
      onChange({ target: { name, value: toISOOrEmpty(d) } })
    }
  }

  const handleDateSelect = (d) => {
    if (!d) {
      applyChange(null)
      setOpen(false)
      return
    }
    
    // Preserve existing time when changing date
    const currentTime = selected ? { hours: selected.getHours(), minutes: selected.getMinutes() } : { hours: 9, minutes: 0 }
    const withTime = setMinutes(setHours(d, currentTime.hours), currentTime.minutes)
    applyChange(withTime)
    setOpen(false)
  }

  const handleTimeChange = (e) => {
    const val = e.target.value
    const [h, m] = val.split(':').map((x) => parseInt(x, 10))
    
    const baseDate = selected || new Date()
    const withTime = setMinutes(setHours(baseDate, h), m)
    applyChange(withTime)
  }


  // Split UI: left Date field (popover calendar), right Time field (dropdown)
  const dateText = selected ? format(selected, 'MMM d, yyyy') : ''

  return (
    <div className="flex gap-3">
      {/* Date field */}
      <div className="relative min-w-[14rem] flex-1">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={`
                w-full flex items-center justify-between 
                rounded-md border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                px-3 py-2 text-left text-sm
                text-gray-900 dark:text-white
                placeholder:text-gray-500 dark:placeholder:text-gray-400
                focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
                transition-all duration-200
                ${
                  disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
                }
              `}
              aria-label={placeholder}
            >
              <span className={`flex items-center gap-2 ${dateText ? '' : 'text-gray-500 dark:text-gray-400'}`}>
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{dateText || 'Select date'}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          </Popover.Trigger>

          <Popover.Content
            className="z-[10000] w-auto overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0 shadow-lg"
            sideOffset={4}
            align="start"
            alignOffset={0}
          >
            <div className="p-4">
              <DayPicker
                mode="single"
                selected={selected ?? undefined}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleDateSelect}
                weekStartsOn={0}
                className="rdp"
                captionLayout="dropdown"
                formatters={{
                  formatWeekdayName: (weekday) => {
                    const names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
                    return names[weekday.getDay()]
                  }
                }}
              />
            </div>
          </Popover.Content>
        </Popover.Root>
      </div>

      {/* Time field */}
      <div className="relative w-[10.5rem]">
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedTime}
            onChange={handleTimeChange}
            disabled={disabled}
            className="
              w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700 pl-9 pr-8 py-2 text-sm
              text-gray-900 dark:text-white
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            aria-label="Select time"
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Times are local</div>
      </div>

      {/* Hidden value behaviour remains: external parent reads ISO via onChange */}
    </div>
  )
}
