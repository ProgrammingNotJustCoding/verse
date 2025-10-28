import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useDmsStore } from '@/store/dms'
import { useGroupsStore } from '@/store/groups'
import { Plus, Search, Video, Tag as TagIcon, X, Edit2, Trash2 } from 'lucide-react'

type Call = {
  id: number
  title: string
  type: 'group' | 'personal'
  participants: Array<{ id: string; name: string }>
  date: Date
  duration: string
  tags: string[]
  groupId?: string
}

const initialCallsData: Call[] = [
  {
    id: 1,
    title: 'Daily Standup',
    type: 'group',
    participants: [
      { id: 'you', name: 'You' },
      { id: '2', name: 'Alice' },
      { id: '3', name: 'Bob' },
    ],
    date: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
    duration: '15 min',
    tags: ['daily', 'team'],
  },
  {
    id: 2,
    title: 'Project Phoenix Kick-off',
    type: 'group',
    participants: [
      { id: 'you', name: 'You' },
      { id: '4', name: 'Charlie' },
      { id: '5', name: 'David' },
      { id: '6', name: 'Eve' },
    ],
    date: new Date(), // Today
    duration: '45 min',
    tags: ['project', 'kickoff', 'important'],
  },
  {
    id: 3,
    title: '1:1 with Sarah',
    type: 'personal',
    participants: [
      { id: 'you', name: 'You' },
      { id: '7', name: 'Sarah' },
    ],
    date: new Date(new Date().setDate(new Date().getDate() - 1)), // Yesterday
    duration: '30 min',
    tags: ['1:1', 'feedback'],
  },
]

function CallCard({
  call,
  onEdit,
  onDelete,
}: {
  call: Call
  onEdit: (call: Call) => void
  onDelete: (callId: number) => void
}) {
  const navigate = useNavigate()
  const { getDmByUserId, setActiveDm } = useDmsStore()

  const handleParticipantClick = (participantId: string) => {
    if (participantId === 'you') return // Don't open chat with 'You'
    const dm = getDmByUserId(participantId)
    if (dm) {
      setActiveDm(dm)
      navigate('/dash/chat')
    }
  }

  return (
    <div className="group relative z-0 flex items-center gap-4 rounded-lg border bg-card p-3 text-card-foreground shadow-sm hover:z-30">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Video className="size-5" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{call.title}</p>
          <Badge variant={call.type === 'group' ? 'default' : 'secondary'}>{call.type}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {call.participants.map(p => (
            <Badge
              key={p.id}
              variant="outline"
              onClick={() => handleParticipantClick(p.id)}
              className={p.id !== 'you' ? 'cursor-pointer hover:bg-muted' : ''}
            >
              {p.name}
            </Badge>
          ))}
        </div>
        {call.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {call.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                <TagIcon className="mr-1 size-2.5" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-medium">
            {call.date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {call.date.toLocaleTimeString(undefined, { timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(call)}>
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(call.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CallsPage() {
  const [calls, setCalls] = React.useState<Call[]>(initialCallsData)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingCall, setEditingCall] = React.useState<Call | null>(null)
  const { groups } = useGroupsStore()

  // Form state
  const [formTitle, setFormTitle] = React.useState('')
  const [formType, setFormType] = React.useState<'group' | 'personal'>('personal')
  const [formGroupId, setFormGroupId] = React.useState('')
  const [formDate, setFormDate] = React.useState('')
  const [formTime, setFormTime] = React.useState('')
  const [formDuration, setFormDuration] = React.useState('')
  const [formTagInput, setFormTagInput] = React.useState('')
  const [formTags, setFormTags] = React.useState<string[]>([])

  const resetForm = () => {
    setFormTitle('')
    setFormType('group')
    setFormGroupId('')
    setFormDate('')
    setFormTime('')
    setFormDuration('')
    setFormTagInput('')
    setFormTags([])
    setEditingCall(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (call: Call) => {
    setEditingCall(call)
    setFormTitle(call.title)
    setFormType(call.type)
    setFormGroupId(call.groupId || '')
    setFormDate(call.date.toISOString().split('T')[0])
    setFormTime(
      call.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    )
    setFormDuration(call.duration)
    setFormTags(call.tags)
    setIsDialogOpen(true)
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formTagInput.trim()) {
      e.preventDefault()
      if (!formTags.includes(formTagInput.trim())) {
        setFormTags([...formTags, formTagInput.trim()])
      }
      setFormTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormTags(formTags.filter(t => t !== tag))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formDate || !formTime) return

    const dateTime = new Date(`${formDate}T${formTime}`)

    if (editingCall) {
      // Update existing call
      setCalls(
        calls.map(call =>
          call.id === editingCall.id
            ? {
                ...call,
                title: formTitle,
                type: formType,
                groupId: formType === 'group' ? formGroupId : undefined,
                date: dateTime,
                duration: formDuration,
                tags: formTags,
              }
            : call
        )
      )
    } else {
      // Create new call
      const newCall: Call = {
        id: Date.now(),
        title: formTitle,
        type: formType,
        participants: [{ id: 'you', name: 'You' }],
        date: dateTime,
        duration: formDuration,
        tags: formTags,
        groupId: formType === 'group' ? formGroupId : undefined,
      }
      setCalls([...calls, newCall])
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDeleteCall = (callId: number) => {
    setCalls(calls.filter(call => call.id !== callId))
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }

  const allTags = React.useMemo(() => {
    const tags = new Set<string>()
    calls.forEach(call => call.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags).sort()
  }, [calls])

  const filteredAndSortedCalls = React.useMemo(() => {
    return calls.filter(call => {
      const matchesSearch =
        call.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        call.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTags =
        selectedTags.length === 0 || selectedTags.some(tag => call.tags.includes(tag))

      return matchesSearch && matchesTags
    })
  }, [calls, searchQuery, selectedTags])

  const upcomingCalls = React.useMemo(() => {
    return filteredAndSortedCalls
      .filter(call => call.date >= new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Ascending - nearest first
  }, [filteredAndSortedCalls])

  const pastCalls = React.useMemo(() => {
    return filteredAndSortedCalls
      .filter(call => call.date < new Date())
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Descending - most recent first
  }, [filteredAndSortedCalls])

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calls</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 size-4" />
                New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCall ? 'Edit Meeting' : 'New Meeting'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Enter meeting title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    value={formType}
                    onChange={e => setFormType(e.target.value as 'group' | 'personal')}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="group">Group</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                {formType === 'group' && (
                  <div>
                    <Label htmlFor="group">Select Group</Label>
                    <select
                      id="group"
                      value={formGroupId}
                      onChange={e => setFormGroupId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">-- Select a group --</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formTime}
                      onChange={e => setFormTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formDuration}
                    onChange={e => setFormDuration(e.target.value)}
                    placeholder="e.g., 30 min"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formTagInput}
                    onChange={e => setFormTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type and press Enter to add tags"
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="size-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{editingCall ? 'Update' : 'Create'} Meeting</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search calls..."
          className="pl-8"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Filter by tags:</span>
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTagFilter(tag)}
            >
              <TagIcon className="mr-1 size-3" />
              {tag}
            </Badge>
          ))}
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setSelectedTags([])}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4 overflow-auto">
        <section>
          <h2 className="mb-2 text-lg font-semibold">Upcoming</h2>
          <div className="flex flex-col gap-3">
            {upcomingCalls.length > 0 ? (
              upcomingCalls.map(call => (
                <CallCard
                  key={call.id}
                  call={call}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteCall}
                />
              ))
            ) : (
              <p className="text-muted-foreground">No upcoming meetings.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Past</h2>
          <div className="flex flex-col gap-3">
            {pastCalls.length > 0 ? (
              pastCalls.map(call => (
                <CallCard
                  key={call.id}
                  call={call}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteCall}
                />
              ))
            ) : (
              <p className="text-muted-foreground">No past meetings.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
