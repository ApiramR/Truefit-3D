import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Wardrobe', href: '/wardrobe' },
  { name: 'Profile', href: '/profile' },
]

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { isAuthenticated, username, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold">TrueFit3D</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                      location.pathname === item.href
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">Welcome, {username}</span>
                  <button
                    onClick={logout}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
} 