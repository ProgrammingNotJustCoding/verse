import * as React from 'react'
import { Plus, Search } from 'lucide-react'

import { useGroupsStore } from '@/store/groups'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

export function GroupsSidebar({ onGroupSelect }: { onGroupSelect: () => void }) {
  const { groups, activeGroup, setActiveGroup, addGroup } = useGroupsStore()
  const [groupName, setGroupName] = React.useState('')
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault()
    if (groupName) {
      // Create a proper Group object
      const newGroup = {
        id: `group-${Date.now()}`,
        name: groupName,
        inviteCode: `invite-${Date.now()}`,
        createdBy: 'current-user', // TODO: Get from auth context
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      }
      addGroup(newGroup)
      setGroupName('')
      setDialogOpen(false)
    }
  }

  const handleGroupClick = (group: any) => {
    setActiveGroup(group)
    onGroupSelect()
  }

  const filteredGroups = React.useMemo(() => {
    return groups.filter(group => group.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [groups, searchQuery])

  return (
    <div className="w-80 border-r bg-background p-2">
      <div className="p-2">
        <h2 className="text-lg font-semibold tracking-tight">Groups</h2>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter groups..."
            className="pl-8"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-2">
        {filteredGroups.map(group => (
          <button
            key={group.id}
            onClick={() => handleGroupClick(group)}
            className={cn(
              'flex items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted',
              activeGroup?.id === group.id && 'bg-muted font-semibold'
            )}
          >
            <Avatar className="size-8">
              <AvatarFallback>{group.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="truncate text-sm">{group.name}</p>
              <p className="truncate text-xs text-muted-foreground">No messages yet</p>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-auto p-2">
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <Button variant="outline" onClick={() => setDialogOpen(true)} className="w-full">
            <Plus className="mr-2 size-4" />
            Create Group
          </Button>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddGroup}>
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
                <DialogDescription>Create a new group to start collaborating.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="e.g., Engineering"
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
