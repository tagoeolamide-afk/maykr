import { useRef, useState, type FormEvent } from 'react'
import logo from '../../assets/logo.svg'
import { Icon } from '../../components/Icon'
import { Button, Field, TextField } from '../../components/ui/primitives'
import { isEmail } from '../../lib/format'
import { useDocumentTitle } from '../../lib/hooks'
import { useStore } from '../../lib/store'

/** Logo plus a centred sign-in card. Demo only: any valid email and 8+ character password works. */
export function LoginView() {
  useDocumentTitle('Log in')
  const login = useStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!isEmail(email)) next.email = 'Enter a valid email address'
    if (password.length < 8) next.password = 'Password must be at least 8 characters'
    setErrors(next)
    if (Object.keys(next).length) {
      ;(next.email ? emailRef : passwordRef).current?.focus()
      return
    }
    setLoading(true)
    setTimeout(() => login(email.trim()), 600)
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-bg px-4 py-10">
      <div className="flex items-center gap-[6px]">
        <img src={logo} alt="" width={25.0006} height={26.6133} className="block" />
        <span className="text-[20px] leading-[26px] font-bold tracking-[-0.4px]">Mayker</span>
      </div>

      <section
        aria-labelledby="login-title"
        className="w-full max-w-[400px] rounded-[12px] border border-line-card bg-surface p-8 shadow-card"
      >
        <h1 id="login-title" className="text-[22px] leading-[30px] font-medium tracking-[-0.66px]">
          Log in
        </h1>
        <p className="mt-1 text-[14px] text-fg-2">Welcome back. Enter your details to continue.</p>

        <form onSubmit={submit} className="mt-7 flex flex-col gap-5" noValidate>
          <TextField
            ref={emailRef}
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="name@company.com"
          />
          <Field label="Password" error={errors.password}>
            {({ id, describedBy, invalid }) => (
              <div className="relative">
                <input
                  ref={passwordRef}
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-[8px] border border-line-control bg-surface pr-11 pl-3 text-[14px] text-fg placeholder:text-fg-3 focus:border-accent aria-invalid:border-danger"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  aria-pressed={show}
                  className="tap absolute top-1/2 right-1 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[6px] text-fg-2 hover:bg-hover hover:text-fg"
                >
                  <Icon name={show ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
            )}
          </Field>
          <Button type="submit" variant="primary" size="md" loading={loading} className="mt-1 w-full">
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
        <p className="mt-5 text-center text-[12px] text-fg-2">Demo: any email and a password of 8+ characters.</p>
      </section>
    </main>
  )
}
