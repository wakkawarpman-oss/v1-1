'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => this.setState({ hasError: false })

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400"
          >
            <p className="font-semibold">Помилка у цьому розділі.</p>
            <p className="mt-1 text-red-400/80">Спробуйте оновити сторінку або перейти до іншого розділу.</p>
            <button
              type="button"
              onClick={this.reset}
              className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Спробуйте знову
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
