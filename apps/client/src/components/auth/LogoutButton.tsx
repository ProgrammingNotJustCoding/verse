import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { logout } from '@/services/auth.service'
import toast from 'react-hot-toast'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  className?: string
}

export function LogoutButton({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  className,
}: LogoutButtonProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully', {
      style: { background: '#171717', color: '#00ff00' },
    })
    navigate('/auth')
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} className={className}>
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      Logout
    </Button>
  )
}

export default LogoutButton
