# Onboarding API 接口集成文档

## 概述

本文档说明了如何将 onboarding 的两个核心接口集成到界面中：
1. **获取当前引导步骤** - `/api/onboarding/step` (GET)
2. **推进到下一步骤** - `/api/onboarding/step/forward` (POST)

## 接口定义

### 1. 获取当前引导步骤

**接口路径**: `GET /api/onboarding/step`

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {access_token}"
}
```

**响应格式**:
```typescript
interface OnboardingStatusResponse {
  is_finished: boolean;        // 是否已完成所有引导步骤
  current_step: OnboardingStep; // 当前步骤
}

type OnboardingStep = 'START' | 'CONNECT' | 'PICK_ACCOUNTS' | 'ENGAGEMENT';
```

**响应示例**:
```json
{
  "is_finished": false,
  "current_step": "START"
}
```

### 2. 推进到下一步骤

**接口路径**: `POST /api/onboarding/step/forward`

> **注意**: 此接口用于自动推进到下一个引导步骤，无需额外参数

**请求头**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {access_token}"
}
```

**响应格式**:
```typescript
interface OnboardingForwardResponse {
  success: boolean;            // 操作是否成功
  current_step: OnboardingStep; // 更新后的当前步骤
  is_finished: boolean;        // 是否已完成所有步骤
}
```

**响应示例**:
```json
{
  "success": true,
  "current_step": "CONNECT",
  "is_finished": false
}
```

## 界面集成实现

### 1. 获取状态的集成 (App.tsx)

在 `App.tsx` 中，通过 `onboardingService.getCurrentStep()` 获取当前引导状态：

```typescript
// 检查onboarding状态
useEffect(() => {
  const checkOnboardingStatus = async () => {
    try {
      // 调用获取当前步骤接口
      const status = await onboardingService.getCurrentStep();
      
      setOnboardingStatus({
        isFinished: status.is_finished,
        currentStep: status.current_step,
        loading: false
      });
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      // 错误处理：假设需要onboarding
      setOnboardingStatus({ 
        isFinished: false, 
        currentStep: 'START', 
        loading: false 
      });
    }
  };

  checkOnboardingStatus();
}, [user]);
```

### 2. 下一步的集成 (Onboarding.tsx)

在 `Onboarding.tsx` 组件中，通过 `onboardingService.completeStep()` 推进到下一步：

```typescript
const handleNextStep = async () => {
  try {
    setActionLoading(true);
    setError(null);
    
    // 调用完成当前步骤并推进接口
    const nextStep = await onboardingService.completeStep(currentStep);
    
    if (nextStep.is_finished) {
      // 所有步骤完成
      setIsFinished(true);
      onComplete();
    } else {
      // 更新到下一步
      setCurrentStep(nextStep.current_step);
    }
  } catch (error) {
    console.error('Failed to proceed to next step:', error);
    setError('Failed to proceed to next step');
  } finally {
    setActionLoading(false);
  }
};
```

## 服务层实现 (onboardingService.ts)

### 获取当前步骤实现

```typescript
async getCurrentStep(): Promise<OnboardingStatusResponse> {
  try {
    const headers = await this.getAuthHeaders();
    
    const url = `${this.baseUrl}/api/onboarding/step`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting onboarding step:', error);
    throw error;
  }
}
```

### 推进到下一步实现

`moveToNextStep()` 方法使用 `/api/onboarding/step/forward` 端点：

```typescript
async moveToNextStep(): Promise<OnboardingForwardResponse> {
  try {
    const headers = await this.getAuthHeaders();
    
    // 使用 /api/onboarding/step/forward 端点
    const url = `${this.baseUrl}/api/onboarding/step/forward`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error moving to next step:', error);
    throw error;
  }
}
```

**关键特性**:
- 自动推进到下一个步骤，无需指定当前步骤
- 服务器端自动处理步骤逻辑和完成状态
- 返回更新后的步骤信息和完成状态

## 步骤流程

引导步骤按以下顺序进行：

1. **START** - 欢迎页面，介绍功能
2. **CONNECT** - 连接 X (Twitter) 账号
3. **PICK_ACCOUNTS** - 选择灵感账户
4. **ENGAGEMENT** - 完成引导，进入主应用

## Mock 模式支持

为了便于开发和测试，系统支持 Mock 模式：

- 通过 `localStorage.setItem('dev-onboarding-mode', 'true')` 启用
- Mock 模式下使用本地状态，不调用真实 API
- 可以通过 `EnvSwitcher` 组件切换模式

## 错误处理

### API 调用失败处理
- 当 `getCurrentStep()` 调用失败时（如500错误），系统会直接进入主页面，不显示onboarding界面
- 当 `moveToNextStep()` 调用失败时，会显示错误提示并保持当前状态
- 所有API调用都包含适当的错误日志记录

### 加载状态处理
在onboarding状态检查期间，系统会显示加载动画，确保用户体验的连续性：

```typescript
// 初始状态设置为loading: true
const [onboardingStatus, setOnboardingStatus] = useState<{
  isFinished: boolean;
  currentStep: string;
  loading: boolean;
}>({ isFinished: false, currentStep: 'START', loading: true });

// 在渲染逻辑中处理加载状态
if (onboardingStatus.loading) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-50">
      <div className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-blue-200 animate-spin border-t-[#4792E6]"></div>
        <p className="text-gray-600">正在检查设置状态...</p>
      </div>
    </div>
  );
}
```

### 错误处理策略更新
```typescript
try {
  const status = await onboardingService.getCurrentStep();
  setOnboardingStatus({
    isFinished: status.is_finished,
    currentStep: status.current_step,
    loading: false
  });
} catch (error) {
  console.error('Failed to check onboarding status:', error);
  // 如果API调用失败（如500错误），直接进入主页面，不显示onboarding
  setOnboardingStatus({ isFinished: true, currentStep: 'ENGAGEMENT', loading: false });
}
```

### 其他错误处理
- **网络错误**: 显示用户友好的错误信息
- **认证失败**: 重定向到登录页面
- **API 错误**: 记录错误日志并提供重试选项
- **Mock 模式降级**: API 失败时在开发模式下自动使用 Mock 数据

## 状态管理

- 使用 React State 管理当前步骤和完成状态
- 通过 Context 在组件间共享 onboarding 状态
- 支持加载状态和错误状态的 UI 反馈

## 总结

当前的 onboarding 系统已经完整实现了两个核心接口的集成：

1. **获取状态**: 在应用启动时调用 `/api/onboarding/step` 获取用户当前的引导状态
2. **下一步**: 在用户完成每个步骤时调用 `/api/onboarding/step/forward` 推进流程

这种设计确保了用户体验的连续性，支持用户在不同设备或会话间恢复引导进度。