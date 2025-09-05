import React, { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Calendar, Clock } from 'lucide-react'
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

const OPTIONS = timeOptions(15)

export function DateTimePicker({ name, value, onChange, placeholder = 'Select date and time', disabled = false }) {
  const initialDate = useMemo(() => toDate(value), [value])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(initialDate)

  const selectedTime = useMemo(() => {
    if (!selected) return ''
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
      return
    }
    // keep existing time when changing date
    const base = selected || new Date()
    const withTime = setMinutes(setHours(d, base.getHours()), base.getMinutes())
    applyChange(withTime)
  }

  const handleTimeChange = (e) => {
    const val = e.target.value
    if (!selected) {
      // if no date yet, use today as base
      const now = new Date()
      const [h, m] = val.split(':').map((x) => parseInt(x, 10))
      const withTime = setMinutes(setHours(now, h), m)
      applyChange(withTime)
      return
    }
    const [h, m] = val.split(':').map((x) => parseInt(x, 10))
    const withTime = setMinutes(setHours(selected, h), m)
    applyChange(withTime)
  }

  const display = selected ? format(selected, 'MMM d, yyyy h:mm aa') : ''

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`w-full inline-flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'
          } border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
          aria-label={placeholder}
        >
          <span className={`truncate ${display ? '' : 'text-gray-500 dark:text-gray-400'}`}>
            {display || placeholder}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <Calendar className="w-4 h-4" />
            <Clock className="w-4 h-4" />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Content
        className="z-[10000] w-[320px] sm:w-[520px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-3"
        sideOffset={6}
        collisionPadding={10}
      >
        <div className="flex gap-3">
          <DayPicker
            mode="single"
            selected={selected ?? undefined}
            onSelect={handleDateSelect}
            weekStartsOn={0}
            className="rdp"
          />
          <div className="w-28">
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Time</label>
            <select
              value={selectedTime}
              onChange={handleTimeChange}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex justify-between mt-2 gap-2">
              <button
                type="button"
                onClick={() => applyChange(new Date())}
                className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => applyChange(null)}
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}

