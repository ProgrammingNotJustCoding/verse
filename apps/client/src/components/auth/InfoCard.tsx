import React from 'react'
import { FaMicrophone, FaRobot, FaTasks } from 'react-icons/fa'

const InfoCard: React.FC = () => {
  return (
    <div className="h-full bg-gradient-to-br from-primary via-neutral-900 to-secondary/40 p-12 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-auto">
          <h2 className="text-5xl font-bold text-secondary">Verse</h2>
          <p className="text-gray-300 text-sm mt-2">AI-Powered Meeting Intelligence</p>
        </div>

        <div className="flex-grow flex items-center">
          <div className="w-full">
            <h3 className="text-3xl font-bold text-white mb-8">Transform Your Meetings with AI</h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl flex-shrink-0 border border-white/20">
                  <FaMicrophone className="text-secondary text-xl" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">Real-time Transcription</h4>
                  <p className="text-gray-300">
                    Get accurate, live transcriptions of every meeting
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl flex-shrink-0 border border-white/20">
                  <FaRobot className="text-secondary text-xl" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">AI Summaries</h4>
                  <p className="text-gray-300">
                    Intelligent summaries with key insights and action items
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl flex-shrink-0 border border-white/20">
                  <FaTasks className="text-secondary text-xl" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-1">Automatic Tasks</h4>
                  <p className="text-gray-300">
                    Seamlessly create and assign tasks from discussions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfoCard
