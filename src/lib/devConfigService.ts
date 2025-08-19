/**
 * 开发配置管理服务
 * 用于管理开发环境中的各种配置选项
 */

import { apiConfigService } from './apiConfigService';

class DevConfigService {
  private static instance: DevConfigService;
  private listeners: ((config: DevConfig) => void)[] = [];

  private constructor() {}

  public static getInstance(): DevConfigService {
    if (!DevConfigService.instance) {
      DevConfigService.instance = new DevConfigService();
    }
    return DevConfigService.instance;
  }

  /**
   * 获取CopilotKit开发控制台显示状态
   */
  public getShowCopilotDevConsole(): boolean {
    // 生产环境始终不显示
    if (import.meta.env.PROD) {
      return false;
    }
    
    // 从localStorage读取用户设置，默认为true（开发环境默认显示）
    const saved = localStorage.getItem('dev_show_copilot_console');
    return saved ? saved === 'true' : true;
  }

  /**
   * 设置CopilotKit开发控制台显示状态
   */
  public setShowCopilotDevConsole(show: boolean): void {
    // 生产环境不允许设置
    if (import.meta.env.PROD) {
      return;
    }

    localStorage.setItem('dev_show_copilot_console', show.toString());
    
    // 通知所有监听器
    this.notifyListeners();
  }

  /**
   * 切换CopilotKit开发控制台显示状态
   */
  public toggleCopilotDevConsole(): boolean {
    const current = this.getShowCopilotDevConsole();
    const newValue = !current;
    this.setShowCopilotDevConsole(newValue);
    return newValue;
  }

  /**
   * 获取CopilotKit Runtime URL
   */
  public getCopilotKitRuntimeUrl(): string {
    const apiBaseUrl = apiConfigService.getApiBaseUrl();
    return `${apiBaseUrl}/copilotkit`;
  }

  /**
   * 获取所有开发配置
   */
  public getDevConfig(): DevConfig {
    return {
      showCopilotDevConsole: this.getShowCopilotDevConsole(),
      copilotKitRuntimeUrl: this.getCopilotKitRuntimeUrl()
    };
  }

  /**
   * 添加配置变更监听器
   */
  public addListener(listener: (config: DevConfig) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除配置变更监听器
   */
  public removeListener(listener: (config: DevConfig) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器配置已变更
   */
  private notifyListeners(): void {
    const config = this.getDevConfig();
    this.listeners.forEach(listener => listener(config));
  }

  /**
   * 重置所有开发配置为默认值
   */
  public resetToDefaults(): void {
    if (import.meta.env.PROD) {
      return;
    }

    localStorage.removeItem('dev_show_copilot_console');
    this.notifyListeners();
  }
}

// 开发配置接口
export interface DevConfig {
  showCopilotDevConsole: boolean;
  copilotKitRuntimeUrl: string;
}

// 导出单例实例
export const devConfigService = DevConfigService.getInstance();