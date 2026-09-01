import {
  Baby,
  BriefcaseBusiness,
  Car,
  CircleDollarSign,
  Coffee,
  Cross,
  Gift,
  GraduationCap,
  HandCoins,
  House,
  Landmark,
  Lightbulb,
  MoreHorizontal,
  Plane,
  ReceiptText,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tags,
  Ticket,
  TrainFront,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

export type CategoryPresentation = {
  icon: LucideIcon
  iconClassName: string
  dotClassName: string
  selectionClassName: string
}

const defaultCategoryPresentation: CategoryPresentation = {
  icon: Tags,
  iconClassName: 'bg-muted text-muted-foreground',
  dotClassName: 'bg-muted-foreground',
  selectionClassName: 'bg-primary/10',
}

const incomeCategoryPresentation: CategoryPresentation = {
  icon: CircleDollarSign,
  iconClassName: 'bg-income/12 text-income',
  dotClassName: 'bg-income',
  selectionClassName: 'bg-income/10',
}

const categoryPresentations: Record<string, CategoryPresentation> = {
  食費: { icon: Utensils, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning', selectionClassName: 'bg-warning/10' },
  外食: { icon: Utensils, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning', selectionClassName: 'bg-warning/10' },
  コンビニ: { icon: ShoppingBag, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success', selectionClassName: 'bg-success/10' },
  日用品: { icon: ShoppingBag, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success', selectionClassName: 'bg-success/10' },
  ショッピング: { icon: ShoppingBag, iconClassName: 'bg-chart-3/12 text-chart-3', dotClassName: 'bg-chart-3', selectionClassName: 'bg-chart-3/10' },
  ファッション: { icon: Shirt, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5', selectionClassName: 'bg-chart-5/10' },
  WEBサービス: { icon: Smartphone, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2', selectionClassName: 'bg-chart-2/10' },
  エンタメ: { icon: Ticket, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5', selectionClassName: 'bg-chart-5/10' },
  趣味: { icon: Coffee, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5', selectionClassName: 'bg-chart-5/10' },
  '旅行・レジャー': { icon: Plane, iconClassName: 'bg-chart-4/12 text-chart-4', dotClassName: 'bg-chart-4', selectionClassName: 'bg-chart-4/10' },
  交際費: { icon: Users, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success', selectionClassName: 'bg-success/10' },
  ギフト: { icon: Gift, iconClassName: 'bg-chart-4/12 text-chart-4', dotClassName: 'bg-chart-4', selectionClassName: 'bg-chart-4/10' },
  交通費: { icon: TrainFront, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2', selectionClassName: 'bg-chart-2/10' },
  '美容・コスメ': { icon: Sparkles, iconClassName: 'bg-chart-4/12 text-chart-4', dotClassName: 'bg-chart-4', selectionClassName: 'bg-chart-4/10' },
  '医療・健康': { icon: Cross, iconClassName: 'bg-expense/12 text-expense', dotClassName: 'bg-expense', selectionClassName: 'bg-expense/10' },
  車: { icon: Car, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2', selectionClassName: 'bg-chart-2/10' },
  教育: { icon: GraduationCap, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2', selectionClassName: 'bg-chart-2/10' },
  子供: { icon: Baby, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success', selectionClassName: 'bg-success/10' },
  手数料: { icon: ReceiptText, iconClassName: 'bg-muted text-muted-foreground', dotClassName: 'bg-muted-foreground', selectionClassName: 'bg-primary/10' },
  水道光熱費: { icon: Lightbulb, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning', selectionClassName: 'bg-warning/10' },
  通信費: { icon: Smartphone, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2', selectionClassName: 'bg-chart-2/10' },
  住宅: { icon: House, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success', selectionClassName: 'bg-success/10' },
  税金: { icon: Landmark, iconClassName: 'bg-expense/12 text-expense', dotClassName: 'bg-expense', selectionClassName: 'bg-expense/10' },
  保険: { icon: ShieldCheck, iconClassName: 'bg-chart-4/12 text-chart-4', dotClassName: 'bg-chart-4', selectionClassName: 'bg-chart-4/10' },
  返済: { icon: HandCoins, iconClassName: 'bg-expense/12 text-expense', dotClassName: 'bg-expense', selectionClassName: 'bg-expense/10' },
  ビジネス: { icon: BriefcaseBusiness, iconClassName: 'bg-chart-3/12 text-chart-3', dotClassName: 'bg-chart-3', selectionClassName: 'bg-chart-3/10' },
  給与: incomeCategoryPresentation,
  その他収入: incomeCategoryPresentation,
  投資: { icon: CircleDollarSign, iconClassName: 'bg-income/12 text-income', dotClassName: 'bg-income', selectionClassName: 'bg-income/10' },

  // 既存データや画面表示で使われているカテゴリ名の別名。
  交通: { icon: TrainFront, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2', selectionClassName: 'bg-chart-2/10' },
  住居: { icon: House, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success', selectionClassName: 'bg-success/10' },
  固定費: { icon: Lightbulb, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning', selectionClassName: 'bg-warning/10' },
  光熱費: { icon: Lightbulb, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning', selectionClassName: 'bg-warning/10' },
  通信: { icon: Smartphone, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2', selectionClassName: 'bg-chart-2/10' },
  娯楽: { icon: Ticket, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5', selectionClassName: 'bg-chart-5/10' },
  サブスク: { icon: Ticket, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5', selectionClassName: 'bg-chart-5/10' },
  その他: { icon: MoreHorizontal, iconClassName: 'bg-muted text-muted-foreground', dotClassName: 'bg-muted-foreground', selectionClassName: 'bg-primary/10' },
  収入: incomeCategoryPresentation,
  医療: { icon: Cross, iconClassName: 'bg-expense/12 text-expense', dotClassName: 'bg-expense', selectionClassName: 'bg-expense/10' },
  衣服: { icon: Shirt, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5', selectionClassName: 'bg-chart-5/10' },
  カフェ: { icon: Coffee, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning', selectionClassName: 'bg-warning/10' },
}

export function getCategoryPresentation(name: string, options?: { isIncome?: boolean }) {
  if (options?.isIncome) {
    return incomeCategoryPresentation
  }

  return categoryPresentations[name] ?? defaultCategoryPresentation
}
