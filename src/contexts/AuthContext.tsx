import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初始化认证状态
    const initAuth = async () => {
      try {
        // 获取当前会话（这会自动处理OAuth回调）
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
  
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // 如果有会话且URL包含OAuth参数，清理URL
        if (session && (window.location.hash.includes('access_token') || window.location.search.includes('code'))) {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      } catch (err) {
  
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSession(session)
        setUser(session.user)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session)
        setUser(session.user)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithGoogle = async () => {
    try {
      // 使用环境变量中的APP_URL，如果没有则回退到当前域名
      const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      return { error }
    } catch (err) {

      return { error: err as AuthError }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}