import React, { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import GoogleLoginButton from './GoogleLoginButton'

interface LoginProps {
  onClose?: () => void
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(30)

  const { signIn, signUp } = useAuth()

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showSuccessModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    } else if (showSuccessModal && countdown === 0) {
      // 倒计时结束，切换到登录模式
      setShowSuccessModal(false)
      setIsSignUp(false)
      setSuccess('')
      setEmail('')
      setPassword('')
      setCountdown(30) // 重置倒计时
    }
    return () => clearTimeout(timer)
  }, [showSuccessModal, countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isSignUp) {
        // 注册流程
        const { error: signUpError } = await signUp(email, password)
        
        if (signUpError) {
          console.error('Registration error:', signUpError)
          if (signUpError.message.includes('email_address_invalid')) {
            setError('邮箱地址格式无效，请使用有效的邮箱地址')
          } else if (signUpError.message.includes('User already registered')) {
            setError('该邮箱已被注册，请使用其他邮箱或直接登录')
          } else {
            setError(`Registration failed: ${signUpError.message}`)
          }
        } else {
          // 注册成功，显示醒目的成功模态框
          setShowSuccessModal(true)
          setCountdown(30) // 重置倒计时
        }
      } else {
        // 登录流程
        const { error } = await signIn(email, password)
        
        if (error) {
          console.error('Login error:', error)
          if (error.message.includes('email_not_confirmed')) {
            setError('请先验证您的邮箱地址。检查您的邮箱并点击验证链接。')
          } else if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password, please check and try again')
          } else {
            setError(`Login failed: ${error.message}`)
          }
        } else {
          setSuccess('登录成功！')
          setTimeout(() => {
            onClose?.()
          }, 1000)
        }
      }
    } catch (err) {
      setError('An unknown error occurred, please try again')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      {/* 注册成功模态框 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform">
            <div className="text-center">
              {/* 成功图标 */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              
              {/* 标题 */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                注册成功！
              </h2>
              
              {/* 主要提示信息 */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-blue-800 font-semibold mb-2">
                      Magic Link 已发送到您的邮箱
                    </p>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      请检查您的邮箱（包括垃圾邮件文件夹），点击邮件中的 Magic Link 验证您的邮箱地址，然后返回此页面登录平台。
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 倒计时提示 - 添加轻微闪烁效果 */}
              <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4 mb-6">
                <Clock className={`w-5 h-5 text-gray-500 mr-2 ${countdown <= 10 ? 'animate-pulse' : ''}`} />
                <span className={`text-gray-700 ${countdown <= 10 ? 'animate-pulse font-semibold text-orange-600' : ''}`}>
                  {countdown} 秒后自动跳转到登录页面
                </span>
              </div>
              
              {/* 手动跳转按钮 */}
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  setIsSignUp(false)
                  setSuccess('')
                  setEmail('')
                  setPassword('')
                  setCountdown(30)
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                立即跳转到登录页面
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#E8F2FF' }}>
              <LogIn className="w-8 h-8" style={{ color: '#4792E6' }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSignUp ? '创建账户' : '欢迎回来'}
            </h1>
            <p className="text-gray-600">
              {isSignUp ? '注册您的新账户' : '登录到您的账户'}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': '#4792E6' } as React.CSSProperties}
                  placeholder="输入您的邮箱"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                  style={{ '--tw-ring-color': '#4792E6' } as React.CSSProperties}
                  placeholder="输入您的密码"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 px-4 rounded-lg font-medium focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ 
                backgroundColor: '#4792E6',
                '--tw-ring-color': '#4792E6'
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#3A7BD5'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#4792E6'
                }
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  处理中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {isSignUp ? <UserPlus className="w-5 h-5 mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                  {isSignUp ? '注册' : '登录'}
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">或</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google Sign In */}
          <GoogleLoginButton
            onSuccess={() => setSuccess('正在跳转到Google登录...')}
            onError={(errorMessage) => setError(errorMessage)}
            disabled={loading}
          />

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignUp ? '已有账户？' : '还没有账户？'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setSuccess('')
                }}
                className="ml-1 font-medium relative inline-block group transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
                style={{ color: '#4792E6' }}
              >
                <span className="relative z-10 transition-all duration-300 ease-in-out group-hover:text-white">
                  {isSignUp ? '立即登录' : '立即注册'}
                </span>
                {/* 背景动画效果 */}
                <span 
                  className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out transform scale-x-0 group-hover:scale-x-100 origin-left"
                  style={{ backgroundColor: '#4792E6' }}
                ></span>
                {/* 发光效果 */}
                <span 
                  className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-30 transition-all duration-500 ease-in-out blur-sm"
                  style={{ backgroundColor: '#4792E6', transform: 'scale(1.1)' }}
                ></span>
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login