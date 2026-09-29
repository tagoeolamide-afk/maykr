import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Switch as RSwitch, Tabs as RTabs, Tooltip as RTooltip } from 'radix-ui'
import { initials } from '../../lib/format'
import { Icon, type IconName } from '../Icon'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* ---------- Button ---------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-fg border border-line hover:bg-hover',
  ghost: 'text-fg hover:bg-hover',
  danger: 'bg-danger-solid text-white hover:brightness-95',
  accent: 'bg-accent text-on-accent hover:bg-accent-hover',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5 rounded-[6px]',
  md: 'h-10 px-4 text-[14px] gap-2 rounded-[8px]',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: IconName
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'sm', icon, loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'tap inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Icon name="spinner" size={16} className="animate-spin" /> : icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  )
})

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string
  size?: number
  iconSize?: number
  tooltip?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = 32, iconSize = 18, tooltip = true, className, type = 'button', ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cx(
        'tap inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-fg transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  )
  return tooltip ? <Tooltip label={label}>{button}</Tooltip> : button
})

/* ---------- Tooltip ---------- */

export function Tooltip({ label, children, side = 'bottom' }: { label: string; children: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <RTooltip.Root delayDuration={400}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className="anim-fade z-50 rounded-[6px] bg-primary px-2 py-1 text-[12px] font-medium text-on-primary"
        >
          {label}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}

/* ---------- Form fields ---------- */

const controlBase =
  'w-full rounded-[8px] border border-line-control bg-surface px-3 text-[14px] text-fg placeholder:text-fg-3 outline-none transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus aria-invalid:border-danger'

type FieldProps = { label: string; hint?: string; error?: string; hideLabel?: boolean; children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode }

export function Field({ label, hint, error, hideLabel, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={cx('text-[13px] font-medium text-fg', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-[12px] text-fg-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="flex items-center gap-1 text-[12px] font-medium text-danger" role="alert">
          <Icon name="alert" size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; hideLabel?: boolean }

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, hideLabel, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} hideLabel={hideLabel}>
      {({ id, describedBy, invalid }) => (
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cx(controlBase, 'h-10', className)}
          {...rest}
        />
      )}
    </Field>
  )
})

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string; hideLabel?: boolean }

export function TextArea({ label, hint, error, hideLabel, className, ...rest }: TextAreaProps) {
  return (
    <Field label={label} hint={hint} error={error} hideLabel={hideLabel}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cx(controlBase, 'min-h-28 resize-y py-2 leading-relaxed', className)}
          {...rest}
        />
      )}
    </Field>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hideLabel?: boolean; options: { value: string; label: string }[] }

export function Select({ label, hideLabel, options, className, ...rest }: SelectProps) {
  return (
    <Field label={label} hideLabel={hideLabel}>
      {({ id }) => (
        <div className="relative">
          <select id={id} className={cx(controlBase, 'h-10 cursor-pointer appearance-none pr-9', className)} {...rest}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-2" />
        </div>
      )}
    </Field>
  )
}

/** The compact search box from the design, upsized to meet contrast/size rules. */
export function SearchInput({
  value,
  onChange,
  label,
  placeholder = 'Search',
  className,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder?: string
  className?: string
}) {
  return (
    <label
      className={cx(
        'flex h-8 items-center gap-1.5 rounded-[6px] border border-line-control bg-surface px-2.5 focus-within:border-accent focus-within:outline-2 focus-within:outline-focus',
        className,
      )}
    >
      <Icon name="search-02" size={16} className="text-fg-2" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent text-[12px] font-medium text-fg outline-none placeholder:text-fg-3"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="cursor-pointer rounded text-fg-2 hover:text-fg">
          <Icon name="cancel-01" size={14} />
        </button>
      )}
    </label>
  )
}

/* ---------- Switch ---------- */

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  hideLabel,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label: string
  description?: string
  hideLabel?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <div className={cx('flex flex-col gap-0.5', hideLabel && 'sr-only')}>
        <label htmlFor={id} className="cursor-pointer text-[14px] font-medium text-fg">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="text-[12px] text-fg-2">
            {description}
          </p>
        )}
      </div>
      <RSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={description ? `${id}-d` : undefined}
        className="tap relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-line-control bg-track transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent"
      >
        <RSwitch.Thumb className="block size-[18px] translate-x-[2px] rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-on-accent" />
      </RSwitch.Root>
    </div>
  )
}

/* ---------- Tabs ---------- */

export function Tabs({
  value,
  onValueChange,
  tabs,
  label,
  children,
  className,
}: {
  value: string
  onValueChange: (v: string) => void
  tabs: { value: string; label: string; count?: number }[]
  label: string
  children?: ReactNode
  className?: string
}) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RTabs.List aria-label={label} className="flex gap-1 border-b border-line">
        {tabs.map((t) => (
          <RTabs.Trigger
            key={t.value}
            value={t.value}
            className="tap -mb-px flex cursor-pointer items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-[13px] font-medium text-fg-2 hover:text-fg data-[state=active]:border-fg data-[state=active]:text-fg"
          >
            {t.label}
            {t.count !== undefined && (
              <span className="rounded-full bg-surface-2 px-1.5 text-[11px] text-fg-2">{t.count}</span>
            )}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {children}
    </RTabs.Root>
  )
}
export const TabPanel = RTabs.Content

/* ---------- Display ---------- */

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'danger' | 'warning' | 'accent'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-surface-2 text-fg-2',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-warning',
    accent: 'bg-accent-soft text-accent',
  }
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap', tones[tone])}>
      {children}
    </span>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-[20px] border border-line-card bg-surface p-5 shadow-card', className)}>{children}</div>
  )
}

export function ProgressBar({ value, color = 'var(--c-chart-blue)', label, className }: { value: number; color?: string; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx('h-2 w-full overflow-hidden rounded-[5px] bg-track', className)}
    >
      <div className="h-full rounded-[5px] transition-[width] duration-300" style={{ width: `${v}%`, backgroundColor: color }} />
    </div>
  )
}

export function Avatar({ name, src, size = 30 }: { name: string; src?: string; size?: number }) {
  if (src) return <img src={src} alt="" width={size} height={size} className="block shrink-0 rounded-full" style={{ width: size, height: size }} />
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent"
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
    >
      {initials(name)}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[4px] border border-line bg-surface-2 px-1.5 py-px font-sans text-[11px] font-medium text-fg-2">{children}</kbd>
  )
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={cx('skeleton', className)} style={style} />
}

/** Screen-reader announcement for loading regions. */
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondary,
  compact,
}: {
  icon: IconName
  title: string
  description: string
  action?: ReactNode
  secondary?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={cx('flex flex-col items-center text-center', compact ? 'gap-3 py-10' : 'gap-4 py-20')}>
      <span className="flex size-14 items-center justify-center rounded-[16px] border border-line-card bg-surface text-fg-2 shadow-card">
        <Icon name={icon} size={26} />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="text-[16px] font-semibold text-fg">{title}</h2>
        <p className="text-[14px] leading-relaxed text-fg-2">{description}</p>
      </div>
      {(action || secondary) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  )
}

export function ErrorState({ onRetry, what = 'this page' }: { onRetry: () => void; what?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-[16px] bg-danger-soft text-danger">
        <Icon name="alert" size={26} />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="text-[16px] font-semibold text-fg">We couldn’t load {what}</h2>
        <p className="text-[14px] text-fg-2">Check your connection and try again. Your work is saved.</p>
      </div>
      <Button variant="primary" icon="refresh" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
