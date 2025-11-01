import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../../services/auth.service'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
