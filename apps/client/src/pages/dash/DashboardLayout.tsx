import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useGroupsStore } from '@/store/groups'
import { useDmsStore } from '@/store/dms'
import { useSidebarStore } from '@/store/sidebar'

export default function DashboardLayout() {
  const { activeOrg, activeNavItem } = useSidebarStore()
  const { activeGroup } = useGroupsStore()
  const { activeDm } = useDmsStore()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  const isGroupsActive = activeNavItem?.title === 'Groups'
  const isChatActive = activeNavItem?.title === 'Chat'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">{activeOrg?.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {isGroupsActive && activeGroup ? (
                  <>
                    <BreadcrumbLink href="/dash/groups">{activeNavItem?.title}</BreadcrumbLink>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeGroup.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : isChatActive && activeDm ? (
                  <>
                    <BreadcrumbLink href="/dash/chat">{activeNavItem?.title}</BreadcrumbLink>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeDm.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbPage>{activeNavItem?.title}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
