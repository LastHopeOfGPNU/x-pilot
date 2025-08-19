import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { DashboardData } from '../services/dashboardService';

// 缓存项接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
  loading: boolean;
}

// 数据缓存Context类型
interface DataCacheContextType {
  // Dashboard相关
  getDashboardData: () => DashboardData | null;
  setDashboardData: (data: DashboardData) => void;
  isDashboardLoading: () => boolean;
  setDashboardLoading: (loading: boolean) => void;
  clearDashboardCache: () => void;
  
  // 通用缓存方法
  getCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, data: T) => void;
  clearCache: (key: string) => void;
  clearAllCache: () => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};

interface DataCacheProviderProps {
  children: ReactNode;
}

export const DataCacheProvider: React.FC<DataCacheProviderProps> = ({ children }) => {
  // 使用Map来存储不同类型的缓存数据
  const cacheRef = useRef<Map<string, CacheItem<any>>>(new Map());
  const [, forceUpdate] = useState({});
  
  // 强制组件重新渲染的方法
  const triggerUpdate = () => forceUpdate({});
  
  // Dashboard相关方法
  const getDashboardData = (): DashboardData | null => {
    const cacheItem = cacheRef.current.get('dashboard');
    return cacheItem?.data || null;
  };
  
  const setDashboardData = (data: DashboardData) => {
    cacheRef.current.set('dashboard', {
      data,
      timestamp: Date.now(),
      loading: false
    });
    triggerUpdate();
  };
  
  const isDashboardLoading = (): boolean => {
    const cacheItem = cacheRef.current.get('dashboard');
    return cacheItem?.loading || false;
  };
  
  const setDashboardLoading = (loading: boolean) => {
    const existingItem = cacheRef.current.get('dashboard');
    cacheRef.current.set('dashboard', {
      data: existingItem?.data || null,
      timestamp: existingItem?.timestamp || Date.now(),
      loading
    });
    triggerUpdate();
  };
  
  const clearDashboardCache = () => {
    cacheRef.current.delete('dashboard');
    triggerUpdate();
  };
  
  // 通用缓存方法
  const getCache = <T>(key: string): T | null => {
    const cacheItem = cacheRef.current.get(key);
    return cacheItem?.data || null;
  };
  
  const setCache = <T>(key: string, data: T) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      loading: false
    });
    triggerUpdate();
  };
  
  const clearCache = (key: string) => {
    cacheRef.current.delete(key);
    triggerUpdate();
  };
  
  const clearAllCache = () => {
    cacheRef.current.clear();
    triggerUpdate();
  };
  
  const value: DataCacheContextType = {
    getDashboardData,
    setDashboardData,
    isDashboardLoading,
    setDashboardLoading,
    clearDashboardCache,
    getCache,
    setCache,
    clearCache,
    clearAllCache
  };
  
  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
};