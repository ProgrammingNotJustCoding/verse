import { useEffect, useState, useRef } from 'react'
import { useWebSocketStore } from '../../store/chat'
import { useGroupsStore } from '../../store/groups'
import { GroupList } from '@/components/groups/GroupList'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { MeetingControls } from '@/components/meeting/MeetingControls'
import { CreateGroupDialog } from '@/components/dialog/CreateGroupDialog'
import { JoinGroupDialog } from '@/components/dialog/JoinGroupDialog'
import { Button } from '../../components/ui/button'
import { Settings, Users, Copy } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function GroupChatPage() {
  const { connect, disconnect, isConnected } = useWebSocketStore()
  const { activeGroup } = useGroupsStore()
  const hasConnected = useRef(false)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)

  useEffect(() => {
    if (!hasConnected.current) {
      connect()
      hasConnected.current = true
    }

    return () => {
      if (hasConnected.current) {
        disconnect()
        hasConnected.current = false
      }
    }
  }, [])

  const copyInviteCode = () => {
    if (activeGroup?.inviteCode) {
      navigator.clipboard.writeText(activeGroup.inviteCode)
      toast.success('Invite code copied!')
    }
  }

  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-muted/10">
        <GroupList
          onCreateClick={() => setShowCreateDialog(true)}
          onJoinClick={() => setShowJoinDialog(true)}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-lg">{activeGroup?.name || 'Select a group'}</h1>
            {!isConnected && <span className="text-xs text-muted-foreground">(offline)</span>}
          </div>

          {activeGroup && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyInviteCode}>
                <Copy className="h-4 w-4 mr-1" />
                Invite Code
              </Button>
              <Button variant="ghost" size="icon">
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <MeetingControls groupId={activeGroup?.id || null} />
        <ChatMessages groupId={activeGroup?.id || null} />
        <ChatInput groupId={activeGroup?.id || null} />
      </div>

      <CreateGroupDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <JoinGroupDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} />
    </div>
  )
}
