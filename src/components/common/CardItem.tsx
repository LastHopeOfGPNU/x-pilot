import React from 'react';
import { Heart, Repeat2, MessageSquare } from 'lucide-react';
import { Card } from '../../types';
import { 
  getCardIcon, 
  getCardBorderColor, 
  getPriorityStyles, 
  VerifiedBadge, 
  StatusIndicator,
  formatNumber 
} from '../../utils/cardUtils';

interface CardItemProps {
  card: Card;
  isSelected: boolean;
  onClick: (card: Card) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, isSelected, onClick }) => {
  return (
    <div
      onClick={() => onClick(card)}
      className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
        getCardBorderColor(card.type)
      } ${
        isSelected 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Card Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          {getCardIcon(card.type)}
          <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            {card.type}
          </span>
        </div>
        <span className="text-xs text-gray-500">{card.time}</span>
      </div>

      {/* Card Content */}
      <h3 className="mb-2 font-medium text-gray-900 line-clamp-1">
        {card.title}
      </h3>
      <p className="mb-3 text-sm text-gray-600 line-clamp-2">
        {card.content}
      </p>

      {/* Author Info (for posts/tweets) */}
      {card.author && (
        <div className="flex items-center mb-2 space-x-2">
          <img
            src={card.author.avatar}
            alt={card.author.name}
            className="object-cover w-6 h-6 rounded-full"
          />
          <span className="text-xs text-gray-600">{card.author.name}</span>
          {card.author.verified && <VerifiedBadge />}
        </div>
      )}

      {/* Stats (for posts/tweets) */}
      {card.stats && (
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <MessageSquare size={12} />
            <span>{formatNumber(card.stats.comments)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart size={12} />
            <span>{formatNumber(card.stats.likes)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Repeat2 size={12} />
            <span>{formatNumber(card.stats.retweets)}</span>
          </div>
        </div>
      )}

      {/* Metadata (for strategies/actions) */}
      {card.metadata && (
        <div className="flex justify-between items-center">
          {card.metadata.priority && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              getPriorityStyles(card.metadata.priority)
            }`}>
              {card.metadata.priority}
            </span>
          )}
          {card.metadata.status && <StatusIndicator status={card.metadata.status} />}
        </div>
      )}
    </div>
  );
};

export default CardItem;