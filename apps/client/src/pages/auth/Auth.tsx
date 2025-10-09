import React from 'react'

import InfoCard from '../../components/auth/InfoCard'
import AuthForm from '../../components/auth/AuthForm'

const Auth: React.FC = () => {
  return (
    <main className="w-screen h-screen bg-neutral-950 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
        <div className="hidden lg:block">
          <InfoCard />
        </div>

        <div className="overflow-y-auto">
          <AuthForm />
        </div>
      </div>
    </main>
  )
}

export default Auth
