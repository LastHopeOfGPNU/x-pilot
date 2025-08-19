# Twitter Token 自动检查和刷新机制

## 概述

为了解决用户在点击 "X Connect" 时可能遇到的 token 过期问题，我们实现了自动的 token 有效性检查和刷新机制。

## 问题描述

之前的实现中，当用户从进入页面到点击 profile 模块的 "X Connect" 按钮时，如果 Twitter token 已经过期（通常2小时），会出现"未连接"的状态，需要用户重新进行 OAuth 授权流程。

## 解决方案

### 1. 新增 `checkAndRefreshToken` 方法

在 `twitterService.ts` 中新增了 `checkAndRefreshToken` 方法，该方法会：

- 检查当前用户的 Twitter 连接状态
- 验证 token 是否过期或即将过期（5分钟内）
- 如果 token 过期，自动调用 `refreshTwitterToken` 方法刷新
- 返回 token 有效性状态和连接信息

```typescript
async checkAndRefreshToken(): Promise<{ isValid: boolean; connection?: TwitterConnection | null }> {
  try {
    const connection = await this.getUserConnection();
    
    if (!connection || !connection.is_active) {
      return { isValid: false, connection: null };
    }

    // 检查token是否过期
    if (connection.expires_at) {
      const expiresAt = new Date(connection.expires_at);
      const now = new Date();
      
      // 如果token已过期或即将在5分钟内过期，尝试刷新
      if (expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
        console.log('Token expired or expiring soon, attempting refresh...');
        
        try {
          await this.refreshTwitterToken();
          // 重新获取更新后的连接信息
          const refreshedConnection = await this.getUserConnection();
          return { isValid: true, connection: refreshedConnection };
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          return { isValid: false, connection };
        }
      }
    }

    return { isValid: true, connection };
  } catch (error) {
    console.error('Error checking token validity:', error);
    return { isValid: false, connection: null };
  }
}
```

### 2. 修改连接处理逻辑

在 `Profile.tsx` 和 `Onboarding.tsx` 中的 `handleConnectTwitter` 函数中，添加了 token 检查逻辑：

```typescript
const handleConnectTwitter = async () => {
  try {
    // 检查Twitter API配置
    if (!twitterService.isConfigured()) {
      // ... 配置检查逻辑
      return;
    }

    // 首先检查是否已有连接且token是否有效
    const tokenCheck = await twitterService.checkAndRefreshToken();
    
    if (tokenCheck.isValid && tokenCheck.connection) {
      // Token有效，更新连接状态
      setTwitterConnection(tokenCheck.connection);
      console.log('Twitter connection is valid and refreshed if needed');
      return;
    }

    // 如果没有有效连接，启动新的OAuth流程
    const authUrl = await twitterService.getAuthUrl();
    window.location.href = authUrl;
  } catch (error) {
    // ... 错误处理
  }
};
```

## 工作流程

1. **用户点击 "X Connect"**
2. **检查 API 配置** - 验证 Twitter API 密钥是否配置正确
3. **Token 有效性检查** - 调用 `checkAndRefreshToken` 方法
4. **自动刷新（如需要）** - 如果 token 过期或即将过期，自动刷新
5. **更新连接状态** - 如果 token 有效，直接更新 UI 状态
6. **OAuth 流程（如需要）** - 只有在没有有效连接时才启动新的 OAuth 授权

## 优势

- **用户体验优化** - 避免不必要的重新授权
- **自动化处理** - 透明地处理 token 刷新，用户无感知
- **提前刷新** - 在 token 过期前5分钟就开始刷新，避免 API 调用失败
- **错误处理** - 如果刷新失败，会回退到标准的 OAuth 流程

## 注意事项

- Twitter API v2 的 access token 通常有效期为2小时
- 系统会在 token 过期前5分钟自动刷新
- 如果 refresh token 也失效，用户需要重新进行 OAuth 授权
- 所有的 token 刷新操作都通过 Supabase Edge Function 进行，确保安全性

## 相关文件

- `src/lib/twitterService.ts` - 核心服务类，包含 token 检查和刷新逻辑
- `src/components/Profile.tsx` - Profile 页面的连接处理
- `src/components/Onboarding.tsx` - 入门流程的连接处理
- `supabase/functions/twitter-refresh-token/index.ts` - Token 刷新的后端实现