import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/overlays'
import { Button, TextArea, TextField } from '../../components/ui/primitives'
import { isEmail } from '../../lib/format'
import { useStore } from '../../lib/store'
import type { ID } from '../../lib/types'
import { toast } from '../../lib/ui-store'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  draftId?: ID
  to?: string
  subject?: string
  body?: string
}

export function ComposeModal({ open, onOpenChange, draftId, ...initial }: Props) {
  const sendEmail = useStore((s) => s.sendEmail)
  const saveDraft = useStore((s) => s.saveDraft)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<{ to?: string; subject?: string }>({})

  useEffect(() => {
    if (!open) return
    setTo(initial.to ?? '')
    setSubject(initial.subject ?? '')
    setBody(initial.body ?? '')
    setErrors({})
  }, [open, draftId])

  const recipients = to.split(',').map((s) => s.trim()).filter(Boolean)
  const dirty = !!(to || subject || body) && (to !== (initial.to ?? '') || subject !== (initial.subject ?? '') || body !== (initial.body ?? ''))

  const send = () => {
    const e: typeof errors = {}
    if (!recipients.length) e.to = 'Add at least one recipient'
    else if (!recipients.every(isEmail)) e.to = 'Check the email addresses — separate several with commas'
    if (!subject.trim()) e.subject = 'Add a subject'
    setErrors(e)
    if (Object.keys(e).length) return
    sendEmail({ to: recipients.join(', '), subject: subject.trim(), body }, draftId)
    onOpenChange(false)
    toast('Email sent', { tone: 'success' })
  }

  const close = (o: boolean) => {
    if (!o && dirty) {
      saveDraft({ to, subject, body }, draftId)
      toast('Saved to drafts')
    }
    onOpenChange(o)
  }

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={draftId ? 'Edit draft' : 'New email'}
      width={600}
      footerStart={<p className="text-[12px] text-fg-2">Closing saves a draft.</p>}
      footer={
        <>
          <Button onClick={() => close(false)}>{dirty ? 'Save draft' : 'Cancel'}</Button>
          <Button variant="primary" icon="sent" onClick={send}>
            Send
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        noValidate
      >
        <TextField label="To" type="email" multiple value={to} onChange={(e) => setTo(e.target.value)} error={errors.to} autoFocus placeholder="name@company.com" />
        <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} />
        <TextArea label="Message" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-48" />
      </form>
    </Modal>
  )
}
