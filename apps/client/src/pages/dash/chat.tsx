import { Chat } from '@/components/chat'
import { DmsSidebar } from '@/components/dms-sidebar'
import { useSidebar } from '@/components/ui/sidebar'

export default function ChatPage() {
  const { setOpen } = useSidebar()

  return (
    <div className="flex h-full flex-1">
      <DmsSidebar onDmSelect={() => setOpen(false)} />
      <div className="flex-1">
        <Chat />
      </div>
    </div>
  )
}