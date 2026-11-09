// services/pollService.ts

// Types and Interfaces
export interface CreatePollPayload {
  userId: number;
  pageId: number;
  postType: 'POLL';
  pollQuestion: string;
  pollOptions: string[];
  pollDurationHours: number;
  visibilityType?: string;
}

export interface PollOption {
  optionId: number;
  pollId: number | null;
  optionText: string;
  voteCount: number;
  optionOrder: number;
  votePercentage: number;
}

export interface Poll {
  pollId: number;
  postId: number;
  question: string;
  durationHours: number;
  isActive: 'Y' | 'N';
  endsAt: string | null;
  createdAt: string;
  statusCode: number;
  message: string | null;
  hasVoted: 'Y' | 'N';
  totalVotes: number;
  options: PollOption[];
}

export interface PostData {
  postId: number;
  userId: string;
  pageId: number;
  content: string | null;
  postType: 'POLL' | 'TEXT' | 'IMAGE' | 'VIDEO';
  mediaUrls: string | null;
  mediaUrlsList: string[] | null;
  mediaType: string | null;
  hashtags: string[] | null;
  location: string | null;
  isActive: 'Y' | 'N';
  createdAt: string;
  updatedAt: string | null;
  scheduledAt: string | null;
  isScheduled: 'Y' | 'N';
  engagementScore: number;
  pollQuestion: string | null;
  pollOptions: string[] | null;
  pollDurationHours: number | null;
  username: string;
  fullName: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  hasLiked: 'Y' | 'N';
  hasBookmarked: 'Y' | 'N';
  poll?: Poll;
}

export interface CreatePollResponse {
  success: boolean;
  message: string;
  data: PostData;
  errorCode: string | null;
}

// API Configuration
const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BitohubService';
const ENDPOINTS = {
  CREATE_POLL: '/post/createPoll',
} as const;

// Service Class
class PollService {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      // Add any auth headers if needed
      // 'Authorization': `Bearer ${getAuthToken()}`
    };
  }

  /**
   * Create a new poll
   */
  async createPoll(params: {
    userId: number;
    pageId: number;
    pollQuestion: string;
    pollOptions: string[];
    pollDurationHours?: number;
    visibilityType?: string; 
  }): Promise<CreatePollResponse> {
    const payload: CreatePollPayload = {
      userId: params.userId,
      pageId: params.pageId,
      postType: 'POLL',
      pollQuestion: params.pollQuestion,
      pollOptions: params.pollOptions,
      pollDurationHours: params.pollDurationHours || 48, // Default to 48 hours
      visibilityType: params.visibilityType || '1',
    };

    try {
      const response = await fetch(`${this.baseUrl}${ENDPOINTS.CREATE_POLL}`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CreatePollResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create poll');
      }

      return data;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }

  /**
   * Validate poll data before submission
   */
  validatePollData(question: string, options: string[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate question
    if (!question || question.trim().length === 0) {
      errors.push('Poll question is required');
    } else if (question.trim().length < 10) {
      errors.push('Poll question must be at least 10 characters');
    } else if (question.trim().length > 500) {
      errors.push('Poll question must be less than 500 characters');
    }

    // Validate options
    const validOptions = options.filter(opt => opt.trim().length > 0);
    
    if (validOptions.length < 2) {
      errors.push('At least 2 poll options are required');
    } else if (validOptions.length > 6) {
      errors.push('Maximum 6 poll options are allowed');
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      errors.push('Poll options must be unique');
    }

    // Validate each option
    validOptions.forEach((option, index) => {
      if (option.trim().length < 1) {
        errors.push(`Option ${index + 1} cannot be empty`);
      } else if (option.trim().length > 100) {
        errors.push(`Option ${index + 1} must be less than 100 characters`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format poll duration for display
   */
  formatPollDuration(hours: number): string {
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      
      let result = `${days} day${days !== 1 ? 's' : ''}`;
      if (remainingHours > 0) {
        result += ` ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
      }
      return result;
    }
  }

  /**
   * Calculate poll end time
   */
  calculatePollEndTime(durationHours: number): Date {
    const now = new Date();
    return new Date(now.getTime() + durationHours * 60 * 60 * 1000);
  }
}

// Export singleton instance
export const pollService = new PollService();

// Hook for React components
import { useState } from 'react';

export interface UsePollCreationOptions {
  onSuccess?: (data: PostData) => void;
  onError?: (error: Error) => void;
}

export function usePollCreation(options?: UsePollCreationOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPoll = async (params: {
    userId: number;
    pageId: number;
    pollQuestion: string;
    pollOptions: string[];
    pollDurationHours?: number;
    visibilityType?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    // Validate before sending
    const validation = pollService.validatePollData(
      params.pollQuestion,
      params.pollOptions
    );

    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      setIsLoading(false);
      return null;
    }

    try {
      const response = await pollService.createPoll(params);
      
      if (options?.onSuccess) {
        options.onSuccess(response.data);
      }
      
      setIsLoading(false);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create poll';
      setError(errorMessage);
      
      if (options?.onError) {
        options.onError(err instanceof Error ? err : new Error(errorMessage));
      }
      
      setIsLoading(false);
      return null;
    }
  };

  return {
    createPoll,
    isLoading,
    error,
  };
}

// Optional: Mock service for testing
export class MockPollService {
  async createPoll(params: {
    userId: number;
    pageId: number;
    pollQuestion: string;
    pollOptions: string[];
    pollDurationHours?: number;
    visibilityType?: string;
  }): Promise<CreatePollResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response
    const mockPostId = Math.floor(Math.random() * 1000);
    const mockPollId = Math.floor(Math.random() * 100);
    
    return {
      success: true,
      message: 'Post created successfully',
      data: {
        postId: mockPostId,
        userId: params.userId.toString(),
        pageId: params.pageId,
        content: null,
        postType: 'POLL',
        mediaUrls: null,
        mediaUrlsList: null,
        mediaType: null,
        hashtags: null,
        location: null,
        isActive: 'Y',
        createdAt: new Date().toISOString(),
        updatedAt: null,
        scheduledAt: null,
        isScheduled: 'N',
        engagementScore: 0.0,
        pollQuestion: null,
        pollOptions: null,
        pollDurationHours: null,
        username: '@test_user',
        fullName: 'Test User',
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        hasLiked: 'N',
        hasBookmarked: 'N',
        poll: {
          pollId: mockPollId,
          postId: mockPostId,
          question: params.pollQuestion,
          durationHours: params.pollDurationHours || 48,
          isActive: 'Y',
          endsAt: null,
          createdAt: new Date().toISOString(),
          statusCode: 0,
          message: null,
          hasVoted: 'N',
          totalVotes: 0,
          options: params.pollOptions.map((text, index) => ({
            optionId: index + 1,
            pollId: null,
            optionText: text,
            voteCount: 0,
            optionOrder: index + 1,
            votePercentage: 0.0,
          })),
        },
      },
      errorCode: null,
    };
  }
}