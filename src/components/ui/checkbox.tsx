import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ onCheckedChange, className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={
        [
          'h-4 w-4 rounded border border-input text-primary',
          'focus:ring-2 focus:ring-offset-2 focus:ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className || '',
        ].join(' ')
      }
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  );
}

export default Checkbox;


