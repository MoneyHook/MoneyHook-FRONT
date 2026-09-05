import { Navigate, useSearchParams } from 'react-router-dom'
import { BarChart3, CheckCircle2, PieChart, Sparkles, TrendingUp } from 'lucide-react'

import { LoginPanel, useAuth } from '@/features/auth'
import { Brand } from '@/shared/components/brand'
import { FullScreenLoading } from '@/shared/components/app-state'
import { getSafeAppRedirect } from '@/shared/lib/safe-redirect'

const benefits = [
  {
    icon: Sparkles,
    title: 'すぐに始められる',
    description: 'Googleアカウントで\nかんたんに利用開始',
  },
  {
    icon: PieChart,
    title: '家計をひと目で把握',
    description: '収支や支出をグラフで\n分かりやすく可視化',
  },
  {
    icon: CheckCircle2,
    title: 'シンプルに管理',
    description: 'ムダなく続けられる\nシンプルな操作性',
  },
] as const

function LoginVisual() {
  return (
    <section aria-label="MoneyHooksの特徴" className="login-visual motion-auth-visual">
      <div className="login-visual-orbit login-visual-orbit-large" />
      <div className="login-visual-orbit login-visual-orbit-small" />
      <div className="login-visual-spark login-visual-spark-top" />
      <div className="login-visual-spark login-visual-spark-bottom" />

      <div className="login-dashboard" aria-hidden="true">
        <div className="login-dashboard-sidebar">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="login-dashboard-main">
          <div className="login-dashboard-toolbar">
            <span />
            <span />
          </div>
          <div className="login-chart">
            <span className="login-chart-line login-chart-line-one" />
            <span className="login-chart-line login-chart-line-two" />
            <span className="login-chart-line login-chart-line-three" />
            <span className="login-chart-line login-chart-line-four" />
            <span className="login-chart-point login-chart-point-one" />
            <span className="login-chart-point login-chart-point-two" />
            <span className="login-chart-point login-chart-point-three" />
          </div>
          <div className="login-dashboard-footer">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="login-summary-card login-summary-card-income" aria-hidden="true">
        <span>今月の収支</span>
        <strong>¥128,500</strong>
        <small><TrendingUp /> 12.5%</small>
      </div>
      <div className="login-summary-card login-summary-card-pie" aria-hidden="true">
        <PieChart />
      </div>
      <div className="login-summary-card login-summary-card-bars" aria-hidden="true">
        <BarChart3 />
      </div>

      <div className="login-benefits">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div className="login-benefit" key={title}>
            <span className="login-benefit-icon"><Icon aria-hidden="true" /></span>
            <strong>{title}</strong>
            <p>{description}</p>
          </div>
        ))}
      </div>
      <p className="login-data-note"><Sparkles aria-hidden="true" />毎日の家計管理を、もっと身近に</p>
    </section>
  )
}

export function LoginPage() {
  const { status } = useAuth()
  const [searchParams] = useSearchParams()
  const redirect = getSafeAppRedirect(searchParams.get('redirect'))

  if (status === 'authenticated') {
    return <Navigate replace to={redirect} />
  }

  if (status === 'initializing') {
    return <FullScreenLoading label="認証状態を確認しています" />
  }

  return (
    <main className="login-page relative min-h-svh overflow-hidden bg-background">
      <header className="absolute inset-x-0 top-0 z-10 px-6 py-6 md:px-10 md:py-8">
        <Brand />
      </header>

      <div className="relative z-10 mx-auto grid min-h-svh w-full max-w-7xl items-center gap-12 px-6 py-28 md:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)] md:gap-16 md:px-12 lg:gap-24 lg:px-16">
        <LoginVisual />
        <div className="flex justify-center md:justify-end">
          <LoginPanel />
        </div>
      </div>
    </main>
  )
}
