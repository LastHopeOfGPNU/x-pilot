import { useCoAgent } from "@copilotkit/react-core";

// Define the agent state type for AI Assistant - only core agent states
export type AIAgentState = {
  // Processing States
  isLoading: boolean;
  isSending: boolean;
  retryCount: number;
  shouldStopRetry: boolean;
  
  // Error State
  error: string | null;
  
  // Session Management
  sessionId: string;
};

// Default initial state
const DEFAULT_INITIAL_STATE: AIAgentState = {
  // Processing States
  isLoading: false,
  isSending: false,
  retryCount: 0,
  shouldStopRetry: false,
  
  // Error State
  error: null,
  
  // Session Management
  sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
};

/**
 * Custom hook for AI Assistant agent state management
 * @param initialState Optional initial state override
 * @returns Object containing state, setState, and utility functions
 */
export function useAIAgentState(initialState?: Partial<AIAgentState>) {
  const { state, setState } = useCoAgent<AIAgentState>({
    name: "chat_agent",
    initialState: {
      ...DEFAULT_INITIAL_STATE,
      ...initialState
    }
  });

  // Processing State Management
  const setIsLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setIsSending = (isSending: boolean) => {
    setState(prev => ({ ...prev, isSending }));
  };

  const setRetryCount = (retryCount: number) => {
    setState(prev => ({ ...prev, retryCount }));
  };

  const setShouldStopRetry = (shouldStopRetry: boolean) => {
    setState(prev => ({ ...prev, shouldStopRetry }));
  };

  // Error Management
  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Session Management
  const resetSession = () => {
    setState({
      ...DEFAULT_INITIAL_STATE,
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  };

  const resetToInitialState = () => {
    setState(DEFAULT_INITIAL_STATE);
  };

  const updateState = (updates: Partial<AIAgentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return {
    // State
    state,
    setState,
    
    // Processing State Setters
    setIsLoading,
    setIsSending,
    setRetryCount,
    setShouldStopRetry,
    
    // Error Management
    setError,
    
    // Session Management
    resetSession,
    resetToInitialState,
    updateState
  };
}

// Export types and constants for external use
export { DEFAULT_INITIAL_STATE };
export type { AIAgentState };