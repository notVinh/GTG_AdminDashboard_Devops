import React, { useState, useEffect } from 'react';

interface TimeInputProps {
  value: string; // HH:mm format
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimeInput({
  value,
  onChange,
  placeholder = "Giờ : Phút",
  disabled = false,
  className = "",
}: TimeInputProps) {
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');

  // Parse value khi component mount hoặc value thay đổi từ bên ngoài
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setHours(h || '');
      setMinutes(m || '');
    } else if (!value) {
      setHours('');
      setMinutes('');
    }
  }, [value]);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Chỉ cho phép số

    // Giới hạn 2 chữ số
    if (val.length > 2) {
      val = val.slice(0, 2);
    }

    // Giới hạn giá trị 0-23
    let numVal = parseInt(val, 10);
    if (numVal > 23) {
      val = '23';
    }

    setHours(val);

    // Emit value raw, không pad
    if (val || minutes) {
      onChange(`${val}:${minutes}`);
    } else {
      onChange('');
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');

    // Giới hạn 2 chữ số
    if (val.length > 2) {
      val = val.slice(0, 2);
    }

    // Giới hạn giá trị 0-59
    let numVal = parseInt(val, 10);
    if (numVal > 59) {
      val = '59';
    }

    setMinutes(val);

    // Emit value raw, không pad
    if (hours || val) {
      onChange(`${hours}:${val}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={hours}
        onChange={handleHoursChange}
        disabled={disabled}
        placeholder="HH"
        maxLength={2}
        className="w-14 px-2 py-2 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
      />
      <span className="text-gray-500 font-semibold">:</span>
      <input
        type="text"
        inputMode="numeric"
        value={minutes}
        onChange={handleMinutesChange}
        disabled={disabled}
        placeholder="MM"
        maxLength={2}
        className="w-14 px-2 py-2 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
      />
    </div>
  );
}
