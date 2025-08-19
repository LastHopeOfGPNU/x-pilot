import React, { useState } from 'react';
import { Heart, Repeat2, MessageSquare, X, Send, Edit3, Check, Eye } from 'lucide-react';
import { Card } from '../types';
import ConfirmModal from './ConfirmModal';

interface AutoReplyCardProps {
  card: Card;
  isSelected?: boolean;
  onClick?: (card: Card) => void;
  onReject?: (cardId: string) => void;
  onPost?: (cardId: string, reply: string) => void;
}

const AutoReplyCard: React.FC<AutoReplyCardProps> = ({ 
  card, 
  isSelected = false, 
  onClick,
  onReject,
  onPost
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReply, setEditedReply] = useState(card.suggestedReply || '');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      // Save logic here if needed
    } else {
      setIsEditing(true);
    }
  };

  const handleReject = () => {
    onReject?.(card.id);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Save logic here
  };

  const handlePostReply = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPost = async () => {
    try {
      setIsPosting(true);
      onPost?.(card.id, editedReply);
      setShowConfirmModal(false);
      setIsPosting(false);
    } catch (error) {
      console.error('Failed to post reply:', error);
      setIsPosting(false);
    }
  };

  const handlePost = async () => {
    try {
      setIsPosting(true);
      onPost?.(card.id, editedReply);
      setIsPosting(false);
    } catch (error) {
      console.error('Failed to post reply:', error);
      setIsPosting(false);
    }
  };

  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm transition-all duration-200 cursor-pointer max-w-2xl w-full ${
        isSelected 
          ? 'bg-blue-50 border-2 border-blue-500 ring-2 ring-blue-200 shadow-lg' 
          : 'border border-gray-200 hover:shadow-md'
      }`}
      onClick={() => onClick?.(card)}
    >
      {/* Original Tweet */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <img
              src={card.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.author || 'User')}&background=6366f1&color=fff&size=40`}
              alt={card.author || 'User'}
              className="object-cover w-10 h-10 rounded-full border border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.author || 'User')}&background=6366f1&color=fff&size=40`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <span className="font-semibold text-gray-900">{card.author || 'Unknown User'}</span>
            </div>
            <div className="flex items-center mb-2 space-x-2">
              <span className="text-sm text-gray-500">{card.handle || '@unknown'}</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-500">{card.time}</span>
            </div>
            <p className="mb-3 text-gray-900 whitespace-pre-line">
              {card.content}
            </p>
            
            {/* Stats Row */}
            <div className="hidden sm:flex items-center space-x-6 text-gray-500">
              <div className="flex items-center space-x-1 transition-colors cursor-pointer hover:text-blue-500">
                <MessageSquare size={16} />
                <span className="text-sm">{formatNumber(card.replies)}</span>
              </div>
              <div className="flex items-center space-x-1 transition-colors cursor-pointer hover:text-green-500">
                <Repeat2 size={16} />
                <span className="text-sm">{formatNumber(card.retweets)}</span>
              </div>
              <div className="flex items-center space-x-1 transition-colors cursor-pointer hover:text-red-500">
                <Heart size={16} />
                <span className="text-sm">{formatNumber(card.likes)}</span>
              </div>
              <div className="flex items-center space-x-1 transition-colors cursor-pointer hover:text-blue-500">
                <Eye size={16} />
                <span className="text-sm">{formatNumber(card.views)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Reply Section */}
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs sm:text-sm font-medium tracking-wide text-gray-700 uppercase">
              SUGGESTED REPLY
            </span>
          </div>
          <button
            onClick={handleEditToggle}
            className="flex items-center px-2 py-1 space-x-1 text-xs text-blue-600 rounded-md transition-colors hover:bg-blue-50"
          >
            {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
            <span className="hidden sm:inline">{isEditing ? 'Save' : 'Edit'}</span>
          </button>
        </div>
        
        <div className={`rounded-lg p-3 mb-4 transition-all duration-200 ${
          isEditing 
            ? 'bg-white border-2 border-[#4792E6] shadow-sm ring-2 ring-[#4792E6]/20' 
            : 'bg-gray-50'
        }`}>
          {isEditing ? (
            <textarea
              value={editedReply}
              onChange={(e) => setEditedReply(e.target.value)}
              className="w-full text-sm text-gray-900 bg-transparent border-none resize-none focus:outline-none leading-relaxed min-h-[80px] max-h-[200px]"
              rows={3}
              placeholder="Enter your reply..."
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <div className="min-h-[80px] flex items-start">
              <p className="text-sm leading-relaxed text-gray-900 whitespace-pre-line">
                {editedReply || card.suggestedReply || 'No suggested reply available'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 sm:space-x-3">
          <button
            onClick={handleReject}
            className="flex flex-1 justify-center items-center px-2 sm:px-4 py-2 space-x-1 sm:space-x-2 text-red-600 rounded-lg border border-red-200 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <X size={16} />
            <span className="text-sm font-medium">Reject</span>
          </button>
          <button
            onClick={handlePostReply}
            disabled={!editedReply.trim()}
            className="flex flex-1 justify-center items-center px-2 sm:px-4 py-2 space-x-1 sm:space-x-2 text-white bg-green-500 rounded-lg transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            <span className="text-sm font-medium">Post reply</span>
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmPost}
        title="Confirm Reply"
        message={`Are you sure you want to post this reply? This action cannot be undone.`}
        confirmText="Post Reply"
        cancelText="Cancel"
        type="success"
        loading={isPosting}
      />
    </div>
  );
};

export default AutoReplyCard;