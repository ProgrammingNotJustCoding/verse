import React from 'react'

import Hero from '../../components/home/Hero'
import Bento from '../../components/home/Bento'
import Footer from '../../components/common/Footer'

const Home: React.FC = () => {
  return (
    <main className="w-full min-h-screen bg-neutral-950">
      <Hero />
      <Bento />
      <Footer />
    </main>
  )
}

export default Home
