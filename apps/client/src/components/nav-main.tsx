'use client'
import { Link } from 'react-router-dom'
import { useSidebarStore } from '@/store/sidebar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

export function NavMain() {
  const { navItems, activeNavItem, setActiveNavItem } = useSidebarStore()

  return (
    <SidebarMenu className="pl-2">
      {navItems.map(item => (
        <SidebarMenuItem key={item.title}>
          <Link to={item.url}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={activeNavItem?.title === item.title}
              onClick={() => setActiveNavItem(item)}
            >
              {item.icon && <item.icon className="text-primary" />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
