import { useSidebarStore } from '@/store/sidebar'

function SampleContent({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-card text-card-foreground border shadow-md aspect-video rounded-xl p-4">
          <h3 className="text-lg font-semibold">{title} - Card 1</h3>
          <p className="text-sm text-muted-foreground">Sample data for {title}</p>
        </div>
        <div className="bg-card text-card-foreground border shadow-md aspect-video rounded-xl p-4">
          <h3 className="text-lg font-semibold">{title} - Card 2</h3>
          <p className="text-sm text-muted-foreground">Sample data for {title}</p>
        </div>
        <div className="bg-card text-card-foreground border shadow-md aspect-video rounded-xl p-4">
          <h3 className="text-lg font-semibold">{title} - Card 3</h3>
          <p className="text-sm text-muted-foreground">Sample data for {title}</p>
        </div>
      </div>
      <div className="bg-card text-card-foreground border shadow-md min-h-[100vh] flex-1 rounded-xl p-4 md:min-h-min">
        <h3 className="text-lg font-semibold">{title} - Main Content</h3>
        <p className="text-sm text-muted-foreground">Sample data for {title}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { activeNavItem } = useSidebarStore()

  return activeNavItem ? <SampleContent title={activeNavItem.title} /> : null
}
