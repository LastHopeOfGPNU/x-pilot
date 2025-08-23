import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export const TwitterAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('loading');
        setMessage('正在处理 Twitter 授权...');

        // 检查URL参数中是否有错误信息
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          logger.error('Twitter OAuth callback error:', errorParam, errorDescription);
          throw new Error(`Twitter returned error: ${errorDescription || errorParam}`);
        }

        // 获取当前 Supabase 会话
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw new Error(`Session retrieval failed: ${error.message}`);
        }

        if (!data.session) {
          throw new Error('未找到有效会话，请重新登录');
        }

        // 检查是否有 Twitter token
        const twitterToken = data.session.provider_token;

        if (!twitterToken) {
          throw new Error('未获取到 Twitter 访问令牌');
        }

        setStatus('success');
        setMessage('Twitter 授权成功！正在跳转...');

        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          navigate('/?section=profile&tab=twitter-auth');
        }, 2000);

      } catch (error) {
        logger.error('Twitter authorization callback processing failed:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authorization processing failed');
        
        // Redirect to homepage even on error, but extend time to let user see error message
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              正在处理 Twitter 认证...
            </h2>
            <p className="text-gray-600">
              请稍候，我们正在安全地连接您的 Twitter 账户
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              连接成功！
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                您的 Twitter 账户已成功连接，现在可以使用 Twitter API 功能了。
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                Please check your network connection and Twitter app configuration, then try again.
              </p>
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              返回首页
            </button>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            通过 Supabase Auth 安全认证
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwitterAuthCallback;