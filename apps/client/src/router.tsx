import { Route, Routes } from 'react-router-dom'

import Home from './pages/home/Home'
import Auth from './pages/auth/Auth'
import GlobalError from './pages/error/GlobalError'
import NotFound from './pages/error/NotFound'

const Router: React.FC = () => {
  return (
    <GlobalError>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </GlobalError>
  )
}

export default Router
