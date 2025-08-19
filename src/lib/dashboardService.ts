// Removed mock dashboard data import
import { Users, Zap, PenTool, Calendar, MessageSquare, Star, BarChart3, Activity, Heart, Target } from 'lucide-react';
import { supabase } from './supabase';
import { apiConfigService } from './apiConfigService';

// Dashboard API service
export interface DashboardStats {
  total_replies: number;
  total_replies_change: string;
  engagement_rate: number;
  engagement_rate_change: string;
}



export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  time_ago: string;
  created_at: string;
}

export interface SystemStatus {
  auto_engagement_active: boolean;
  reply_queue_processing: boolean;
  all_accounts_connected: boolean;
}

export interface GrowthMetrics {
  status: string;
  description: string;
}

export interface Account {
  id: string;
  username: string;
  display_name: string;
  profile_image_url: string | null;
  followers_count: number;
  verified: boolean;
  is_starred: boolean;
  is_target: boolean;
}

export interface InspirationAccountsOverview {
  accounts: Account[];
  total_count: number;
  starred_count: number;
  target_count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_activities: RecentActivity[];
  system_status: SystemStatus;
  growth_metrics: GrowthMetrics;
  all_systems_active: boolean;
  inspiration_accounts_overview: InspirationAccountsOverview;
}

class DashboardService {
  private get baseUrl(): string {
    return apiConfigService.getApiBaseUrl();
  }

  constructor() {
    // baseUrl 现在通过 getter 动态获取
  }

  // 获取认证头
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('用户未登录');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }

  async getDashboardData(includeRecentActivities: boolean = true, activityLimit: number = 5): Promise<DashboardData> {
    try {
      // 获取认证头
      const headers = await this.getAuthHeaders();
      
      // Make actual API call to /api/dashboard
      const params = new URLSearchParams({
        include_recent_activities: includeRecentActivities.toString(),
        activity_limit: activityLimit.toString()
      });
      const response = await fetch(`${this.baseUrl}/api/dashboard?${params}`, {
        method: 'GET',
        headers
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
      
    } catch (error) {

      throw error;
    }
  }

  // 图标映射函数
  getIconComponent(iconName: string) {
    const iconMap: { [key: string]: any } = {
      'users': Users,
      'zap': Zap,
      'edit': PenTool,
      'calendar': Calendar,
      'message-circle': MessageSquare,
      'message-square': MessageSquare,
      'star': Star,
      'bar-chart': BarChart3,
      'heart': Heart,
      'target': Target,
    };
    return iconMap[iconName] || Activity;
  }

  // 根据活动类型获取图标和颜色
  getActivityStyle(type: string) {
    const typeMap: { [key: string]: { icon: any; color: string } } = {
      'auto_engagement': { icon: Heart, color: 'green' },
      'inspiration_accounts': { icon: Users, color: 'blue' },
      'posts_topics': { icon: MessageSquare, color: 'purple' },
      'marketing_strategy': { icon: Target, color: 'orange' },
      'dashboard': { icon: BarChart3, color: 'blue' },
      'config': { icon: Star, color: 'cyan' },
      'profile': { icon: Users, color: 'yellow' }
    };
    return typeMap[type] || { icon: Activity, color: 'blue' };
  }

  // 颜色映射函数
  getColorClasses(color: string) {
    const colorMap: { [key: string]: { bg: string; text: string; gradient: string } } = {
      'blue': {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        gradient: 'bg-gradient-to-br from-[#4792E6] to-[#3b82f6]'
      },
      'purple': {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        gradient: 'bg-gradient-to-br from-[#4792E6]/80 to-[#6366f1]'
      },
      'green': {
        bg: 'bg-green-50',
        text: 'text-green-600',
        gradient: 'bg-gradient-to-br from-[#4792E6]/70 to-[#10b981]'
      },
      'cyan': {
        bg: 'bg-cyan-50',
        text: 'text-cyan-600',
        gradient: 'bg-gradient-to-br from-[#4792E6]/60 to-[#06b6d4]'
      },
      'yellow': {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        gradient: 'bg-gradient-to-br from-yellow-400 to-yellow-500'
      }
    };
    return colorMap[color] || colorMap['blue'];
  }
}

export const dashboardService = new DashboardService();