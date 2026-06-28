'use client';

import { useState, useRef, useEffect } from 'react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
}

export function DatePicker({ value, onChange, placeholder = 'Select date', align = 'left' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const selectedDate = value ? new Date(value) : null;

  const handleSelect = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formatted = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    onChange(formatted);
    setOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      const isSelected = selectedDate?.toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleSelect(day)}
          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-foreground text-background font-medium'
              : isToday
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="modal-input flex items-center justify-between gap-2 text-left w-full"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{value || placeholder}</span>
        <span className="material-icons-outlined text-muted-foreground flex-shrink-0" style={{ fontSize: 16 }}>
          calendar_today
        </span>
      </button>

      {open && (
        <div className={`absolute mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 p-3 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-muted rounded-lg">
              <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            <div className="flex items-center gap-1">
              <select
                value={viewDate.getMonth()}
                onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer hover:text-foreground"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                value={viewDate.getFullYear()}
                onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
                className="bg-transparent text-sm font-medium outline-none cursor-pointer hover:text-foreground"
              >
                {Array.from({ length: 10 }, (_, i) => viewDate.getFullYear() - 5 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-muted rounded-lg">
              <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="w-8 h-6 flex items-center justify-center text-xs text-muted-foreground font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
}
