import { useEffect } from 'react'
import { useGroups } from '../../hooks/useGroups'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Skeleton } from '../ui/skeleton'
import { Hash, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

interface GroupListProps {
  onCreateClick: () => void
  onJoinClick: () => void
}

export function GroupList({ onCreateClick, onJoinClick }: GroupListProps) {
  const { groups, activeGroup, isLoading, fetchGroups, setActiveGroup } = useGroups()

  useEffect(() => {
    fetchGroups()
  }, [])

  if (isLoading && groups.length === 0) {
    return (
      <div className="space-y-2 p-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-2">Groups</h2>
        <div className="flex gap-2">
          <Button onClick={onCreateClick} size="sm" className="flex-1">
            <Plus className="h-4 w-4 mr-1" />
            Create
          </Button>
          <Button onClick={onJoinClick} size="sm" variant="outline" className="flex-1">
            Join
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No groups yet. Create or join one!
            </div>
          ) : (
            groups.map(group => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                  'hover:bg-accent',
                  activeGroup?.id === group.id && 'bg-accent'
                )}
              >
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{group.name}</span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
