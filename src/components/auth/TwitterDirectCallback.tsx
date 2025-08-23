import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Twitter, CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
import { twitterService } from '../../lib/twitterService';

export const TwitterDirectCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('正在验证授权信息...');
  const [countdown, setCountdown] = useState<number>(3);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Twitter authorization failed: ${error}`);
        }

        if (!code || !state) {
          throw new Error('缺少必要的授权参数');
        }

        setMessage('正在验证授权信息...');
        setProgress(20);
        await new Promise(resolve => setTimeout(resolve, 500)); // 短暂延迟提升用户体验

        setMessage('正在获取访问令牌...');
        setProgress(40);
        await new Promise(resolve => setTimeout(resolve, 300));

        // 处理OAuth回调 - 增加超时处理
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('请求超时，请稍后重试')), 30000); // 30秒超时
        });
        
        const result = await Promise.race([
          twitterService.handleCallback(code, state),
          timeoutPromise
        ]) as { success: boolean; data?: any; error?: string };

        if (result.success) {
          setMessage('正在获取用户信息...');
          setProgress(80);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setProgress(100);
          
          setStatus('success');
          setMessage('Twitter账户授权成功！');
          
          // 检查是否在弹出窗口中
          const isPopup = window.opener && window.opener !== window;
          
          if (isPopup) {
            // 在弹出窗口中，通知父窗口并关闭
            try {
              // 通知父窗口授权成功
              window.opener.postMessage({
                type: 'TWITTER_AUTH_SUCCESS',
                data: result.data
              }, window.location.origin);
              
              // 延迟关闭窗口，让用户看到成功消息
              setTimeout(() => {
                window.close();
              }, 1500);
            } catch (error) {
              console.error('Failed to communicate with parent window:', error);
              // 如果无法通信，则正常跳转
              navigate('/?section=profile&tab=twitter-auth');
            }
          } else {
            // 不在弹出窗口中，正常倒计时跳转
            const timer = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer);
                  navigate('/?section=profile&tab=twitter-auth');
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            
            return () => clearInterval(timer);
           }
        } else {
          throw new Error(result.error || 'Connection failed, please try again');
        }
      } catch (error) {
        console.error('Twitter callback processing failed:', error);
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // 提供更友好的错误信息
        if (errorMessage.includes('用户未登录')) {
          setMessage('请先登录应用，然后再连接Twitter账户');
        } else if (errorMessage.includes('Authorization session not found')) {
          setMessage('授权会话未找到，请重新开始连接流程');
        } else if (errorMessage.includes('Authorization verification failed')) {
          setMessage('授权验证失败，请重新开始连接流程');
        } else if (errorMessage.includes('Authorization verification code not found')) {
          setMessage('授权验证码未找到，请重新开始连接流程');
        } else if (errorMessage.includes('请求超时')) {
          setMessage('Network request timeout, please check your network connection and try again');
        
        // 如果在弹出窗口中发生错误，也要通知父窗口
        const isPopup = window.opener && window.opener !== window;
        if (isPopup) {
          try {
            window.opener.postMessage({
              type: 'TWITTER_AUTH_ERROR',
              error: errorMessage
            }, window.location.origin);
          } catch (e) {
            console.error('Failed to communicate error to parent window:', e);
          }
        }
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
          setMessage('Network connection failed, please check your network and try again');
        } else if (errorMessage.includes('invalid input syntax for type uuid')) {
          setMessage('User authentication failed, please log in to the app again');
        } else if (errorMessage.includes('Missing required parameters')) {
          setMessage('Service configuration error, please contact administrator');
        } else {
          setMessage(errorMessage);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex justify-center items-center px-4 py-12 min-h-screen bg-gray-50 sm:px-6 lg:px-8">
      <div className="space-y-8 w-full max-w-md">
        <div className="text-center">
          <Twitter className="mx-auto w-12 h-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Twitter 授权处理
          </h2>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader className="mx-auto w-8 h-8 text-blue-500 animate-spin" />
                <div className="space-y-2">
                  <p className="text-gray-600">{message}</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">请耐心等待，通常需要10-30秒完成</p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-green-600">{message}</p>
                  <div className="flex justify-center items-center space-x-2 text-sm text-gray-600">
                    <span>{countdown} 秒后自动跳转到个人资料页面</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  ></div>
                </div>
                <button
                  onClick={() => {
                    const isPopup = window.opener && window.opener !== window;
                    if (isPopup) {
                      // 在弹出窗口中，通知父窗口跳转并关闭窗口
                      try {
                        window.opener.postMessage({
                          type: 'TWITTER_AUTH_NAVIGATE',
                          url: '/?section=profile&tab=twitter-auth'
                        }, window.location.origin);
                        window.close();
                      } catch (error) {
                        console.error('Failed to communicate with parent window:', error);
                        // 如果无法通信，则正常跳转
                        navigate('/?section=profile&tab=twitter-auth');
                      }
                    } else {
                      // 不在弹出窗口中，正常跳转
                      navigate('/?section=profile&tab=twitter-auth');
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md border border-transparent transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  立即跳转
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="mx-auto w-12 h-12 text-red-500" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-red-600">Authorization Failed</p>
                  <p className="text-sm text-gray-600">{message}</p>
                </div>
                <button
                  onClick={() => {
                    const isPopup = window.opener && window.opener !== window;
                    if (isPopup) {
                      // 在弹出窗口中，通知父窗口跳转并关闭窗口
                      try {
                        window.opener.postMessage({
                          type: 'TWITTER_AUTH_NAVIGATE',
                          url: '/?section=profile&tab=twitter-auth'
                        }, window.location.origin);
                        window.close();
                      } catch (error) {
                        console.error('Failed to communicate with parent window:', error);
                        // 如果无法通信，则正常跳转
                        navigate('/?section=profile&tab=twitter-auth');
                      }
                    } else {
                      // 不在弹出窗口中，正常跳转
                      navigate('/?section=profile&tab=twitter-auth');
                    }
                  }}
                  className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  返回个人资料
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterDirectCallback;