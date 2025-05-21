import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { clothApi } from '../../services/api'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, username, logout } = useAuth()
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const fetchUserRole = async () => {
      if (isAuthenticated) {
        try {
          const profile = await clothApi.getProfile()
          setUserRole(profile.role)
        } catch (error) {
          console.error('Failed to fetch user role:', error)
        }
      }
    }
    fetchUserRole()
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  TrueFit3D
                </Link>
              </div>
              {isAuthenticated && (
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    Home
                  </Link>
                  {userRole !== 'ADMIN' && (
                    <Link
                      to="/wardrobe"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    >
                      Wardrobe
                    </Link>
                  )}
                  {userRole === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    >
                      Admin Portal
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    Profile
                  </Link>
                </div>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Welcome, {username}</span>
                  <button
                    onClick={handleLogout}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
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