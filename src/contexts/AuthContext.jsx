import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }


  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // Clear all local storage data
    localStorage.clear()

    // Note: Navigation will be handled by the component calling signOut
  }

  // Determine user role
  const userRole = user?.email === 'kkmpongal2026@gmail.com' ? 'admin' : user ? 'user' : 'guest'

  // Save role to localStorage only if user is authenticated
  if (user) {
    localStorage.setItem('userRole', userRole)
  } else {
    localStorage.removeItem('userRole')
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    // Simple email-based role check: kkmpongal2026@gmail.com is admin, others are user (view-only)
    isAdmin: user?.email === 'kkmpongal2026@gmail.com',
    isUser: !!user && user?.email !== 'kkmpongal2026@gmail.com',
    userRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
