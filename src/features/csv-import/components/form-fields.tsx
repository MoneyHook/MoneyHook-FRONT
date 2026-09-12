import { Children, isValidElement, type ReactNode } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

export function Field({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function SelectField({
  'aria-label': ariaLabel,
  children,
  disabled,
  onValueChange,
  value,
}: {
  'aria-label'?: string
  children: ReactNode
  disabled?: boolean
  onValueChange: (value: string) => void
  value: string
}) {
  const options = Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{ value?: string; children?: ReactNode }>(child) ||
      child.type !== 'option'
    )
      return []
    return [
      { label: child.props.children, value: String(child.props.value ?? '') },
    ]
  })
  const placeholder =
    options.find((option) => option.value === '')?.label ?? '選択してください'

  return (
    <Select disabled={disabled} onValueChange={onValueChange} value={value}>
      <SelectTrigger aria-label={ariaLabel} className="h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options
          .filter((option) => option.value)
          .map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
