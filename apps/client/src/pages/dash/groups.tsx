import * as React from 'react'
import { Chat } from '@/components/chat'
import { GroupsSidebar } from '@/components/groups-sidebar'
import { useSidebar } from '@/components/ui/sidebar'
import { useGroupsStore } from '@/store/groups'

export default function GroupsPage() {
  const { setActiveGroup } = useGroupsStore()
  const { setOpen } = useSidebar()

  React.useEffect(() => {
    // Reset the active group when navigating away from the groups page
    return () => {
      setActiveGroup(null)
    }
  }, [setActiveGroup])

  return (
    <div className="flex h-full flex-1">
      <GroupsSidebar onGroupSelect={() => setOpen(false)} />
      <div className="flex-1">
        <Chat />
      </div>
    </div>
  )
}
