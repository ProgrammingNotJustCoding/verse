import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaHome } from 'react-icons/fa'

import Button from '../../components/common/Button'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <main className="w-screen h-screen bg-neutral-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl"></div>

      <div className="text-center relative z-10 px-4">
        <h1 className="text-9xl font-bold bg-gradient-to-r from-white to-secondary bg-clip-text text-transparent mb-4">
          404
        </h1>

        <h2 className="text-3xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-4 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate('/')} className="flex flex-row items-center gap-3">
            <FaHome />
            Go Home
          </Button>
        </div>
      </div>
    </main>
  )
}

export default NotFound
