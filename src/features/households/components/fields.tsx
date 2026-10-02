import type {
  ChangeEvent,
  ComponentProps,
  ReactElement,
  ReactNode,
} from 'react'
import { Children, cloneElement, isValidElement } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'

export function FamilyField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const id = `family-field-${label.replace(/[^\p{L}\p{N}]+/gu, '-')}`
  const control = isValidElement(children)
    ? cloneElement(children, { id } as { id: string })
    : children

  return (
    <div className="grid gap-2 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      {control}
    </div>
  )
}
const EMPTY_OPTION_VALUE = '__family_select_empty__'

type FamilySelectProps = Omit<ComponentProps<'select'>, 'onChange'> & {
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}

type OptionProps = ComponentProps<'option'>

export function FamilySelect({
  children,
  className,
  defaultValue,
  onChange,
  value,
  ...props
}: FamilySelectProps) {
  const options = Children.toArray(children).filter(isValidElement) as Array<
    ReactElement<OptionProps>
  >
  const emptyOption = options.find((option) => option.props.value === '')
  const initialValue = value ?? defaultValue
  const toSelectValue = (optionValue: string) =>
    optionValue === '' ? EMPTY_OPTION_VALUE : optionValue

  return (
    <Select
      defaultValue={
        value === undefined
          ? String(initialValue ?? '') === ''
            ? ''
            : toSelectValue(String(initialValue))
          : undefined
      }
      disabled={props.disabled}
      name={props.name}
      onValueChange={(selectedValue) => {
        const nextValue =
          selectedValue === EMPTY_OPTION_VALUE ? '' : selectedValue
        onChange?.({
          currentTarget: { value: nextValue },
          target: { value: nextValue },
        } as unknown as ChangeEvent<HTMLSelectElement>)
      }}
      required={props.required}
      value={
        value === undefined
          ? undefined
          : String(value) === ''
            ? ''
            : toSelectValue(String(value))
      }
    >
      <SelectTrigger
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        className={cn('h-10 w-full', className)}
        id={props.id}
      >
        <SelectValue
          placeholder={emptyOption?.props.children ?? '選択してください'}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((option, index) => {
          const optionValue = String(option.props.value ?? '')
          return (
            <SelectItem
              disabled={option.props.disabled}
              key={option.key ?? `${optionValue}-${index}`}
              value={toSelectValue(optionValue)}
            >
              {option.props.children}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
export function FamilyError({ error }: { error: unknown }) {
  return error ? (
    <p role="alert" className="text-sm text-destructive">
      {error instanceof Error
        ? error.message
        : '読み込みに失敗しました。再読み込みしてください。'}
    </p>
  ) : null
}
