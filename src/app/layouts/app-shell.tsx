import {
  ArrowLeftRight,
  ChartPie,
  Check,
  House,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth'
import { Brand } from '@/shared/components/brand'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Separator } from '@/shared/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
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

function ThemeMenu() {
  const { setTheme, theme = 'system' } = useTheme()
  const themeOptions = [
    { value: 'light', label: 'ライト', icon: Sun },
    { value: 'dark', label: 'ダーク', icon: Moon },
    { value: 'system', label: 'システム', icon: Monitor },
  ] as const

  const SelectedIcon =
    themeOptions.find((option) => option.value === theme)?.icon ?? Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="表示テーマを変更" size="icon" variant="ghost">
          <SelectedIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>表示テーマ</DropdownMenuLabel>
        <DropdownMenuRadioGroup onValueChange={setTheme} value={theme}>
          {themeOptions.map((option) => {
            const Icon = option.icon
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Icon aria-hidden="true" />
                {option.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
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
        <Button
          aria-label="アカウントメニューを開く"
          className="rounded-full"
          size="icon"
          variant="ghost"
        >
          <Avatar size="sm">
            {user?.photoURL ? (
              <AvatarImage alt="" referrerPolicy="no-referrer" src={user.photoURL} />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
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
                        {isActive ? (
                          <Check
                            aria-hidden="true"
                            className="ml-auto group-data-[collapsible=icon]:hidden"
                          />
                        ) : null}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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

export function AppShell() {
  const location = useLocation()
  const currentNavigation =
    navigationItems.find((item) =>
      isNavigationItemActive(location.pathname, item.path),
    ) ?? navigationItems[0]

  return (
    <SidebarProvider>
      <a
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
        href="#main-content"
      >
        本文へ移動
      </a>

      <DesktopSidebar pathname={location.pathname} />
      <SidebarInset id="main-content" tabIndex={-1}>
        <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background/92 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="hidden md:inline-flex" />
            <Separator className="hidden h-5 md:block" orientation="vertical" />
            <Brand className="md:hidden" />
            <p className="hidden truncate text-sm font-medium md:block">
              {currentNavigation.label}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeMenu />
            <UserMenu />
          </div>
        </header>

        <Outlet />
        <MobileNavigation pathname={location.pathname} />
      </SidebarInset>
    </SidebarProvider>
  )
}
