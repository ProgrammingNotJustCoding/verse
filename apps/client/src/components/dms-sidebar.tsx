import * as React from 'react'
import { Plus, Search, User } from 'lucide-react'

import { useDmsStore } from '@/store/dms'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DmsSidebar({ onDmSelect }: { onDmSelect: () => void }) {
  const { dms, activeDm, setActiveDm, addDm } = useDmsStore()
  const [chatName, setChatName] = React.useState('')
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleAddChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (chatName) {
      addDm(chatName)
      setChatName('')
      setDialogOpen(false)
    }
  }

  const handleDmClick = (dm: any) => {
    setActiveDm(dm)
    onDmSelect()
  }

  const filteredDms = React.useMemo(() => {
    return dms.filter(dm => dm.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [dms, searchQuery])

  return (
    <div className="w-80 border-r bg-background p-2">
      <div className="p-2">
        <h2 className="text-lg font-semibold tracking-tight">Direct Messages</h2>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-8"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-2">
        {filteredDms.map(dm => (
          <button
            key={dm.id}
            onClick={() => handleDmClick(dm)}
            className={cn(
              'flex items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted',
              activeDm?.id === dm.id && 'bg-muted font-semibold'
            )}
          >
            <Avatar className="size-8">
              <AvatarImage src={dm.avatar} alt={dm.name} />
              <AvatarFallback>{dm.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="truncate text-sm">{dm.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {dm.messages.length > 0
                  ? dm.messages[dm.messages.length - 1].text
                  : 'No messages yet'}
              </p>
            </div>
            {dm.messages.length > 0 && (
              <time className="text-xs text-muted-foreground">
                {new Date(dm.messages[dm.messages.length - 1].timestamp).toLocaleTimeString(
                  undefined,
                  { timeStyle: 'short' }
                )}
              </time>
            )}
          </button>
        ))}
      </div>
      <div className="mt-auto p-2">
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <Button variant="outline" onClick={() => setDialogOpen(true)} className="w-full">
            <Plus className="mr-2 size-4" />
            Create Chat
          </Button>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddChat}>
              <DialogHeader>
                <DialogTitle>Create Chat</DialogTitle>
                <DialogDescription>Start a new direct message conversation.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">Chat Name</Label>
                  <Input
                    id="name"
                    value={chatName}
                    onChange={e => setChatName(e.target.value)}
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
