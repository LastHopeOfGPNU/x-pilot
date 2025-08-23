import React from 'react';
import { MessageSquare, Heart, Repeat2, Bookmark, ExternalLink, Clock, User, Bot, Calendar, Tag, TrendingUp, Star, Users, Eye, MapPin, Link, MessageCircle, Share, BarChart3, Target, Zap, CheckCircle, AlertCircle, ChevronRight, FileText, Lightbulb, TrendingDown, Activity, Globe, Sparkles, Copy, Edit3, Trash2, Send } from 'lucide-react';
import { Card, InspirationAccount, Post } from '../../types';
import { ConfigItem } from '../config/Config';
import { VerifiedBadge, formatNumber } from '../../utils/cardUtils';
import { MarketingStrategy as MarketingStrategyType } from '../../App';

// 定义本地数据类型
interface QueueItem {
  id: string;
  type: 'post' | 'thread';
  content: string;
  createdTime: string;
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'published';
  platform: string;
  threadCount?: number;
  aiGenerated?: boolean;
  tags?: string[];
}

interface ContentScheduleItem {
  id: string;
  day: string;
  timeSlot: string;
  activity: 'post' | 'engagement' | 'analysis' | 'planning';
  content: string;
  platform: string[];
  status: 'scheduled' | 'completed' | 'pending';
}

// 本地数据定义（已清空mock数据）
const mockAccountPosts = {};

const mockAccountAnalytics = {};

const mockContentSchedule: ContentScheduleItem[] = [];

// Post/Thread types
interface QueueItem {
  id: string;
  type: 'post' | 'thread';
  content: string;
  createdTime: string;
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'published';
  platform: 'twitter';
  threadCount?: number;
  aiGenerated: boolean;
  tags: string[];
}

interface ResultsAreaProps {
  selectedCard: Card | null;
  selectedAccount: InspirationAccount | null;
  selectedConfigItem: ConfigItem | null;
  selectedPostId?: string | null;
  selectedPost?: Post | null;
  selectedStrategy?: MarketingStrategyType | null;
}

const ResultsArea: React.FC<ResultsAreaProps> = ({ selectedCard, selectedAccount, selectedConfigItem, selectedPostId, selectedPost, selectedStrategy }) => {
  // 本地数据定义（已清空mock数据）
  const mockPosts: QueueItem[] = [];
  const mockThreads: QueueItem[] = [];

  // Helper functions for post display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'published': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'post' ? 
      <MessageSquare size={16} className="text-blue-500" /> : 
      <FileText size={16} className="text-green-500" />;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleEdit = (postId: string) => {
    // Handle edit logic
  };

  const handleDelete = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      // Handle delete logic
    }
  };

  const handlePublish = (postId: string) => {
    // Handle publish logic
  };

  const renderPostDetails = (post: Post) => {
    return (
      <div className="h-full overflow-y-auto">
        {/* Post Header */}
        <div className="bg-gradient-to-r from-blue-500 to-[#4792E6] p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="flex justify-center items-center w-16 h-16 bg-white/20 rounded-full">
              <Bot size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {post.type === 'thread' ? 'Thread Details' : 'Post Details'}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(post.status)} bg-white/90`}>
                  {post.status}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-blue-100">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(post.type)}
                  <span className="capitalize">{post.type}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>Created: {post.createdTime}</span>
                </div>
                {post.scheduledTime && (
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>Scheduled: {post.scheduledTime}</span>
                  </div>
                )}
                {post.type === 'thread' && (
                  <div className="flex items-center space-x-1">
                    <FileText size={14} />
                    <span>{post.threadCount} tweets</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Post Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
              Content
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 border">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                {post.content}
              </p>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-blue-500" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStrategyDetails = (strategy: MarketingStrategyType) => {
    const getStrategyIcon = (type: string) => {
      switch (type) {
        case 'content': return <FileText className="w-6 h-6" />;
        case 'operation': return <Target className="w-6 h-6" />;
        case 'engagement': return <MessageCircle className="w-6 h-6" />;
        case 'growth': return <TrendingUp className="w-6 h-6" />;
        case 'analytics': return <BarChart3 className="w-6 h-6" />;
        default: return <Lightbulb className="w-6 h-6" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-700 border-green-200';
        case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'paused': return 'bg-gray-100 text-gray-700 border-gray-200';
        case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return 'bg-red-100 text-red-700 border-red-200';
        case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
    };

    const renderContentSchedule = () => {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const timeSlots = ['09:00', '12:00', '15:00', '18:00', '21:00'];

      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            Weekly Content Schedule
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-700">Time</th>
                  {daysOfWeek.map(day => (
                    <th key={day} className="text-left p-3 border-b border-gray-200 font-medium text-gray-700 min-w-[120px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time} className="hover:bg-gray-50">
                    <td className="p-3 border-b border-gray-100 font-medium text-gray-600">{time}</td>
                    {daysOfWeek.map(day => {
                      const scheduleItem = mockContentSchedule.find(
                        item => item.day === day && item.timeSlot === time
                      );
                      
                      return (
                        <td key={`${day}-${time}`} className="p-3 border-b border-gray-100">
                          {scheduleItem ? (
                            <div className={`p-2 rounded-lg text-xs ${
                              scheduleItem.activity === 'post' 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : scheduleItem.activity === 'engagement'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-blue-100 text-[#4792E6] border border-blue-200'
                            }`}>
                              <div className="font-medium mb-1">
                                {scheduleItem.activity === 'post' ? '📝 Post' : 
                                 scheduleItem.activity === 'engagement' ? '💬 Engage' : 
                                 scheduleItem.activity === 'analysis' ? '📊 Analyze' : '📋 Plan'}
                              </div>
                              <div className="text-xs opacity-80">{scheduleItem.content}</div>
                              {scheduleItem.platform && (
                                <div className="mt-1 text-xs opacity-60">
                                  {Array.isArray(scheduleItem.platform) ? scheduleItem.platform.join(', ') : scheduleItem.platform}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-16"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="h-full overflow-y-auto">
        {/* Strategy Header */}
        <div className="bg-gradient-to-r from-blue-500 to-[#4792E6] p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="flex justify-center items-center w-16 h-16 bg-white/20 rounded-full text-white">
              {getStrategyIcon(strategy.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold">{strategy.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(strategy.status)} bg-white/90`}>
                  {strategy.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(strategy.priority)} bg-white/90`}>
                  {strategy.priority} priority
                </span>
              </div>
              <p className="text-blue-100 mb-4 text-base">{strategy.description}</p>
              <div className="flex items-center space-x-6 text-sm text-blue-100">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>Created: {strategy.createdAt}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>Updated: {strategy.updatedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Strategy Metrics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
              Performance Metrics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatNumber(strategy.metrics.reach)}</div>
                <div className="text-sm text-gray-600">Total Reach</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{strategy.metrics.engagement}%</div>
                <div className="text-sm text-gray-600">Engagement Rate</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-[#4792E6]">{strategy.metrics.conversion}%</div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
            </div>
          </div>

          {/* Content Schedule for Content Strategy */}
          {strategy.type === 'content' && renderContentSchedule()}

          {/* Strategy Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              Strategy Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Objectives</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {strategy.type === 'content' && (
                    <>
                      <li>Increase brand awareness through consistent content publishing</li>
                      <li>Engage with audience during peak hours</li>
                      <li>Build thought leadership in the industry</li>
                      <li>Drive traffic to website and landing pages</li>
                    </>
                  )}
                  {strategy.type === 'engagement' && (
                    <>
                      <li>Respond to comments within 2 hours</li>
                      <li>Engage with industry influencers daily</li>
                      <li>Participate in relevant conversations</li>
                      <li>Build community relationships</li>
                    </>
                  )}
                  {strategy.type === 'growth' && (
                    <>
                      <li>Increase follower count by 20% monthly</li>
                      <li>Expand reach to new demographics</li>
                      <li>Collaborate with industry partners</li>
                      <li>Optimize content for discovery</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Key Activities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {strategy.type === 'content' && (
                    <>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Daily content creation</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Content scheduling</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Performance monitoring</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Audience engagement</span>
                      </div>
                    </>
                  )}
                  {strategy.type === 'engagement' && (
                    <>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Comment monitoring</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Influencer outreach</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Community building</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Response automation</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-500" />
              Action Items
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Review content calendar for next week</div>
                  <div className="text-sm text-gray-600">Due: Tomorrow</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Analyze engagement metrics</div>
                  <div className="text-sm text-gray-600">Due: End of week</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Update strategy documentation</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderAccountProfile = (account: InspirationAccount) => {
    const accountPosts = mockAccountPosts[account.id] || [];
    const accountAnalytics = mockAccountAnalytics[account.id];

    return (
      <div className="h-full overflow-y-auto">
        {/* Account Header */}
        <div className="bg-gradient-to-r from-blue-500 to-[#4792E6] p-6 text-white">
          <div className="flex items-start space-x-4">
            <img
              src={account.avatar}
              alt={account.name}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold">{account.name}</h1>
                {account.verified && <VerifiedBadge />}
                {account.starred && <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
              </div>
              <p className="text-blue-100 mb-2">{account.handle.startsWith('@') ? account.handle : `@${account.handle}`}</p>
              <p className="text-sm text-blue-100 mb-4">{account.bio}</p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{formatNumber(account.followers)}</span>
                </div>
                {account.following && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{formatNumber(account.following)}</span>
                  </div>
                )}
                {account.tweets && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{formatNumber(account.tweets)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{formatNumber(account.likes)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Analytics Dashboard */}
          {accountAnalytics && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Account Analytics
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{accountAnalytics.influence}</div>
                  <div className="text-sm text-gray-600">Influence Score</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{accountAnalytics.engagement}%</div>
                  <div className="text-sm text-gray-600">Engagement Rate</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-[#4792E6]">{formatNumber(accountAnalytics.reach)}</div>
                  <div className="text-sm text-gray-600">Avg Reach</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatNumber(accountAnalytics.avgLikes)}</div>
                  <div className="text-sm text-gray-600">Avg Likes</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Posts */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-blue-500" />
                Recent Posts ({accountPosts.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {accountPosts.length > 0 ? (
                accountPosts.map((post) => (
                  <div key={post.id} className="p-8 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <img
                        src={account.avatar}
                        alt={account.name}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="font-semibold text-gray-900">{account.name}</span>
                          {account.verified && <VerifiedBadge />}
                          <span className="text-gray-500">{account.handle.startsWith('@') ? account.handle : `@${account.handle}`}</span>
                          <span className="text-gray-500">·</span>
                          <span className="text-gray-500 text-sm">{post.time}</span>
                        </div>
                        <p className="text-gray-900 mb-4 leading-relaxed text-base">{post.content}</p>
                        <div className="flex items-center space-x-8 text-gray-500">
                          <div className="flex items-center space-x-2 hover:text-blue-500 cursor-pointer transition-colors">
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium">{formatNumber(post.stats.comments)}</span>
                          </div>
                          <div className="flex items-center space-x-2 hover:text-green-500 cursor-pointer transition-colors">
                            <Repeat2 className="w-5 h-5" />
                            <span className="text-sm font-medium">{formatNumber(post.stats.retweets)}</span>
                          </div>
                          <div className="flex items-center space-x-2 hover:text-red-500 cursor-pointer transition-colors">
                            <Heart className="w-5 h-5" />
                            <span className="text-sm font-medium">{formatNumber(post.stats.likes)}</span>
                          </div>
                          <div className="flex items-center space-x-2 hover:text-blue-500 cursor-pointer transition-colors">
                            <Eye className="w-5 h-5" />
                            <span className="text-sm font-medium">{formatNumber(post.stats.views || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No recent posts available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Render card details function
  const renderCardDetails = (card: Card) => {
    return (
      <div className="h-full overflow-y-auto">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-500 to-[#4792E6] p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex justify-center items-center w-16 h-16 bg-white/20 rounded-full">
                {card.avatar ? (
                  <img src={card.avatar} alt={card.author} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={24} className="text-white" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {card.author || 'Card Details'}
                </h1>
                {card.handle && (
                  <div className="text-sm text-blue-100 mt-1">
                    {card.handle}
                  </div>
                )}
              </div>
            </div>
            {card.username && card.tweetId && (
              <button
                onClick={() => {
                  window.open(`https://x.com/${card.username}/status/${card.tweetId}`, '_blank');
                }}
                className="p-2 text-white/80 transition-colors hover:text-white hover:bg-white/20 rounded-full"
                title="在X上查看原推"
              >
                <ExternalLink size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Card Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
              Content
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 border">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                {card.content}
              </p>
            </div>
          </div>

          {/* Suggested Reply */}
          {card.suggestedReply && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-green-500" />
                Suggested Reply
              </h2>
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                  {card.suggestedReply}
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
              Engagement Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {formatNumber(card.stats?.likes || card.likes || 0)}
                </div>
                <div className="text-sm text-gray-600 flex items-center">
                  <Heart size={14} className="mr-1" />
                  Likes
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(card.stats?.retweets || card.retweets || 0)}
                </div>
                <div className="text-sm text-gray-600 flex items-center">
                  <Repeat2 size={14} className="mr-1" />
                  Retweets
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(card.stats?.comments || card.replies || 0)}
                </div>
                <div className="text-sm text-gray-600 flex items-center">
                  <MessageCircle size={14} className="mr-1" />
                  Replies
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#4792E6]">
                  {formatNumber(card.stats?.views || card.views || 0)}
                </div>
                <div className="text-sm text-gray-600 flex items-center">
                  <Eye size={14} className="mr-1" />
                  Views
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {card.metadata && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-blue-500" />
                Metadata
              </h2>
              <div className="space-y-3">
                {card.metadata.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {card.metadata.category}
                    </span>
                  </div>
                )}
                {card.metadata.priority && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      card.metadata.priority === 'High' ? 'bg-red-100 text-red-700' :
                      card.metadata.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {card.metadata.priority}
                    </span>
                  </div>
                )}
                {card.metadata.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="text-gray-900">{card.metadata.deadline}</span>
                  </div>
                )}
                {card.metadata.assignee && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Assignee:</span>
                    <span className="text-gray-900">{card.metadata.assignee}</span>
                  </div>
                )}
                {card.metadata.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-gray-900">{card.metadata.status}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inspiration Account */}
          {card.inspirationAccount && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Related Account
              </h2>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img 
                  src={card.inspirationAccount.avatar} 
                  alt={card.inspirationAccount.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{card.inspirationAccount.name}</h3>
                    {card.inspirationAccount.verified && <VerifiedBadge />}
                  </div>
                  <p className="text-gray-600">@{card.inspirationAccount.handle}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.inspirationAccount.bio}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // If a strategy is selected, show strategy details
  if (selectedStrategy) {
    return (
      <div className="h-full bg-gray-50">
        {renderStrategyDetails(selectedStrategy)}
      </div>
    );
  }

  // If a post is selected, show post details
  if (selectedPostId && selectedPost) {
    return (
      <div className="h-full bg-gray-50">
        {renderPostDetails(selectedPost)}
      </div>
    );
  }

  // If no item is selected, show default message
  if (!selectedCard && !selectedAccount && !selectedConfigItem && !selectedPostId && !selectedStrategy) {
    return (
      <div className="flex flex-1 justify-center items-center bg-white h-full">
        <div className="text-center">
          <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 bg-blue-50 rounded-full">
            <MessageSquare size={32} className="text-[#4792E6]" />
          </div>
          <h3 className="mb-3 text-xl font-semibold text-gray-900">Select Content to View Details</h3>
          <p className="text-gray-500 text-base">Choose an item from the left to view detailed information</p>
        </div>
      </div>
    );
  }

  // If a config item is selected, show config details
  if (selectedConfigItem) {
    return (
      <div className="h-full bg-gray-50">
        <div className="h-full overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Config Item Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className={`flex justify-center items-center w-12 h-12 rounded-lg ${
                  selectedConfigItem.type === 'reply' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {selectedConfigItem.type === 'reply' ? (
                    <MessageSquare size={24} className="text-[#4792E6]" />
                  ) : (
                    <Repeat2 size={24} className="text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedConfigItem.title}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedConfigItem.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedConfigItem.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>Last Updated: {selectedConfigItem.time}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply-specific fields */}
            {selectedConfigItem.type === 'reply' && (
              <>
                {/* Prompt Section */}
                {selectedConfigItem.prompt && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Bot className="w-5 h-5 mr-2 text-blue-500" />
                      Generation Prompt
                    </h2>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-gray-900 leading-relaxed">{selectedConfigItem.prompt}</p>
                    </div>
                  </div>
                )}

                {/* Style Selection - Disabled */}
                {selectedConfigItem.style && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-400 mb-4 flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-gray-400" />
                      Reply Style (Temporarily Disabled)
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400">Current Style:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedConfigItem.style === 'funny' ? 'bg-gray-100 text-gray-600' :
                          selectedConfigItem.style === 'professional' ? 'bg-gray-100 text-gray-600' :
                          selectedConfigItem.style === 'casual' ? 'bg-gray-100 text-gray-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedConfigItem.style === 'funny' ? 'Humorous' :
                           selectedConfigItem.style === 'professional' ? 'Professional' :
                           selectedConfigItem.style === 'casual' ? 'Casual' : 'Formal'}
                        </span>
                      </div>
                      <select 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                        defaultValue={selectedConfigItem.style}
                        disabled
                      >
                        <option value="professional">Professional</option>
                        <option value="funny">Humorous</option>
                        <option value="casual">Casual</option>
                        <option value="formal">Formal</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedConfigItem.type === 'reply' ? 'Reply Content' : 'Repost Content'}
              </h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 leading-relaxed">{selectedConfigItem.content}</p>
              </div>
            </div>



            {/* Statistics (if completed) - 暂时隐藏，因为API中没有status字段 */}
            {/* {selectedConfigItem.status === 'completed' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Execution Results</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Interactions</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">89</div>
                    <div className="text-sm text-gray-600">Likes</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-[#4792E6]">1.2K</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">5</div>
                    <div className="text-sm text-gray-600">Reposts</div>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>
      </div>
    );
  }

  // If a card is selected, show card details
  if (selectedCard) {
    return (
      <div className="h-full bg-gray-50">
        {renderCardDetails(selectedCard)}
      </div>
    );
  }

  // If an account is selected, show account profile
  if (selectedAccount) {
    return (
      <div className="h-full bg-gray-50">
        {renderAccountProfile(selectedAccount)}
      </div>
    );
  }

};

export default ResultsArea;