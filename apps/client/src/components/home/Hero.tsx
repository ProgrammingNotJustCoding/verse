import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPlay, FaVideo } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi'

import Button from '../common/Button'

const Hero: React.FC = () => {
  const navigate = useNavigate()

  return (
    <section className="h-[70vh] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-full mb-8">
          <HiSparkles className="text-secondary" />
          <span className="text-secondary text-sm font-medium">
            AI-Powered Meeting Intelligence
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium text-white mb-6 leading-tight">
          Meet Smarter with{' '}
          <span className="text-secondary bg-gradient-to-r from-secondary to-orange-600 bg-clip-text text-transparent">
            Verse
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
          Transform your meetings with intelligent transcriptions, AI summaries, and automatic task
          management. Never miss a detail again.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 pt-10">
          <Button variant="primary" className="text-lg" onClick={() => navigate('/auth')}>
            <span className="flex items-center gap-2">
              <FaPlay /> Get Started
            </span>
          </Button>
          <Button variant="outline" className="text-lg">
            <span className="flex items-center gap-2">
              <FaVideo /> Watch Demo
            </span>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default Hero
