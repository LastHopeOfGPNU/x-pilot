import React, { useState, useEffect, useRef } from 'react';
import { Activity, MessageSquare, Repeat2, Search, Users, Star, Target } from 'lucide-react';
import { InspirationAccount, Card } from '../../types';
import CardItem from '../common/CardItem';
import AutoReplyCard from './AutoReplyCard';
import InspirationAccountCard from '../inspiration-accounts/InspirationAccountCard';
import Toast from '../common/Toast';
import { inspirationAccountService } from '../../lib/inspirationAccountService';
import { engagementService } from '../../lib/engagementService';
import { logger } from '../../utils/logger';

interface EngagementQueueProps {
  showInspirationAccounts?: boolean;
  onCardClick?: (card: Card) => void;
  onAccountClick?: (account: InspirationAccount) => void;
  selectedCardId?: string;
  selectedAccountId?: number;
}

type TabType = 'autoReply' | 'autoRepost' | 'starred' | 'outreach';

interface BatchOperation {
  accountId: number;
  action: 'add' | 'remove';
}

interface BatchOperationQueue {
  star: Map<number, BatchOperation>;
  target: Map<number, BatchOperation>;
}

const EngagementQueue: React.FC<EngagementQueueProps> = ({ 
  showInspirationAccounts = false, 
  onCardClick,
  onAccountClick,
  selectedCardId,
  selectedAccountId
}) => {
  const [inspirationAccounts, setInspirationAccounts] = useState<InspirationAccount[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>(showInspirationAccounts ? 'starred' : 'autoReply');
  // 为每个标签页独立的搜索状态，从localStorage恢复
  const [starredSearchQuery, setStarredSearchQuery] = useState(() => {
    try {
      return localStorage.getItem('inspiration-accounts-starred-search') || '';
    } catch {
      return '';
    }
  });
  const [outreachSearchQuery, setOutreachSearchQuery] = useState(() => {
    try {
      return localStorage.getItem('inspiration-accounts-outreach-search') || '';
    } catch {
      return '';
    }
  });
  const [searchResults, setSearchResults] = useState<InspirationAccount[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // 临时输入值状态，用于即时显示用户输入
  const [tempSearchInput, setTempSearchInput] = useState('');
  const [autoReplyData, setAutoReplyData] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [toast, setToast] = useState({
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
    isVisible: false
  });

  // 批量操作队列
  const batchQueueRef = useRef<BatchOperationQueue>({
    star: new Map(),
    target: new Map()
  });
  
  // 节流定时器
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const THROTTLE_DELAY = 1000; // 1秒延迟
  
  // 搜索防抖定时器
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const SEARCH_DEBOUNCE_DELAY = 300; // 300ms防抖延迟
  
  // 操作回调队列
  const operationCallbacksRef = useRef<Map<number, (success: boolean) => void>>(new Map());
  
  // 延迟加载outreach数据的定时器
  const delayedOutreachTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 已请求的账号类型标记
  const requestedTypesRef = useRef<Set<'starred' | 'outreach'>>(new Set());

  // Reset activeTab when showInspirationAccounts changes
  useEffect(() => {
    // 只在从其他页面切换到Inspiration Accounts时重置为starred
    // 避免在页面刷新时重置activeTab
    if (showInspirationAccounts && activeTab === 'autoReply') {
      setActiveTab('starred');
    } else if (!showInspirationAccounts && (activeTab === 'starred' || activeTab === 'outreach')) {
      setActiveTab('autoReply');
    }
  }, [showInspirationAccounts]);

  // 同步临时输入值与当前标签页的搜索状态
  useEffect(() => {
    if (tempSearchInput === '') {
      // 当临时输入值为空时，从当前标签页的搜索状态恢复
      const currentQuery = activeTab === 'starred' ? starredSearchQuery : 
                          activeTab === 'outreach' ? outreachSearchQuery : '';
      if (currentQuery) {
        setTempSearchInput(currentQuery);
      }
    }
  }, [activeTab, starredSearchQuery, outreachSearchQuery, tempSearchInput]);

  // 清理定时器
  useEffect(() => {
    return () => {
      // 清理批量操作节流定时器
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      
      // 清理搜索防抖定时器
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
      
      // 清理延迟加载outreach数据的定时器
      if (delayedOutreachTimerRef.current) {
        clearTimeout(delayedOutreachTimerRef.current);
      }
    };
  }, []);

  // 处理批量操作队列
  const processBatchOperations = async () => {
    const queue = batchQueueRef.current;
    const callbacks = operationCallbacksRef.current;
    let success = true;
    
    try {
      // 处理star操作
      if (queue.star.size > 0) {
        const addIds: number[] = [];
        const removeIds: number[] = [];
        
        queue.star.forEach((operation) => {
          if (operation.action === 'add') {
            addIds.push(operation.accountId);
          } else {
            removeIds.push(operation.accountId);
          }
        });
        
        if (addIds.length > 0) {
          await inspirationAccountService.batchToggleStarAccounts(addIds, 'add');
        }
        if (removeIds.length > 0) {
          await inspirationAccountService.batchToggleStarAccounts(removeIds, 'remove');
        }
        
        // 调用所有star操作的回调
        queue.star.forEach((operation, id) => {
          const callback = callbacks.get(id);
          if (callback) {
            callback(true);
            callbacks.delete(id);
          }
        });
        
        queue.star.clear();
      }
      
      // 处理target操作
      if (queue.target.size > 0) {
        const addIds: number[] = [];
        const removeIds: number[] = [];
        
        queue.target.forEach((operation) => {
          if (operation.action === 'add') {
            addIds.push(operation.accountId);
          } else {
            removeIds.push(operation.accountId);
          }
        });
        
        if (addIds.length > 0) {
          await inspirationAccountService.batchSetAccountsAsTarget(addIds, 'add');
        }
        if (removeIds.length > 0) {
          await inspirationAccountService.batchSetAccountsAsTarget(removeIds, 'remove');
        }
        
        // 调用所有target操作的回调
        queue.target.forEach((operation, id) => {
          const callback = callbacks.get(id);
          if (callback) {
            callback(true);
            callbacks.delete(id);
          }
        });
        
        queue.target.clear();
      }
    } catch (error) {
      logger.error('Batch operation failed:', error);
      showToast('Batch operation failed, restoring state', 'error');
      
      // If batch operation fails, notify all callbacks
      callbacks.forEach((callback) => {
        callback(false);
      });
      callbacks.clear();
      
      // If batch operation fails, reload data to restore correct state
      // 确保只传递有效的账号类型参数
      const validAccountType = (activeTab === 'starred' || activeTab === 'outreach') 
        ? activeTab 
        : 'starred'; // 默认使用starred作为备选
      
      // 清除已请求类型标记
      requestedTypesRef.current.clear();
      
      // 清除延迟加载定时器
      if (delayedOutreachTimerRef.current) {
        clearTimeout(delayedOutreachTimerRef.current);
        delayedOutreachTimerRef.current = null;
      }
      
      // 只加载当前活动标签的数据
      if (validAccountType === 'starred') {
        await fetchInspirationAccounts('starred');
      } else if (validAccountType === 'outreach') {
        await fetchInspirationAccounts('outreach');
      }
      
      success = false;
    }
    
    return success;
  };

  // 启动节流处理
  const scheduleThrottledProcess = () => {
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }
    
    throttleTimerRef.current = setTimeout(() => {
      processBatchOperations();
    }, THROTTLE_DELAY);
  };

  // 缓存上一次的数据，用于快速显示
  const cachedAccountsRef = useRef<{
    [key: string]: InspirationAccount[]
  }>({
    starred: [],
    outreach: []
  });

  // 缓存搜索结果，用于快速显示
  const cachedSearchResultsRef = useRef<{
    [key: string]: { [query: string]: InspirationAccount[] }
  }>({
    starred: {},
    outreach: {}
  });

  // Fetch inspiration accounts from API
  const fetchInspirationAccounts = async (type?: 'starred' | 'outreach', query?: string, isDelayedLoad: boolean = false) => {
    // 如果是延迟加载且该类型已经请求过，则不重复请求
    if (isDelayedLoad && requestedTypesRef.current.has(type || 'starred')) {
      return;
    }
    
    // 标记该类型已经请求过
    requestedTypesRef.current.add(type || 'starred');
    
    const accountType = type || 'starred';
    
    // 如果是搜索查询
    if (query) {
      // 先检查是否有缓存的搜索结果
      const cachedSearchResults = cachedSearchResultsRef.current[accountType][query];
      if (cachedSearchResults && cachedSearchResults.length > 0) {
        // 优先显示缓存的搜索结果
        setSearchResults(cachedSearchResults);
        setAccountsLoading(false);
        
        // 异步获取最新数据
        setTimeout(async () => {
          try {
            const response = await inspirationAccountService.getInspirationAccounts({
              type,
              q: query,
              page_size: 50
            });
            
            const transformedAccounts = response.data.map(account => 
              inspirationAccountService.transformToInspirationAccount(account)
            );
            
            // 更新搜索结果缓存
            cachedSearchResultsRef.current[accountType][query] = transformedAccounts;
            setSearchResults(transformedAccounts);
          } catch (error) {
            logger.error('Failed to refresh search results:', error);
          }
        }, 100);
        
        return;
      } else {
        // 没有缓存，显示loading状态
        setAccountsLoading(true);
      }
    } else {
      // 始终设置loading状态，确保loading效果在所有标签页都能显示
      // 但如果是延迟加载且不是当前活动标签，则不显示loading状态
      if (!(isDelayedLoad && activeTab !== type)) {
        setAccountsLoading(true);
      }
      
      // 如果有缓存数据，先显示缓存数据
      const cachedData = cachedAccountsRef.current[accountType];
      if (cachedData && cachedData.length > 0) {
        setInspirationAccounts(cachedData);
      }
    }

    try {
      const response = await inspirationAccountService.getInspirationAccounts({
        type,
        q: query,
        page_size: 50
      });
      
      const transformedAccounts = response.data.map(account => 
        inspirationAccountService.transformToInspirationAccount(account)
      );
      
      if (query) {
        // 更新搜索结果缓存
        cachedSearchResultsRef.current[accountType][query] = transformedAccounts;
        setSearchResults(transformedAccounts);
      } else {
        // 更新缓存
        cachedAccountsRef.current[accountType] = transformedAccounts;
        setInspirationAccounts(transformedAccounts);
      }
    } catch (error) {
      logger.error('Failed to fetch inspiration accounts:', error);
      showToast('Failed to load accounts', 'error');
    } finally {
      setAccountsLoading(false);
    }
  };

  // Load accounts when component mounts or tab changes
  useEffect(() => {
    if (!showInspirationAccounts) {
      return;
    }
    
    // 清除已请求类型标记
    requestedTypesRef.current.clear();
    
    // 清除延迟加载定时器
    if (delayedOutreachTimerRef.current) {
      clearTimeout(delayedOutreachTimerRef.current);
      delayedOutreachTimerRef.current = null;
    }
    
    // 确保只传递有效的账号类型参数
    const validAccountType = (activeTab === 'starred' || activeTab === 'outreach') 
      ? activeTab 
      : 'starred'; // 默认使用starred作为备选
    
    // 获取当前标签的搜索关键词
    const currentSearchQuery = validAccountType === 'starred' ? starredSearchQuery : outreachSearchQuery;
    
    // 如果有搜索关键词，执行搜索；否则加载默认数据
    if (currentSearchQuery.trim()) {
      // 有搜索词时，优先显示缓存的搜索结果，然后异步刷新
      const cachedSearchResults = cachedSearchResultsRef.current[validAccountType][currentSearchQuery];
      if (cachedSearchResults && cachedSearchResults.length > 0) {
        setSearchResults(cachedSearchResults);
        // 异步刷新搜索结果，不阻塞UI
        setTimeout(() => {
          fetchInspirationAccounts(validAccountType, currentSearchQuery);
        }, 100);
      } else {
        // 没有缓存时才立即获取
        fetchInspirationAccounts(validAccountType, currentSearchQuery);
      }
    } else {
      // 清空搜索结果
      setSearchResults([]);
      
      // 检查是否有缓存的列表数据
      const cachedListData = cachedAccountsRef.current[validAccountType];
      if (cachedListData && cachedListData.length > 0) {
        // 优先显示缓存数据
        setInspirationAccounts(cachedListData);
        // 异步刷新列表数据
        setTimeout(() => {
          if (validAccountType === 'starred') {
            fetchInspirationAccounts('starred');
          } else if (validAccountType === 'outreach') {
            fetchInspirationAccounts('outreach');
          }
        }, 100);
      } else {
        // 没有缓存时才立即获取
        if (validAccountType === 'starred') {
          fetchInspirationAccounts('starred');
        } else if (validAccountType === 'outreach') {
          fetchInspirationAccounts('outreach');
        }
      }
    }
  }, [showInspirationAccounts, activeTab, starredSearchQuery, outreachSearchQuery]);

  // Fetch engagement queue data from API
  const fetchEngagementData = async () => {
    setLoading(true);
    try {
      const response = await engagementService.getEngagements({
        type: 'reply', // 只获取回复类型的互动
        status: 'pending', // 只获取待处理状态的互动
        page_size: 50
      });
      
      // 转换API响应为Card格式
      const transformedCards = response.data.map(item => 
        engagementService.transformToCard(item)
      );
      
      setAutoReplyData(transformedCards);
    } catch (error) {
      logger.error('Failed to fetch engagement data:', error);
      showToast('Failed to load engagement queue', 'error');
      // If API call fails, set to empty array instead of using mock data
      setAutoReplyData([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up polling for engagement data every 30 seconds
  useEffect(() => {
    if (activeTab === 'autoReply') {
      fetchEngagementData();
      const interval = setInterval(fetchEngagementData, 30000); // 30秒轮询一次
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({
      message,
      type,
      isVisible: true
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const handleRejectReply = async (cardId: string) => {
    try {
      // 调用API拒绝回复
      await engagementService.rejectReply({ engagement_id: cardId });
      
      // 从列表中移除该项
      setAutoReplyData(prev => prev.filter(card => card.id !== cardId));
      showToast('Reply rejected successfully', 'info');
    } catch (error) {
      logger.error('Failed to reject reply:', error);
      showToast('Failed to reject reply', 'error');
    }
  };

  const handlePostReply = async (cardId: string, reply: string) => {
    try {
      // 调用API发布回复
      await engagementService.postReply({ 
        engagement_id: cardId, 
        content: reply 
      });
      
      // 从列表中移除该项
      setAutoReplyData(prev => prev.filter(card => card.id !== cardId));
      showToast('Reply posted successfully', 'success');
    } catch (error) {
      logger.error('Failed to post reply:', error);
      showToast('Failed to post reply', 'error');
    }
  };

  const handleToggleTarget = async (id: number, isTargeted: boolean) => {
    // 立即更新UI状态（乐观更新）
    setInspirationAccounts(prev => 
      prev.map(account => 
        account.id === id ? { ...account, isTargeted } : account
      )
    );
    
    if (searchResults.length > 0) {
      setSearchResults(prev => 
        prev.map(account => 
          account.id === id ? { ...account, isTargeted } : account
        )
      );
    }

    // 添加到批量操作队列
    batchQueueRef.current.target.set(id, {
      accountId: id,
      action: isTargeted ? 'add' : 'remove'
    });
    
    // 创建一个Promise，在批量操作完成后解析
    return new Promise<boolean>((resolve) => {
      // 注册回调
      operationCallbacksRef.current.set(id, resolve);
      
      // 启动节流处理
      scheduleThrottledProcess();
    });
  };

  const handleToggleStar = async (id: number, starred: boolean) => {
    // 立即更新UI状态（乐观更新）
    setInspirationAccounts(prev => 
      prev.map(account => 
        account.id === id ? { ...account, starred } : account
      )
    );

    if (searchResults.length > 0) {
      setSearchResults(prev => 
        prev.map(account => 
          account.id === id ? { ...account, starred } : account
        )
      );
    }

    // 添加到批量操作队列
    batchQueueRef.current.star.set(id, {
      accountId: id,
      action: starred ? 'add' : 'remove'
    });
    
    // 创建一个Promise，在批量操作完成后解析
    return new Promise<boolean>((resolve) => {
      // 注册回调
      operationCallbacksRef.current.set(id, resolve);
      
      // 启动节流处理
      scheduleThrottledProcess();
    });
  };

  // 执行实际搜索的函数
  const performSearch = async (query: string) => {
    if (query.trim()) {
      setIsSearching(true);
      
      // 清除延迟加载定时器
      if (delayedOutreachTimerRef.current) {
        clearTimeout(delayedOutreachTimerRef.current);
        delayedOutreachTimerRef.current = null;
      }
      
      // 确保只传递有效的账号类型参数
      const validAccountType = (activeTab === 'starred' || activeTab === 'outreach') 
        ? activeTab 
        : 'outreach'; // 默认使用outreach作为备选
      
      try {
        // 搜索时不使用延迟加载
        await fetchInspirationAccounts(validAccountType, query);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
      
      // 清除搜索缓存
      requestedTypesRef.current.clear();
      
      // 重新加载当前标签页的数据
      const validAccountType = (activeTab === 'starred' || activeTab === 'outreach') 
        ? activeTab 
        : 'outreach';
      
      await fetchInspirationAccounts(validAccountType);
    }
  };

  const handleSearch = (query: string) => {
    // 立即更新临时输入值以提供即时反馈
    setTempSearchInput(query);
    
    // 清除之前的防抖定时器
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    
    // 设置新的防抖定时器
    searchDebounceTimerRef.current = setTimeout(() => {
      // 在防抖延迟后更新状态并持久化
      if (activeTab === 'starred') {
        setStarredSearchQuery(query);
        try {
          localStorage.setItem('inspiration-accounts-starred-search', query);
        } catch {
          // 忽略localStorage错误
        }
      } else if (activeTab === 'outreach') {
        setOutreachSearchQuery(query);
        try {
          localStorage.setItem('inspiration-accounts-outreach-search', query);
        } catch {
          // 忽略localStorage错误
        }
      }
      
      // 清除临时输入值，使用正式状态
      setTempSearchInput('');
      performSearch(query);
    }, SEARCH_DEBOUNCE_DELAY);
  };

  // 获取当前标签页的搜索关键词
  const getCurrentSearchQuery = () => {
    // 如果有临时输入值，优先返回临时输入值
    if (tempSearchInput !== '') return tempSearchInput;
    
    if (activeTab === 'starred') return starredSearchQuery;
    if (activeTab === 'outreach') return outreachSearchQuery;
    return '';
  };

  // Get display accounts based on current tab and search
  const displayAccounts = getCurrentSearchQuery().trim() 
    ? searchResults 
    : inspirationAccounts.filter(account => {
        // 修复过滤逻辑：outreach标签页应该显示所有账号，包括已starred的
        if (activeTab === 'starred') return account.starred;
        if (activeTab === 'outreach') return true; // 显示所有账号
        return true;
      });

  const totalItems = showInspirationAccounts ? displayAccounts.length : autoReplyData.length;
  const title = showInspirationAccounts ? 'Inspiration Accounts' : 'Engagement Queue';

  if (showInspirationAccounts) {
    // Inspiration Accounts display logic
    return (
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm w-full max-w-lg">
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('starred')}
              data-guide="starred-tab"
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'starred'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Star size={16} />
              <span className="hidden sm:inline">Starred</span>
            </button>
            <button
              onClick={() => setActiveTab('outreach')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'outreach'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Target size={16} />
              <span className="hidden sm:inline">Outreach</span>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={getCurrentSearchQuery()}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

          </div>

          {/* Items Count */}
          <div className="flex items-center space-x-2">
            <Users size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600">
              {displayAccounts.length} accounts
            </span>
            {(isSearching || accountsLoading) && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 ml-2"></div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 show-scrollbar">
          {!accountsLoading && displayAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {getCurrentSearchQuery().trim() ? 'No accounts found' : (activeTab === 'starred' ? 'No starred accounts' : 'No outreach accounts available')}
              </p>
            </div>
          ) : (
            displayAccounts.map((account) => (
              <InspirationAccountCard 
                key={account.id} 
                account={account} 
                onToggleTarget={handleToggleTarget}
                onToggleStar={handleToggleStar}
                onShowToast={showToast}
                onClick={onAccountClick}
                isSelected={selectedAccountId === account.id}
              />
            ))
          )}
        </div>

        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </div>
    );
  }

  // Engagement display logic (formerly Activity Queue)
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm w-full max-w-2xl">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('autoReply')}
            data-guide="auto-reply-tab"
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'autoReply'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">autoReply</span>
          </button>
          <button
            onClick={() => setActiveTab('autoRepost')}
            data-guide="auto-repost-tab"
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'autoRepost'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Repeat2 size={16} />
            <span className="hidden sm:inline">autoRepost</span>
          </button>
        </div>

        {/* Items Count */}
        <div className="flex items-center space-x-2">
          <Activity size={20} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-600">
            {activeTab === 'autoReply' ? autoReplyData.length : 0} items
          </span>
          {loading && activeTab === 'autoReply' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 show-scrollbar" data-guide="auto-reply-list">
        {activeTab === 'autoReply' ? (
          autoReplyData.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No autoReply data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {autoReplyData.map((card) => (
                <AutoReplyCard
                  key={card.id}
                  card={card}
                  isSelected={selectedCardId === card.id}
                  onClick={() => onCardClick?.(card)}
                  onReject={handleRejectReply}
                  onPost={handlePostReply}
                />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <Repeat2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">autoRepost feature coming soon</p>
          </div>
        )}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default EngagementQueue;