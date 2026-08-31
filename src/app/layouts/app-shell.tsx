import {
  ArrowLeftRight,
  ChartPie,
  House,
  LogOut,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth'
import { Brand } from '@/shared/components/brand'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/shared/components/ui/sidebar'

type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

const navigationItems: NavigationItem[] = [
  { label: 'ホーム', path: '/app/home', icon: House },
  { label: '取引', path: '/app/transactions', icon: ArrowLeftRight },
  { label: '分析', path: '/app/analysis', icon: ChartPie },
  { label: '設定', path: '/app/settings', icon: Settings },
]

function isNavigationItemActive(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

function SidebarAccountMenu() {
  const { user, signOut } = useAuth()
  const initial = useMemo(() => {
    const source = user?.displayName?.trim() || user?.email?.trim() || 'M'
    return source.slice(0, 1).toUpperCase()
  }, [user])

  const handleSignOut = () => {
    void signOut().catch(() => {
      toast.error('ログアウトできませんでした。もう一度お試しください。')
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          aria-label="アカウントメニューを開く"
          className="h-12 group-data-[collapsible=icon]:justify-center"
          size="lg"
        >
          <Avatar>
            {user?.photoURL ? (
              <AvatarImage alt="" referrerPolicy="no-referrer" src={user.photoURL} />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate font-medium">
              {user?.displayName || 'MoneyHooksユーザー'}
            </span>
          </span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="space-y-1">
          <span className="block truncate font-medium">
            {user?.displayName || 'MoneyHooksユーザー'}
          </span>
          {user?.email ? (
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} variant="destructive">
          <LogOut aria-hidden="true" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b px-3">
        <Brand className="group-data-[collapsible=icon]:[&_span:last-child]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-2 py-5">
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = isNavigationItemActive(pathname, item.path)
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <NavLink
                        aria-current={isActive ? 'page' : undefined}
                        to={item.path}
                      >
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarAccountMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function MobileNavigation({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface-elevated/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {navigationItems.map((item) => {
          const isActive = isNavigationItemActive(pathname, item.path)
          const Icon = item.icon
          return (
            <li key={item.path}>
              <NavLink
                aria-current={isActive ? 'page' : undefined}
                className={({ isPending }) =>
                  [
                    'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[0.7rem] font-medium transition-colors',
                    isActive
                      ? 'text-primary after:absolute after:inset-x-5 after:top-0 after:h-0.5 after:rounded-full after:bg-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isPending ? 'opacity-60' : '',
                  ].join(' ')
                }
                to={item.path}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function FloatingControls() {
  const { state } = useSidebar()
  const triggerPosition =
    state === 'expanded'
      ? 'md:left-[calc(var(--sidebar-width)+0.75rem)]'
      : 'md:left-[calc(var(--sidebar-width-icon)+0.75rem)]'

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <SidebarTrigger
        aria-label="サイドバーを切り替える"
        className={cn(
          'pointer-events-auto fixed top-4 hidden rounded-full shadow-sm transition-[left,background-color] duration-200 hover:bg-muted md:inline-flex',
          triggerPosition,
        )}
      />
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const isTransactionComposer = location.pathname === '/app/transactions/new'

  return (
    <SidebarProvider>
      <a
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
        href="#main-content"
      >
        本文へ移動
      </a>

      <FloatingControls />
      <DesktopSidebar pathname={location.pathname} />
      <SidebarInset id="main-content" tabIndex={-1}>
        <Outlet />
        {!isTransactionComposer ? <MobileNavigation pathname={location.pathname} /> : null}
      </SidebarInset>
    </SidebarProvider>
  )
}
