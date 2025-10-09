import React from 'react'
import { FaBookmark, FaSearch, FaTasks, FaRobot } from 'react-icons/fa'
import { HiSparkles } from 'react-icons/hi'
import { MdScreenShare } from 'react-icons/md'
import { BiTime } from 'react-icons/bi'

const Bento: React.FC = () => {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-secondary/20 to-orange-600/20 border border-secondary/30 rounded-full mb-6 backdrop-blur-sm">
            <HiSparkles className="text-secondary animate-pulse" />
            <span className="text-secondary text-sm font-semibold tracking-wide">Features</span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-medium text-white mb-6 leading-tight">
            Everything You Need for{' '}
            <span className="block mt-2 bg-gradient-to-r from-secondary to-orange-600 bg-clip-text text-transparent">
              Productive Meetings
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
            Powerful features designed to make your meetings more efficient and actionable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-fr">
          <div className="md:col-span-4 group relative bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-8 hover:border-secondary/50 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-gradient-to-br from-secondary/20 to-orange-600/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <MdScreenShare className="text-secondary text-4xl" />
                </div>
                <span className="px-4 py-1.5 bg-secondary/10 text-secondary text-xs font-bold rounded-full border border-secondary/20">
                  SMART DETECTION
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Slide Snapshots</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Automatically capture screenshots by detecting frame changes in shared content. Our
                intelligent OCR system continuously monitors presentations to preserve important
                visual information.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 md:row-span-2 group relative bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-8 hover:border-secondary/50 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex flex-col h-full">
              <div className="p-4 bg-gradient-to-br from-secondary/20 to-orange-600/20 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-transform duration-300 w-fit">
                <FaBookmark className="text-secondary text-4xl" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Highlight Moments</h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Bookmark important moments during meetings. Jump to specific timestamps with
                synchronized transcripts and add personal notes for later review.
              </p>
              <div className="mt-auto space-y-3">
                <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl">
                  <BiTime className="text-secondary text-xl" />
                  <span className="text-sm text-gray-400">Jump to any moment</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl">
                  <FaBookmark className="text-secondary text-xl" />
                  <span className="text-sm text-gray-400">Personal bookmarks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 group relative bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-8 hover:border-secondary/50 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex flex-col h-full">
              <div className="p-4 bg-gradient-to-br from-secondary/20 to-orange-600/20 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-transform duration-300 w-fit">
                <FaSearch className="text-secondary text-4xl" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">AI Search</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Ask questions and get instant answers. Our AI bot intelligently searches through
                meeting transcripts.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 group relative bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-8 hover:border-secondary/50 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex flex-col h-full">
              <div className="p-4 bg-gradient-to-br from-secondary/20 to-orange-600/20 rounded-2xl inline-block mb-6 group-hover:scale-110 transition-transform duration-300 w-fit">
                <FaRobot className="text-secondary text-4xl" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">AI Summaries</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Get instant, intelligent summaries of your meetings. Key points, decisions, and
                action items extracted automatically.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 group relative bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-8 hover:border-secondary/50 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex flex-col md:flex-row items-start justify-between gap-6 h-full">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-secondary/20 to-orange-600/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <FaTasks className="text-secondary text-4xl" />
                  </div>
                  <span className="px-4 py-1.5 bg-secondary/10 text-secondary text-xs font-bold rounded-full border border-secondary/20">
                    AUTO-INTEGRATION
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Task Management</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Automatically extract and create tasks in your favorite tools. Simply mention team
                  members in chat, and watch as tasks appear in their calendars and project
                  management platforms.
                </p>
              </div>{' '}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Bento
