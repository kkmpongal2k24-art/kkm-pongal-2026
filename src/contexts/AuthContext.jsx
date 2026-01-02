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

    // Redirect to signin page
    window.location.href = '/signin'
  }

  // Save role to localStorage
  const userRole = user?.email === 'kkmpongal2026@gmail.com' ? 'admin' : 'user'
  localStorage.setItem('userRole', userRole)

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    // Simple email-based role check: kkmpongal2026@gmail.com is admin, others are user (view-only)
    isAdmin: user?.email === 'kkmpongal2026@gmail.com',
    isUser: user?.email !== 'kkmpongal2026@gmail.com',
    userRole,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
