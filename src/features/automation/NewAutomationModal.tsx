import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/ui/overlays'
import { Button, cx, TextField } from '../../components/ui/primitives'
import { navigate } from '../../lib/router'
import { useStore } from '../../lib/store'
import type { ActionId, TriggerId } from '../../lib/types'
import { toast } from '../../lib/ui-store'
import { actions, describe, templates, triggers } from './catalog'

const steps = ['Trigger', 'Action', 'Review'] as const

function OptionCards<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string
  value: T | ''
  onChange: (v: T) => void
  options: Record<T, { label: string; description: string; icon: Parameters<typeof Icon>[0]['name'] }>
}) {
  return (
    <fieldset>
      <legend className="sr-only">{name}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(options) as T[]).map((key) => {
          const o = options[key]
          const selected = value === key
          return (
            <label
              key={key}
              className={cx(
                'flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
                selected ? 'border-fg bg-hover' : 'border-line hover:bg-hover',
              )}
            >
              <input type="radio" name={name} checked={selected} onChange={() => onChange(key)} className="sr-only" />
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface-2">
                <Icon name={o.icon} size={16} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[14px] font-medium">{o.label}</span>
                <span className="text-[12px] text-fg-2">{o.description}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function NewAutomationModal({ open, onOpenChange, template }: { open: boolean; onOpenChange: (o: boolean) => void; template?: keyof typeof templates }) {
  const createAutomation = useStore((s) => s.createAutomation)
  const userEmail = useStore((s) => s.user?.email ?? '')
  const [step, setStep] = useState(0)
  const [trigger, setTrigger] = useState<TriggerId | ''>('')
  const [action, setAction] = useState<ActionId | ''>('')
  const [target, setTarget] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const t = template ? templates[template] : null
    setStep(t ? 2 : 0)
    setTrigger(t?.trigger ?? '')
    setAction(t?.action ?? '')
    setTarget(t ? t.target || userEmail : '')
    setName(t?.name ?? '')
    setError('')
  }, [open, template, userEmail])

  const canNext = (step === 0 && trigger) || (step === 1 && action) || step === 2

  const create = () => {
    if (!trigger || !action) return
    if (!name.trim()) return setError('Give this automation a name')
    const a = createAutomation({ name: name.trim(), trigger, action, target: target.trim() })
    onOpenChange(false)
    navigate(`/automation/${a.id}`)
    toast(`“${a.name}” is on`, { tone: 'success' })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New automation"
      width={600}
      footerStart={step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          {step < 2 ? (
            <Button
              variant="primary"
              disabled={!canNext}
              onClick={() => {
                if (step === 1 && action === 'notify-email' && !target) setTarget(userEmail)
                setStep(step + 1)
              }}
            >
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={create}>
              Turn on automation
            </Button>
          )}
        </>
      }
    >
      <ol className="mb-6 flex items-center gap-2" aria-label="Steps">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span
              className={cx(
                'flex size-6 items-center justify-center rounded-full text-[12px] font-semibold',
                i < step ? 'bg-primary text-on-primary' : i === step ? 'border-2 border-fg text-fg' : 'border border-line-control text-fg-2',
              )}
            >
              {i < step ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className={cx('text-[13px] font-medium', i === step ? 'text-fg' : 'text-fg-2')}>{s}</span>
            {i < steps.length - 1 && <span aria-hidden className="mx-1 h-px w-6 bg-line-control" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <h3 className="mb-3 text-[14px] font-medium">When should this run?</h3>
          <OptionCards name="Trigger" value={trigger} onChange={setTrigger} options={triggers} />
        </>
      )}
      {step === 1 && (
        <>
          <h3 className="mb-3 text-[14px] font-medium">What should happen?</h3>
          <OptionCards name="Action" value={action} onChange={setAction} options={actions} />
        </>
      )}
      {step === 2 && trigger && action && (
        <div className="flex flex-col gap-5">
          <div className="rounded-[10px] bg-surface-2 p-4 text-[14px] leading-relaxed">
            <p className="font-medium">{describe(trigger, action, target)}</p>
          </div>
          <TextField label="Name" value={name} onChange={(e) => (setName(e.target.value), setError(''))} error={error} placeholder="e.g. Tag research notes" />
          <TextField label={actions[action].targetLabel} value={target} onChange={(e) => setTarget(e.target.value)} placeholder={actions[action].targetPlaceholder} />
        </div>
      )}
    </Modal>
  )
}
