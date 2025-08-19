import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Play, AlertCircle, Calendar, Target, TrendingUp, ChevronDown, ChevronUp, FileText, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Mermaid } from '../common/Mermaid';

interface PlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

interface PlanGenerationCardProps {
  title: string;
  description?: string;
  steps: PlanStep[];
  markdownContent?: string;
  mermaidDiagram?: string;
  status: 'generating' | 'ready' | 'confirmed' | 'executing' | 'completed';
  progress?: number;
  onConfirmPlan?: () => void;
  onExecutePlan?: () => void;
  onCancelPlan?: () => void;
  className?: string;
}

const PlanGenerationCard: React.FC<PlanGenerationCardProps> = ({
  title,
  description,
  steps,
  markdownContent,
  mermaidDiagram,
  status,
  progress = 0,
  onConfirmPlan,
  onExecutePlan,
  onCancelPlan,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'markdown' | 'diagram'>('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ready': return 'bg-green-50 text-green-700 border-green-200';
      case 'confirmed': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'executing': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'completed': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating': return <Clock size={14} className="animate-spin" />;
      case 'ready': return <CheckCircle size={14} />;
      case 'confirmed': return <Target size={14} />;
      case 'executing': return <Play size={14} />;
      case 'completed': return <CheckCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-600" />;
      case 'in-progress': return <Play size={16} className="text-blue-600" />;
      case 'blocked': return <AlertCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center mb-2 space-x-2">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <span className={`inline-flex items-center px-2 py-1 space-x-1 text-xs font-medium rounded-full border ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                <span className="capitalize">{status === 'generating' ? 'Generating' : status === 'ready' ? 'Ready' : status === 'confirmed' ? 'Confirmed' : status === 'executing' ? 'Executing' : 'Completed'}</span>
              </span>
            </div>
            {description && (
              <p className="mb-4 text-sm text-gray-600">{description}</p>
            )}
            
            {/* Progress Bar for executing status */}
            {status === 'executing' && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1 text-xs text-gray-500">
                  <span>Execution Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className="bg-[#4792E6] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Meta Information */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>Created at {new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target size={12} />
                <span>{steps.length} steps</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-500 rounded-md transition-colors hover:bg-gray-100"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Content Tabs */}
      {isExpanded && (
        <div className="border-b border-gray-100">
          <div className="flex space-x-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-[#4792E6] text-[#4792E6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            {markdownContent && (
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'markdown'
                    ? 'border-[#4792E6] text-[#4792E6]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText size={14} className="inline mr-1" />
                Details
              </button>
            )}
            {mermaidDiagram && (
              <button
                onClick={() => setActiveTab('diagram')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'diagram'
                    ? 'border-[#4792E6] text-[#4792E6]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp size={14} className="inline mr-1" />
                Diagram
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="relative"
                >
                  {/* Timeline Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                  )}
                  
                  <div className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                    step.status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      : step.status === 'in-progress'
                      ? 'bg-blue-50 border-blue-200'
                      : step.status === 'blocked'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    {/* Step Number & Icon */}
                    <div className="flex flex-col flex-shrink-0 items-center">
                      <div className="w-8 h-8 rounded-full bg-[#4792E6] text-white text-sm font-medium flex items-center justify-center mb-1">
                        {step.stepNumber}
                      </div>
                      {step.status && getStepStatusIcon(step.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="mb-1 text-sm font-medium text-gray-900">
                            {step.title}
                          </h4>
                          <p className="mb-2 text-xs text-gray-600">
                            {step.description}
                          </p>
                          
                          {/* Step Meta */}
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            {step.estimatedTime && (
                              <div className="flex items-center space-x-1">
                                <Clock size={10} />
                                <span>{step.estimatedTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {step.priority && (
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(step.priority)}`}>
                            {step.priority === 'high' ? 'High Priority' : 
                             step.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {steps.length === 0 && status === 'generating' && (
                <div className="py-8 text-center text-gray-500">
                  <Clock size={24} className="mx-auto mb-2 opacity-50 animate-spin" />
                  <p className="text-sm">Generating plan steps...</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'markdown' && markdownContent && (
            <div className="max-w-none prose prose-sm">
              <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>
          )}
          
          {activeTab === 'diagram' && mermaidDiagram && (
            <div className="flex justify-center">
              <Mermaid chart={mermaidDiagram} />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {isExpanded && (
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-end items-center space-x-3">
            {status === 'ready' && (
              <>
                <button
                  onClick={onCancelPlan}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirmPlan}
                  disabled={steps.length === 0}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#4792E6] text-white font-medium rounded-lg hover:bg-[#3a7bc8] focus:outline-none focus:ring-2 focus:ring-[#4792E6] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={16} />
                  <span>Confirm Plan</span>
                </button>
              </>
            )}
            
            {status === 'confirmed' && (
              <button
                onClick={onExecutePlan}
                disabled={steps.length === 0}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[#4792E6] text-white font-medium rounded-lg hover:bg-[#3a7bc8] focus:outline-none focus:ring-2 focus:ring-[#4792E6] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={16} />
                <span>Execute</span>
              </button>
            )}
            
            {(status === 'executing' || status === 'completed') && (
              <div className="text-sm text-gray-500">
                {status === 'executing' ? 'Plan executing...' : 'Plan completed'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanGenerationCard;