import {
  ArrowDown,
  ChartColumnIncreasing,
  ListChecks,
  Sparkles,
} from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { LoginPanel, useAuth } from '@/features/auth'
import { FullScreenLoading } from '@/shared/components/app-state'
import { Brand } from '@/shared/components/brand'
import { getSafeAppRedirect } from '@/shared/lib/safe-redirect'

const productStories = [
  {
    icon: Sparkles,
    eyebrow: '01 — HOME',
    title: '今月の流れを、\nひと目で。',
    description:
      '支出のペース、予算との距離、気になる変化を一つの画面で確認できます。',
    image: '/login/home-dashboard.webp',
    imageAlt: '今月の支出、予算比、支出ペースを表示したMoneyHooksのホーム画面',
  },
  {
    icon: ChartColumnIncreasing,
    eyebrow: '02 — ANALYSIS',
    title: '使い方の傾向を、\nすぐ理解。',
    description:
      '月ごとの推移とカテゴリ別の内訳から、お金の使い方をやさしく読み解けます。',
    image: '/login/analysis-overview.webp',
    imageAlt: '月別支出推移とカテゴリ別支出を表示したMoneyHooksの分析画面',
  },
  {
    icon: ListChecks,
    eyebrow: '03 — TRANSACTIONS',
    title: '毎日の記録を、\n迷わず整理。',
    description:
      '収支を日付ごとに見渡せるので、振り返りたい一件にもすぐたどり着けます。',
    image: '/login/transactions-list.webp',
    imageAlt: '日付ごとの収支と取引一覧を表示したMoneyHooksの取引画面',
  },
] as const

function ProductStory({
  story,
  index,
}: {
  story: (typeof productStories)[number]
  index: number
}) {
  const Icon = story.icon

  return (
    <section className={`login-story login-story-${index + 1}`}>
      <div className="login-story-copy">
        <p className="login-story-eyebrow">
          <Icon aria-hidden="true" />
          {story.eyebrow}
        </p>
        <h2>{story.title}</h2>
        <p>{story.description}</p>
      </div>
      <figure className="login-screen-frame">
        <img alt={story.imageAlt} loading="lazy" src={story.image} />
      </figure>
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
    <main className="login-page">
      <header className="login-header">
        <Brand className="login-brand" />
        <a className="login-header-link" href="#login-panel">
          ログイン
        </a>
      </header>

      <section className="login-hero">
        <div className="login-hero-glow login-hero-glow-one" />
        <div className="login-hero-glow login-hero-glow-two" />
        <div className="login-hero-grid" />
        <div className="login-hero-content">
          <div className="login-hero-copy">
            <p className="login-hero-kicker">
              <Sparkles aria-hidden="true" />
              YOUR MONEY, IN MOTION
            </p>
            <h1>
              お金の流れを、
              <br />
              自分の味方に。
            </h1>
            <p>
              毎日の記録から、今月の使い方まで。MoneyHooksなら、家計との距離がぐっと近くなります。
            </p>
            <a className="login-scroll-cue" href="#features">
              <ArrowDown aria-hidden="true" />
              できることを見る
            </a>
          </div>

          <div className="login-hero-screen" aria-hidden="true">
            <img alt="" src="/login/home-dashboard.webp" />
          </div>

          <div className="login-panel-wrap" id="login-panel">
            <LoginPanel />
          </div>
        </div>
      </section>

      <div className="login-content" id="features">
        <div className="login-intro">
          <p>EVERYDAY CLARITY</p>
          <h2>
            記録するだけで、
            <br />
            見える景色が変わっていく。
          </h2>
        </div>

        {productStories.map((story, index) => (
          <ProductStory index={index} key={story.eyebrow} story={story} />
        ))}

        <section className="login-closing">
          <Sparkles aria-hidden="true" />
          <p>今日から、家計をもっと身近に。</p>
          <a href="#login-panel">
            Googleで無料ではじめる <ArrowDown aria-hidden="true" />
          </a>
        </section>
      </div>
    </main>
  )
}
