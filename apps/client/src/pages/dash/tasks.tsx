import * as React from 'react'
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
import { Plus, Search, Calendar, Tag, X, Trash2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

type TaskStatus = 'todo' | 'ongoing' | 'done'

type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  tags: string[]
  deadline: string | null
  createdAt: number
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  ongoing: { label: 'Ongoing', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  done: { label: 'Done', color: 'bg-green-100 text-green-800 border-green-300' },
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Review PR #234',
    description: 'Review the authentication changes',
    status: 'todo',
    tags: ['code-review', 'urgent'],
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: Date.now() - 100000,
  },
  {
    id: '2',
    title: 'Update documentation',
    description: 'Add API documentation for new endpoints',
    status: 'ongoing',
    tags: ['docs', 'backend'],
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: Date.now() - 200000,
  },
  {
    id: '3',
    title: 'Fix login bug',
    description: 'Users cannot login with special characters',
    status: 'done',
    tags: ['bug', 'frontend'],
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: Date.now() - 300000,
  },
]

type SortOption = 'deadline' | 'created' | 'title'

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<SortOption>('deadline')
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<Task | null>(null)

  // Form state
  const [formTitle, setFormTitle] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formDeadline, setFormDeadline] = React.useState('')
  const [formTagInput, setFormTagInput] = React.useState('')
  const [formTags, setFormTags] = React.useState<string[]>([])

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormDeadline('')
    setFormTagInput('')
    setFormTags([])
    setEditingTask(null)
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setFormTitle(task.title)
    setFormDescription(task.description)
    setFormDeadline(task.deadline || '')
    setFormTags(task.tags)
    setIsAddDialogOpen(true)
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
    if (!formTitle.trim()) return

    if (editingTask) {
      // Update existing task
      setTasks(
        tasks.map(task =>
          task.id === editingTask.id
            ? {
                ...task,
                title: formTitle,
                description: formDescription,
                deadline: formDeadline || null,
                tags: formTags,
              }
            : task
        )
      )
    } else {
      // Create new task
      const newTask: Task = {
        id: Date.now().toString(),
        title: formTitle,
        description: formDescription,
        status: 'todo',
        tags: formTags,
        deadline: formDeadline || null,
        createdAt: Date.now(),
      }
      setTasks([...tasks, newTask])
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const filteredTasks = React.useMemo(() => {
    return tasks.filter(
      task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [tasks, searchQuery])

  const sortedTasks = React.useMemo(() => {
    const sorted = [...filteredTasks]
    switch (sortBy) {
      case 'deadline':
        return sorted.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        })
      case 'created':
        return sorted.sort((a, b) => b.createdAt - a.createdAt)
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return sorted
    }
  }, [filteredTasks, sortBy])

  const tasksByStatus = React.useMemo(() => {
    return {
      todo: sortedTasks.filter(t => t.status === 'todo'),
      ongoing: sortedTasks.filter(t => t.status === 'ongoing'),
      done: sortedTasks.filter(t => t.status === 'done'),
    }
  }, [sortedTasks])

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 size-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Enter task title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Enter task description"
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
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
                      setIsAddDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{editingTask ? 'Update' : 'Add'} Task</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Sort by:</Label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="deadline">Deadline</option>
            <option value="created">Created</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      <div className="grid flex-1 gap-4 overflow-auto md:grid-cols-3">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <TaskColumn
            key={status}
            status={status as TaskStatus}
            tasks={statusTasks}
            onStatusChange={handleStatusChange}
            onEdit={openEditDialog}
            onDelete={handleDeleteTask}
          />
        ))}
      </div>
    </div>
  )
}

function TaskColumn({
  status,
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  status: TaskStatus
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  const config = statusConfig[status]

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{config.label}</h2>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No tasks</p>
        )}
      </div>
    </div>
  )
}

function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  task: Task
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

  return (
    <div className="group relative z-0 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md hover:z-30">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3
          className="flex-1 cursor-pointer font-medium leading-tight hover:text-primary"
          onClick={() => onEdit(task)}
        >
          {task.title}
        </h3>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <ChevronDown className="size-4" />
          </Button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-50 w-40 rounded-md border bg-popover p-1 shadow-lg">
                {(['todo', 'ongoing', 'done'] as TaskStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusChange(task.id, status)
                      setIsMenuOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent',
                      task.status === status && 'bg-accent'
                    )}
                  >
                    Move to {statusConfig[status].label}
                  </button>
                ))}
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={() => {
                    onDelete(task.id)
                    setIsMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
                >
                  <Trash2 className="size-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {task.description && <p className="mb-2 text-sm text-muted-foreground">{task.description}</p>}

      {task.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="mr-1 size-2.5" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {task.deadline && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          <span className={cn(isOverdue && 'font-semibold text-destructive')}>
            {new Date(task.deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {isOverdue && ' (Overdue)'}
          </span>
        </div>
      )}
    </div>
  )
}
