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
}

const defaultCategoryPresentation: CategoryPresentation = {
  icon: Tags,
  iconClassName: 'bg-muted text-muted-foreground',
  dotClassName: 'bg-muted-foreground',
}

const incomeCategoryPresentation: CategoryPresentation = {
  icon: CircleDollarSign,
  iconClassName: 'bg-income/12 text-income',
  dotClassName: 'bg-income',
}

const categoryPresentations: Record<string, CategoryPresentation> = {
  食費: { icon: Utensils, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning' },
  外食: { icon: Utensils, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning' },
  コンビニ: { icon: ShoppingBag, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success' },
  日用品: { icon: ShoppingBag, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success' },
  ショッピング: { icon: ShoppingBag, iconClassName: 'bg-chart-3/12 text-chart-3', dotClassName: 'bg-chart-3' },
  ファッション: { icon: Shirt, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5' },
  WEBサービス: { icon: Smartphone, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2' },
  エンタメ: { icon: Ticket, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5' },
  趣味: { icon: Coffee, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5' },
  '旅行・レジャー': { icon: Plane, iconClassName: 'bg-chart-4/12 text-chart-4', dotClassName: 'bg-chart-4' },
  交際費: { icon: Users, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success' },
  ギフト: { icon: Gift, iconClassName: 'bg-chart-4/12 text-chart-4', dotClassName: 'bg-chart-4' },
  交通費: { icon: TrainFront, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2' },
  '美容・コスメ': { icon: Sparkles, iconClassName: 'bg-chart-4/12 text-chart-4', dotClassName: 'bg-chart-4' },
  '医療・健康': { icon: Cross, iconClassName: 'bg-expense/12 text-expense', dotClassName: 'bg-expense' },
  車: { icon: Car, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2' },
  教育: { icon: GraduationCap, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2' },
  子供: { icon: Baby, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success' },
  手数料: { icon: ReceiptText, iconClassName: 'bg-muted text-muted-foreground', dotClassName: 'bg-muted-foreground' },
  水道光熱費: { icon: Lightbulb, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning' },
  通信費: { icon: Smartphone, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2' },
  住宅: { icon: House, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success' },
  税金: { icon: Landmark, iconClassName: 'bg-expense/12 text-expense', dotClassName: 'bg-expense' },
  保険: { icon: ShieldCheck, iconClassName: 'bg-chart-4/12 text-chart-4', dotClassName: 'bg-chart-4' },
  返済: { icon: HandCoins, iconClassName: 'bg-expense/12 text-expense', dotClassName: 'bg-expense' },
  ビジネス: { icon: BriefcaseBusiness, iconClassName: 'bg-chart-3/12 text-chart-3', dotClassName: 'bg-chart-3' },
  給与: incomeCategoryPresentation,
  その他収入: incomeCategoryPresentation,
  投資: { icon: CircleDollarSign, iconClassName: 'bg-income/12 text-income', dotClassName: 'bg-income' },

  // 既存データや画面表示で使われているカテゴリ名の別名。
  交通: { icon: TrainFront, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2' },
  住居: { icon: House, iconClassName: 'bg-success/12 text-success', dotClassName: 'bg-success' },
  固定費: { icon: Lightbulb, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning' },
  光熱費: { icon: Lightbulb, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning' },
  通信: { icon: Smartphone, iconClassName: 'bg-chart-2/12 text-chart-2', dotClassName: 'bg-chart-2' },
  娯楽: { icon: Ticket, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5' },
  サブスク: { icon: Ticket, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5' },
  その他: { icon: MoreHorizontal, iconClassName: 'bg-muted text-muted-foreground', dotClassName: 'bg-muted-foreground' },
  収入: incomeCategoryPresentation,
  医療: { icon: Cross, iconClassName: 'bg-expense/12 text-expense', dotClassName: 'bg-expense' },
  衣服: { icon: Shirt, iconClassName: 'bg-chart-5/12 text-chart-5', dotClassName: 'bg-chart-5' },
  カフェ: { icon: Coffee, iconClassName: 'bg-warning/12 text-warning', dotClassName: 'bg-warning' },
}

export function getCategoryPresentation(name: string, options?: { isIncome?: boolean }) {
  if (options?.isIncome) {
    return incomeCategoryPresentation
  }

  return categoryPresentations[name] ?? defaultCategoryPresentation
}
