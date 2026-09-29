import { useState } from 'react'
import { timeAgo } from '../../lib/format'
import { navigate } from '../../lib/router'
import { useStore } from '../../lib/store'
import type { NotificationKind } from '../../lib/types'
import { useUI } from '../../lib/ui-store'
import { Icon, type IconName } from '../Icon'
import { Sheet } from '../ui/overlays'
import { Button, cx, EmptyState, IconButton, TabPanel, Tabs } from '../ui/primitives'

const kindIcon: Record<NotificationKind, IconName> = {
  share: 'share-08',
  automation: 'workflow',
  email: 'mails',
  system: 'info',
}

export function NotificationsPanel() {
  const open = useUI((s) => s.notificationsOpen)
  const setOpen = useUI((s) => s.setNotificationsOpen)
  const notifications = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markNotificationRead)
  const markAll = useStore((s) => s.markAllNotificationsRead)
  const [tab, setTab] = useState('all')

  const unread = notifications.filter((n) => !n.read)
  const list = tab === 'unread' ? unread : notifications

  return (
    <Sheet open={open} onOpenChange={setOpen} side="left" title="Notifications" width={400}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-[18px] font-medium">Notifications</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" disabled={!unread.length} onClick={markAll}>
              Mark all read
            </Button>
            <IconButton icon="cancel-01" label="Close notifications" onClick={() => setOpen(false)} />
          </div>
        </div>
        <Tabs
          value={tab}
          onValueChange={setTab}
          label="Filter notifications"
          tabs={[
            { value: 'all', label: 'All', count: notifications.length },
            { value: 'unread', label: 'Unread', count: unread.length },
          ]}
          className="flex min-h-0 flex-1 flex-col px-4"
        >
          {['all', 'unread'].map((v) => (
            <TabPanel key={v} value={v} className="-mx-2 min-h-0 flex-1 overflow-y-auto rounded-[8px] py-2">
              {list.length === 0 ? (
                <EmptyState
                  compact
                  icon="check-circle"
                  title="You’re all caught up"
                  description={tab === 'unread' ? 'No unread notifications.' : 'New activity in your workspace will show up here.'}
                />
              ) : (
                <ul className="flex flex-col">
                  {list.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          markRead(n.id)
                          if (n.href) {
                            setOpen(false)
                            navigate(n.href)
                          }
                        }}
                        className="flex w-full cursor-pointer items-start gap-3 rounded-[10px] p-3 text-left hover:bg-hover"
                      >
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-2">
                          <Icon name={kindIcon[n.kind]} size={16} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className={cx('text-[14px]', n.read ? 'font-medium text-fg-2' : 'font-semibold text-fg')}>{n.title}</span>
                          <span className="text-[13px] text-fg-2">{n.body}</span>
                          <span className="text-[12px] text-fg-3">{timeAgo(n.at)}</span>
                        </span>
                        {!n.read && (
                          <span className="mt-2 size-2 shrink-0 rounded-full bg-accent">
                            <span className="sr-only">Unread</span>
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </Sheet>
  )
}
