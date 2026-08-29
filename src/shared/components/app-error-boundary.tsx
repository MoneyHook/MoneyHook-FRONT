import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from './app-state'

type State = { hasError: boolean }

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected application error', error, info)
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-svh items-center bg-background">
          <ErrorState
            message="画面を表示できませんでした。再度お試しください。"
            onRetry={this.reset}
          />
        </main>
      )
    }

    return this.props.children
  }
}
