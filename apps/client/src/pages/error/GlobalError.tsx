import React from 'react'
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa'

import Button from '../../components/common/Button'

type State = {
  hasError: boolean
  error?: Error
}

class GlobalError extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Global error caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl"></div>

          <div className="text-center relative z-10 px-4 max-w-2xl">
            <div className="mb-6 flex justify-center">
              <div className="p-6 bg-red-500/10 backdrop-blur-sm rounded-full border border-red-500/20">
                <FaExclamationTriangle className="text-red-500 text-6xl" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-3">Oops! Something Went Wrong</h1>
            <p className="text-gray-400 text-lg mb-6">
              We encountered an unexpected error. Don't worry, our team has been notified.
            </p>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.history.back()}>Go Back</Button>
              <Button onClick={this.handleReset} className="flex flex-row">
                <FaRedo />
                Return Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default GlobalError
