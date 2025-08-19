import React, { useState } from 'react'
import { User, LogOut, Settings, Mail, Calendar, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">用户资料</h2>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {loading ? '登出中...' : '登出'}
        </button>
      </div>

      {/* User Avatar */}
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="用户头像"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-[#4792E6]" />
          )}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">
            {user.user_metadata?.full_name || user.email?.split('@')[0] || '用户'}
          </h3>
          <p className="text-sm text-gray-500">
            {user.user_metadata?.provider === 'google' ? 'Google 账户' : '邮箱账户'}
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="space-y-4">
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Mail className="w-5 h-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-900">邮箱地址</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Calendar className="w-5 h-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-900">注册时间</p>
            <p className="text-sm text-gray-600">
              {new Date(user.created_at).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Shield className="w-5 h-5 text-gray-400 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-900">账户状态</p>
            <p className="text-sm text-gray-600">
              {user.email_confirmed_at ? (
                <span className="text-green-600">已验证</span>
              ) : (
                <span className="text-yellow-600">待验证</span>
              )}
            </p>
          </div>
        </div>

        {user.user_metadata?.provider && (
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">登录方式</p>
              <p className="text-sm text-gray-600 capitalize">
                {user.user_metadata.provider}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Additional Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>用户ID: {user.id}</p>
          <p>最后登录: {new Date(user.last_sign_in_at || '').toLocaleString('zh-CN')}</p>
        </div>
      </div>
    </div>
  )
}

export default UserProfile