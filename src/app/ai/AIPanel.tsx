'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Divider,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Chip,
  Skeleton,
  LinearProgress,
  Avatar,
  Dialog,
  DialogContent,
  Tabs,
  Tab,
  Drawer,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  EditOutlined as EditIcon,
  FolderOutlined as FolderIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Download as DownloadIcon,
  PostAdd as PostAddIcon,
  HistoryOutlined as HistoryIcon,
  KeyboardArrowDown as ArrowDownIcon,
  TextFields as TextIcon,
  Videocam as VideoIcon,
  Image as ImageIconFilled,
  AspectRatio as AspectRatioIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  AutoAwesome as SparkleIcon,
  DeleteOutline as DeleteIcon,
  MoreVert as MoreVertIcon,
  Collections as CollectionsIcon,
  PlayArrow as PlayIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  GridView as GridIcon,
  Chat as ChatIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import CreatePostDialog from '@/components/CreatePostDialog';

type ContentType = 'text' | 'image' | 'video';

type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9' | '3:2' | '2:3' | '4:5' | '5:4';

type ViewType = 'chat' | 'bitos';

type BitosFilterType = 'all' | 'image' | 'video';

interface SessionData {
  sessionId: string;
  createdAt: string;
}

interface SessionItem {
  sessionId: string;
  sessionName: string;
  createdAt: string;
  lastActivity: string;
}

// Bito item interface
interface BitoItem {
  bitoId: string;
  username: string;
  contentType: 'image' | 'video';
  url: string;
  thumbnailUrl: string | null;
  prompt: string;
  aspectRatio: string;
  duration: number | null;
  createdAt: string;
}

// Chat message interface
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contentType?: ContentType;
  mediaUrl?: string;
  aspectRatio?: string;
  thumbnailUrl?: string;
  duration?: number;
  resolution?: string;
  timestamp: string;
}

// API History item interface
interface HistoryItem {
  role: 'user' | 'assistant';
  content?: string;
  contentType?: string;
  data?: {
    content?: string;
    url?: string;
    aspectRatio?: string;
    thumbnailUrl?: string;
    duration?: number;
    resolution?: string;
  };
  timestamp: string;
}

const BASE_URL = 'https://whizzo-ai.paybito.com/api/bitoconnect';
const API_KEY = 'bc_live_sk_7f8a9b2c3d4e5f6g7h8i9j0k1l2m3n4o';

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '1:1', label: 'Square (1:1)', icon: '⬜' },
  { value: '3:4', label: 'Portrait (3:4)', icon: '📱' },
  { value: '4:3', label: 'Landscape (4:3)', icon: '🖥️' },
  { value: '9:16', label: 'Story (9:16)', icon: '📲' },
  { value: '16:9', label: 'Widescreen (16:9)', icon: '🎬' },
  { value: '21:9', label: 'Ultra Wide (21:9)', icon: '🎞️' },
  { value: '3:2', label: 'Photo (3:2)', icon: '📷' },
  { value: '2:3', label: 'Portrait Photo (2:3)', icon: '🖼️' },
  { value: '4:5', label: 'Instagram (4:5)', icon: '📸' },
  { value: '5:4', label: 'Large Format (5:4)', icon: '🎨' },
];

// Video only supports 9:16 and 16:9
const VIDEO_ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '9:16', label: 'Portrait (9:16)', icon: '📲' },
  { value: '16:9', label: 'Landscape (16:9)', icon: '🎬' },
];

// Loading animation component
const GeneratingLoader = ({ type }: { type: ContentType }) => {
  const theme = useTheme();
  const messages = {
    text: ['Crafting your content...', 'Generating creative text...', 'Almost there...'],
    image: ['Creating your masterpiece...', 'Generating image...', 'Adding final touches...'],
    video: ['Producing your video...', 'Rendering frames...', 'Almost ready...'],
  };

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages[type].length);
    }, 2000);
    return () => clearInterval(interval);
  }, [type]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 3,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 80,
          height: 80,
          mb: 3,
        }}
      >
        {/* Outer rotating ring */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: theme.palette.primary.main,
            borderRightColor: theme.palette.secondary.main,
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
        {/* Inner pulsing circle */}
        <Box
          sx={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(0.9)', opacity: 0.8 },
            },
          }}
        >
          {type === 'text' && <TextIcon sx={{ color: '#fff', fontSize: 28 }} />}
          {type === 'image' && <ImageIconFilled sx={{ color: '#fff', fontSize: 28 }} />}
          {type === 'video' && <VideoIcon sx={{ color: '#fff', fontSize: 28 }} />}
        </Box>
      </Box>

      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: 1,
          animation: 'fadeInOut 2s ease-in-out infinite',
          '@keyframes fadeInOut': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.6 },
          },
        }}
      >
        {messages[type][messageIndex]}
      </Typography>

      <Box sx={{ width: 200, mt: 2 }}>
        <LinearProgress
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.primary.main} 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
              '@keyframes shimmer': {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-200% 0' },
              },
            },
          }}
        />
      </Box>

      <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary, mt: 2 }}>
        This may take a few moments
      </Typography>
    </Box>
  );
};

export default function AIPanel() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType>('text');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1');
  const [aspectRatioAnchorEl, setAspectRatioAnchorEl] = useState<null | HTMLElement>(null);
  
  // Chat history state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);
  
  // Session state
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Sessions list state (for sidebar)
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // CreatePostDialog state
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });

  // Session menu state (for delete)
  const [sessionMenuAnchorEl, setSessionMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [sessionToDelete, setSessionToDelete] = useState<SessionItem | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // View state (chat or bitos)
  const [currentView, setCurrentView] = useState<ViewType>('chat');

  // Bitos gallery state
  const [bitos, setBitos] = useState<BitoItem[]>([]);
  const [isLoadingBitos, setIsLoadingBitos] = useState(false);
  const [bitosError, setBitosError] = useState<string | null>(null);
  const [bitosFilter, setBitosFilter] = useState<BitosFilterType>('all');
  const [selectedBito, setSelectedBito] = useState<BitoItem | null>(null);
  const [bitoPreviewOpen, setBitoPreviewOpen] = useState(false);
  const [bitoForPost, setBitoForPost] = useState<BitoItem | null>(null);

  // Mobile/Tablet responsive state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Ref for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isGenerating]);

  // Reset aspect ratio when switching to video if current ratio is not supported
  useEffect(() => {
    if (selectedType === 'video') {
      const isValidVideoRatio = VIDEO_ASPECT_RATIOS.some(r => r.value === selectedAspectRatio);
      if (!isValidVideoRatio) {
        setSelectedAspectRatio('16:9'); // Default to 16:9 for video
      }
    }
  }, [selectedType]);

  // Fetch bitos when switching to bitos view
  useEffect(() => {
    if (currentView === 'bitos' && bitos.length === 0) {
      fetchBitos();
    }
  }, [currentView]);

  // Fetch session history
  const fetchSessionHistory = async (sessionId: string, username: string) => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(
        `${BASE_URL}/session/${sessionId}?username=${encodeURIComponent(username)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-bitoconnect-key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch session history: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.history) {
        // Convert API history to chat messages
        const messages: ChatMessage[] = data.history.map((item: HistoryItem, index: number) => {
          if (item.role === 'user') {
            return {
              id: `msg-${index}-${Date.now()}`,
              role: 'user' as const,
              content: item.content || '',
              timestamp: item.timestamp,
            };
          } else {
            const contentType = (item.contentType as ContentType) || 'text';
            return {
              id: `msg-${index}-${Date.now()}`,
              role: 'assistant' as const,
              content: item.data?.content || '',
              contentType,
              mediaUrl: item.data?.url,
              aspectRatio: item.data?.aspectRatio,
              thumbnailUrl: item.data?.thumbnailUrl,
              duration: item.data?.duration,
              resolution: item.data?.resolution,
              timestamp: item.timestamp,
            };
          }
        });

        setChatHistory(messages);
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load session history',
        severity: 'error',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch sessions list
  const fetchSessions = async (username: string) => {
    try {
      setIsLoadingSessions(true);
      const response = await fetch(`${BASE_URL}/sessions?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-bitoconnect-key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSessionsList(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string, username: string) => {
    try {
      setIsDeletingSession(true);
      const response = await fetch(
        `${BASE_URL}/session/${sessionId}?username=${encodeURIComponent(username)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-bitoconnect-key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // If the deleted session is the current one, clear it
        if (sessionData?.sessionId === sessionId) {
          setSessionData(null);
          setChatHistory([]);
          setSelectedMessageIndex(null);
          
          // Remove session from URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('session');
          router.replace(newUrl.pathname + newUrl.search);
        }

        // Refresh sessions list
        await fetchSessions(username);

        setSnackbar({
          open: true,
          message: 'Session deleted successfully',
          severity: 'success',
        });
      } else {
        throw new Error(data.message || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete session',
        severity: 'error',
      });
    } finally {
      setIsDeletingSession(false);
      setSessionMenuAnchorEl(null);
      setSessionToDelete(null);
    }
  };

  // Fetch bitos
  const fetchBitos = async () => {
    try {
      setIsLoadingBitos(true);
      setBitosError(null);
      
      const username = localStorage.getItem('adminUserName') || 'guest_user';
      
      const response = await fetch(
        `${BASE_URL}/getBitos?username=${encodeURIComponent(username)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-bitoconnect-key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bitos: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setBitos(data.bitos || []);
      } else {
        throw new Error('Failed to fetch bitos');
      }
    } catch (err) {
      console.error('Error fetching bitos:', err);
      setBitosError(err instanceof Error ? err.message : 'Failed to fetch bitos');
    } finally {
      setIsLoadingBitos(false);
    }
  };

  // Helper function to format session time
  const formatSessionTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Create new session
  const createNewSession = async (username: string): Promise<SessionData | null> => {
    try {
      const response = await fetch(`${BASE_URL}/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bitoconnect-key': API_KEY,
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return {
          sessionId: data.sessionId,
          createdAt: data.createdAt,
        };
      }
      return null;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  };

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsSessionLoading(true);
        setSessionError(null);

        const username = localStorage.getItem('adminUserName') || 'guest_user';
        const urlSessionId = searchParams.get('session');

        if (urlSessionId) {
          // Session ID exists in URL, use it and fetch history
          setSessionData({
            sessionId: urlSessionId,
            createdAt: new Date().toISOString(),
          });
          
          // Fetch session history
          await fetchSessionHistory(urlSessionId, username);
        }
        
        // Always fetch sessions list
        await fetchSessions(username);
      } catch (error) {
        console.error('Error initializing:', error);
        setSessionError(error instanceof Error ? error.message : 'Failed to initialize');
      } finally {
        setIsSessionLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Handle clicking on a session in sidebar
  const handleSessionClick = async (session: SessionItem) => {
    // Switch to chat view if in bitos view
    if (currentView === 'bitos') {
      setCurrentView('chat');
    }

    if (session.sessionId === sessionData?.sessionId) return;

    const username = localStorage.getItem('adminUserName') || 'guest_user';

    // Update session data
    setSessionData({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
    });

    // Clear current chat
    setChatHistory([]);
    setSelectedMessageIndex(null);

    // Update URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('session', session.sessionId);
    router.replace(newUrl.pathname + newUrl.search);

    // Fetch session history
    await fetchSessionHistory(session.sessionId, username);
  };

  const contentTypeOptions = [
    { value: 'text' as ContentType, label: 'Text', icon: <TextIcon sx={{ fontSize: 18 }} /> },
    { value: 'image' as ContentType, label: 'Image', icon: <ImageIconFilled sx={{ fontSize: 18 }} /> },
    { value: 'video' as ContentType, label: 'Video', icon: <VideoIcon sx={{ fontSize: 18 }} /> },
  ];

  const handleAspectRatioClick = (event: React.MouseEvent<HTMLElement>) => {
    setAspectRatioAnchorEl(event.currentTarget);
  };

  const handleAspectRatioClose = () => {
    setAspectRatioAnchorEl(null);
  };

  const handleAspectRatioSelect = (ratio: AspectRatio) => {
    setSelectedAspectRatio(ratio);
    handleAspectRatioClose();
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    const username = localStorage.getItem('adminUserName') || 'guest_user';
    const userMessage = inputValue.trim();

    // Add user message to chat history immediately
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setChatHistory(prev => [...prev, userChatMessage]);
    setInputValue('');
    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Create session if not exists
      let currentSessionId = sessionData?.sessionId;
      
      if (!currentSessionId) {
        const newSession = await createNewSession(username);
        
        if (newSession) {
          setSessionData(newSession);
          currentSessionId = newSession.sessionId;
          
          // Update URL with new session ID
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('session', newSession.sessionId);
          router.replace(newUrl.pathname + newUrl.search);
          
          console.log('Session created on first prompt:', newSession.sessionId);
          
          // Refresh sessions list
          await fetchSessions(username);
        } else {
          throw new Error('Failed to create session');
        }
      }

      const requestBody: Record<string, unknown> = {
        username,
        sessionId: currentSessionId,
        prompt: userMessage,
        contentType: selectedType,
      };

      // Add options for image and video generation
      if (selectedType === 'image' || selectedType === 'video') {
        requestBody.options = {
          aspectRatio: selectedAspectRatio,
        };
      }

      const response = await fetch(`${BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bitoconnect-key': API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          contentType: selectedType,
          timestamp: new Date().toISOString(),
        };

        if (selectedType === 'text') {
          assistantMessage.content = data.data.content;
        } else if (selectedType === 'image') {
          assistantMessage.mediaUrl = data.data.url;
          assistantMessage.aspectRatio = data.data.aspectRatio || selectedAspectRatio;
        } else if (selectedType === 'video') {
          assistantMessage.mediaUrl = data.data.url || data.data.videoUrl || data.data.mediaUrl;
          assistantMessage.aspectRatio = data.data.aspectRatio || selectedAspectRatio;
          assistantMessage.thumbnailUrl = data.data.thumbnailUrl;
          assistantMessage.duration = data.data.duration;
          assistantMessage.resolution = data.data.resolution;
        }

        setChatHistory(prev => [...prev, assistantMessage]);
        setSelectedMessageIndex(chatHistory.length + 1); // Select the new assistant message
        
        // Refresh sessions list to get updated session name
        await fetchSessions(username);
      } else {
        throw new Error(data.message || `${selectedType} generation failed`);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate content');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate content'}`,
        contentType: 'text',
        timestamp: new Date().toISOString(),
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    // Switch to chat view if in bitos view
    if (currentView === 'bitos') {
      setCurrentView('chat');
    }

    // Clear current session and chat
    setSessionData(null);
    setChatHistory([]);
    setSelectedMessageIndex(null);
    setInputValue('');
    setGenerationError(null);

    // Remove session from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('session');
    router.replace(newUrl.pathname + newUrl.search);

    setSnackbar({
      open: true,
      message: 'Ready for a new chat! Session will be created when you send your first message.',
      severity: 'success',
    });
  };

  // Get selected message for actions
  const selectedMessage = selectedMessageIndex !== null ? chatHistory[selectedMessageIndex] : null;

  const handleCreatePost = () => {
    if (selectedMessage && selectedMessage.role === 'assistant') {
      setShowCreatePostDialog(true);
    }
  };

  const handleCopyMessage = async () => {
    if (selectedMessage) {
      const textToCopy = selectedMessage.content || selectedMessage.mediaUrl || '';
      try {
        await navigator.clipboard.writeText(textToCopy);
        setSnackbar({
          open: true,
          message: 'Copied to clipboard!',
          severity: 'success',
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to copy',
          severity: 'error',
        });
      }
    }
  };

  const handleCopyLink = async () => {
    if (selectedMessage?.mediaUrl) {
      try {
        await navigator.clipboard.writeText(selectedMessage.mediaUrl);
        setSnackbar({
          open: true,
          message: 'Media link copied!',
          severity: 'success',
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to copy link',
          severity: 'error',
        });
      }
    }
  };

  const handleDownload = () => {
    if (selectedMessage?.mediaUrl) {
      const link = document.createElement('a');
      link.href = selectedMessage.mediaUrl;
      link.download = `generated-${selectedMessage.contentType}-${Date.now()}.${selectedMessage.contentType === 'image' ? 'png' : 'mp4'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSnackbar({
        open: true,
        message: 'Download started!',
        severity: 'success',
      });
    } else if (selectedMessage?.content) {
      const blob = new Blob([selectedMessage.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-text-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSnackbar({
        open: true,
        message: 'Content downloaded!',
        severity: 'success',
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Session menu handlers
  const handleSessionMenuOpen = (event: React.MouseEvent<HTMLElement>, session: SessionItem) => {
    event.stopPropagation();
    setSessionMenuAnchorEl(event.currentTarget);
    setSessionToDelete(session);
  };

  const handleSessionMenuClose = () => {
    setSessionMenuAnchorEl(null);
    setSessionToDelete(null);
  };

  const handleDeleteSession = () => {
    if (sessionToDelete) {
      const username = localStorage.getItem('adminUserName') || 'guest_user';
      deleteSession(sessionToDelete.sessionId, username);
    }
  };

  // Bitos helper functions and handlers
  const filteredBitos = bitos.filter((bito) => {
    if (bitosFilter === 'all') return true;
    return bito.contentType === bitosFilter;
  });

  const imageCount = bitos.filter(b => b.contentType === 'image').length;
  const videoCount = bitos.filter(b => b.contentType === 'video').length;

  const handleBitoClick = (bito: BitoItem) => {
    setSelectedBito(bito);
    setBitoPreviewOpen(true);
  };

  const handleCreatePostFromBito = (bito: BitoItem) => {
    setBitoForPost(bito);
    setShowCreatePostDialog(true);
    setBitoPreviewOpen(false);
  };

  const handleDownloadBito = (bito: BitoItem) => {
    const link = document.createElement('a');
    link.href = bito.url;
    link.download = `bito-${bito.contentType}-${Date.now()}.${bito.contentType === 'image' ? 'png' : 'mp4'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSnackbar({
      open: true,
      message: 'Download started!',
      severity: 'success',
    });
  };

  const handleCopyBitoLink = async (bito: BitoItem) => {
    try {
      await navigator.clipboard.writeText(bito.url);
      setSnackbar({
        open: true,
        message: 'Link copied to clipboard!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to copy link',
        severity: 'error',
      });
    }
  };

  // Save bito after successful post creation
  const saveBito = async (contentType: 'image' | 'video', url: string, prompt: string, options?: {
    thumbnailUrl?: string;
    aspectRatio?: string;
    duration?: number;
    resolution?: string;
  }) => {
    try {
      const username = localStorage.getItem('adminUserName') || 'guest_user';
      
      const payload: {
        username: string;
        sessionId: string;
        contentType: 'image' | 'video';
        url: string;
        prompt: string;
        thumbnailUrl?: string;
        aspectRatio?: string;
        duration?: number;
        resolution?: string;
      } = {
        username,
        sessionId: sessionData?.sessionId || '',
        contentType,
        url,
        prompt,
      };

      // Add optional fields if provided
      if (options?.thumbnailUrl) payload.thumbnailUrl = options.thumbnailUrl;
      if (options?.aspectRatio) payload.aspectRatio = options.aspectRatio;
      if (options?.duration) payload.duration = options.duration;
      if (options?.resolution) payload.resolution = options.resolution;

      await fetch(`${BASE_URL}/savebito`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bitoconnect-key': API_KEY,
        },
        body: JSON.stringify(payload),
      });

      // Refresh bitos list if we're viewing it or have loaded it
      if (bitos.length > 0) {
        fetchBitos();
      }
    } catch (err) {
      console.error('Error saving bito:', err);
      // Silent fail - no need to show error to user
    }
  };

  // Render bito item
  const renderBitoItem = (bito: BitoItem) => {
    const isVideo = bito.contentType === 'video';

    return (
      <Box
        key={bito.bitoId}
        onClick={() => handleBitoClick(bito)}
        sx={{
          position: 'relative',
          aspectRatio: '9/16',
          borderRadius: 1,
          overflow: 'hidden',
          cursor: 'pointer',
          bgcolor: theme.palette.background.default,
          '&:hover': {
            '& .overlay': {
              opacity: 1,
            },
            '& .media': {
              transform: 'scale(1.05)',
            },
          },
        }}
      >
        {isVideo ? (
          <video
            src={bito.url}
            poster={bito.thumbnailUrl || undefined}
            className="media"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
            muted
          />
        ) : (
          <img
            src={bito.url}
            alt={bito.prompt}
            className="media"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
          />
        )}

        {isVideo && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
        )}

        {isVideo && bito.duration && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: '#fff',
              px: 0.75,
              py: 0.25,
              borderRadius: '4px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {bito.duration}s
          </Box>
        )}

        <Box
          className="overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.4)',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 1,
          }}
        >
          <Typography
            sx={{
              color: '#fff',
              fontSize: 11,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {bito.prompt}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Render bitos skeleton
  const renderBitosSkeleton = () => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
        gap: { xs: 0.25, sm: 0.5 },
      }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          sx={{
            aspectRatio: '9/16',
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        />
      ))}
    </Box>
  );

  // Render a chat message
  const renderChatMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isSelected = selectedMessageIndex === index;

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            gap: { xs: 1, sm: 1.5 },
            maxWidth: { xs: '95%', sm: '85%' },
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              width: { xs: 28, sm: 36 },
              height: { xs: 28, sm: 36 },
              bgcolor: isUser ? theme.palette.primary.main : 'transparent',
              background: isUser ? theme.palette.primary.main : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              flexShrink: 0,
              display: { xs: 'none', sm: 'flex' },
            }}
          >
            {isUser ? <PersonIcon sx={{ fontSize: { xs: 16, sm: 20 } }} /> : <AIIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
          </Avatar>

          {/* Message Content */}
          <Box
            onClick={() => !isUser && setSelectedMessageIndex(index)}
            sx={{
              cursor: !isUser ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                bgcolor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
                color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
                border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
                boxShadow: isSelected ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
                '&:hover': !isUser ? {
                  boxShadow: theme.shadows[2],
                } : {},
              }}
            >
              {/* Text content */}
              {message.content && (
                <Typography
                  sx={{
                    fontSize: { xs: 13, sm: 14 },
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </Typography>
              )}

              {/* Image content */}
              {message.mediaUrl && message.contentType === 'image' && (
                <Box sx={{ mt: message.content ? 2 : 0 }}>
                  <Box sx={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={message.mediaUrl}
                      alt="Generated image"
                      style={{
                        width: '100%',
                        maxWidth: 400,
                        display: 'block',
                        borderRadius: '8px',
                      }}
                    />
                    {message.aspectRatio && (
                      <Chip
                        label={message.aspectRatio}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              {/* Video content */}
              {message.mediaUrl && message.contentType === 'video' && (
                <Box sx={{ mt: message.content ? 2 : 0 }}>
                  <Box sx={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                    <video
                      src={message.mediaUrl}
                      controls
                      poster={message.thumbnailUrl || undefined}
                      style={{
                        width: '100%',
                        maxWidth: 400,
                        borderRadius: '8px',
                        display: 'block',
                      }}
                    />
                    {/* Video metadata chips */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5,
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {message.aspectRatio && (
                        <Chip
                          label={message.aspectRatio}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 600,
                            height: 22,
                          }}
                        />
                      )}
                      {message.resolution && (
                        <Chip
                          label={message.resolution}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 600,
                            height: 22,
                          }}
                        />
                      )}
                    </Box>
                    {/* Duration badge */}
                    {message.duration && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          px: 1,
                          py: 0.25,
                          borderRadius: '4px',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {message.duration}s
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Timestamp */}
            <Typography
              sx={{
                fontSize: 11,
                color: theme.palette.text.secondary,
                mt: 0.5,
                textAlign: isUser ? 'right' : 'left',
                px: 1,
              }}
            >
              {formatMessageTime(message.timestamp)}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  // Render sidebar content (used in both desktop sidebar and mobile drawer)
  const renderSidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Button
          fullWidth
          startIcon={<EditIcon sx={{ fontSize: 18 }} />}
          onClick={() => {
            handleNewChat();
            setMobileDrawerOpen(false);
          }}
          disabled={isSessionLoading}
          sx={{
            justifyContent: 'flex-start',
            color: theme.palette.text.primary,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: 14,
            py: 1.25,
            px: 2,
            mb: 1.5,
            borderRadius: '10px',
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': { 
              bgcolor: alpha(theme.palette.primary.main, 0.08), 
              borderColor: theme.palette.primary.light 
            },
          }}
        >
          New chat
          {isDesktop && (
            <Typography
              component="span"
              sx={{
                ml: 'auto',
                fontSize: 11,
                color: theme.palette.text.secondary,
                fontWeight: 500,
                bgcolor: theme.palette.background.default,
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              ⌘K
            </Typography>
          )}
        </Button>

        <Box
          onClick={() => {
            setCurrentView(currentView === 'bitos' ? 'chat' : 'bitos');
            setMobileDrawerOpen(false);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.25,
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: currentView === 'bitos' ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
            bgcolor: currentView === 'bitos' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': { 
              bgcolor: alpha(theme.palette.primary.main, 0.04), 
              border: `1px solid ${theme.palette.divider}` 
            },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CollectionsIcon sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: currentView === 'bitos' ? theme.palette.primary.main : theme.palette.text.primary }}>Bitos</Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 2.5 }} />

      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
          <HistoryIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
          <Typography
            sx={{
              fontSize: 11,
              color: theme.palette.text.secondary,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Recent Sessions
          </Typography>
          {sessionsList.length > 0 && (
            <Typography
              sx={{
                fontSize: 10,
                color: theme.palette.text.secondary,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                px: 0.75,
                py: 0.25,
                borderRadius: '4px',
              }}
            >
              {sessionsList.length}
            </Typography>
          )}
        </Box>
        
        {isLoadingSessions && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={20} sx={{ color: theme.palette.text.secondary }} />
          </Box>
        )}
        
        {!isLoadingSessions && sessionsList.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
              No recent sessions
            </Typography>
          </Box>
        )}
        
        {!isLoadingSessions && sessionsList.length > 0 && (
          <List sx={{ py: 0 }}>
            {sessionsList.map((session) => (
              <ListItemButton
                key={session.sessionId}
                selected={sessionData?.sessionId === session.sessionId}
                onClick={() => {
                  handleSessionClick(session);
                  setMobileDrawerOpen(false);
                }}
                disabled={isLoadingHistory || isDeletingSession}
                sx={{
                  borderRadius: '8px',
                  py: 1,
                  px: 1.5,
                  mb: 0.5,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                  },
                }}
              >
                <ListItemText
                  primary={session.sessionName || `Session ${session.sessionId.substring(0, 8)}...`}
                  secondary={formatSessionTime(session.lastActivity || session.createdAt)}
                  primaryTypographyProps={{
                    fontSize: 13,
                    color: sessionData?.sessionId === session.sessionId ? theme.palette.primary.main : theme.palette.text.primary,
                    fontWeight: sessionData?.sessionId === session.sessionId ? 600 : 500,
                    noWrap: true,
                    sx: {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: { xs: 200, sm: 160 },
                    },
                  }}
                  secondaryTypographyProps={{ fontSize: 11, color: theme.palette.text.secondary }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleSessionMenuOpen(e, session)}
                  sx={{
                    opacity: 0.5,
                    '&:hover': { opacity: 1, bgcolor: alpha(theme.palette.action.active, 0.04) },
                    ml: 0.5,
                  }}
                >
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}

        {/* Session Menu */}
        <Menu
          anchorEl={sessionMenuAnchorEl}
          open={Boolean(sessionMenuAnchorEl)}
          onClose={handleSessionMenuClose}
          PaperProps={{
            sx: {
              borderRadius: '8px',
              boxShadow: theme.shadows[4],
              minWidth: 140,
            },
          }}
        >
          <MenuItem
            onClick={handleDeleteSession}
            disabled={isDeletingSession}
            sx={{
              fontSize: 13,
              color: theme.palette.error.main,
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
            }}
          >
            {isDeletingSession ? (
              <CircularProgress size={16} sx={{ mr: 1, color: theme.palette.error.main }} />
            ) : (
              <DeleteIcon sx={{ fontSize: 18, mr: 1 }} />
            )}
            {isDeletingSession ? 'Deleting...' : 'Delete'}
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        {sessionData ? (
          <Typography sx={{ fontSize: 10, color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
            Session: {sessionData.sessionId.substring(0, 8)}...
          </Typography>
        ) : (
          <Typography sx={{ fontSize: 10, color: theme.palette.text.secondary }}>
            No active session
          </Typography>
        )}
      </Box>
    </Box>
  );

  if (isSessionLoading && searchParams.get('session')) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          bgcolor: theme.palette.background.default,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 60,
            height: 60,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderTopColor: theme.palette.primary.main,
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AIIcon sx={{ color: theme.palette.primary.contrastText, fontSize: 24 }} />
          </Box>
        </Box>
        <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary, fontWeight: 500 }}>
          Loading session...
        </Typography>
      </Box>
    );
  }

  if (sessionError) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          bgcolor: theme.palette.background.default,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 16, color: theme.palette.error.main, fontWeight: 500 }}>
          Failed to initialize session
        </Typography>
        <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
          {sessionError}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const selectedRatioInfo = (selectedType === 'video' ? VIDEO_ASPECT_RATIOS : ASPECT_RATIOS).find(r => r.value === selectedAspectRatio);

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: theme.palette.background.default }}>
      {/* Mobile Header */}
      {!isDesktop && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            bgcolor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            px: 1,
            py: 1,
            gap: 1,
          }}
        >
          <IconButton onClick={() => setMobileDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SparkleIcon sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, flex: 1 }}>
            {currentView === 'bitos' ? 'Bitos' : 'AI Studio'}
          </Typography>
          <IconButton onClick={handleNewChat} size="small">
            <EditIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      )}

      {/* Sidebar - Desktop Only */}
      {isDesktop && (
        <Box
          sx={{
            width: 280,
            bgcolor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {renderSidebarContent()}
        </Box>
      )}

      {/* Mobile Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 320 },
            maxWidth: 360,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SparkleIcon sx={{ fontSize: 18, color: '#fff' }} />
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>AI Studio</Typography>
          </Box>
          <IconButton onClick={() => setMobileDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        {renderSidebarContent()}
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pt: { xs: '56px', md: 0 },
        }}
      >
        {/* Chat View */}
        {currentView === 'chat' && (
          <>
            {/* Chat Area */}
            <Box
              ref={chatContainerRef}
              sx={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Empty state */}
              {chatHistory.length === 0 && !isLoadingHistory && (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: { xs: 2, sm: 4 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 60, sm: 80 },
                      height: { xs: 60, sm: 80 },
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: { xs: 2, sm: 3 },
                    }}
                  >
                    <SparkleIcon sx={{ color: '#fff', fontSize: { xs: 30, sm: 40 } }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: { xs: 18, sm: 24 },
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 1,
                      textAlign: 'center',
                    }}
                  >
                    How can I help you today?
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: theme.palette.text.secondary,
                      textAlign: 'center',
                      maxWidth: 400,
                      mb: 1,
                    }}
                  >
                    Generate text, images, or videos for your BitoCircle posts. Just type your prompt below.
                  </Typography>
                  {!sessionData && (
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: theme.palette.text.secondary,
                        textAlign: 'center',
                        maxWidth: 400,
                        mt: 1,
                      }}
                    >
                      A new session will be created automatically when you send your first message.
                    </Typography>
                  )}
                </Box>
              )}

              {/* Loading history state */}
              {isLoadingHistory && (
                <Box sx={{ p: 4 }}>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                        <Skeleton variant="circular" width={36} height={36} />
                        <Skeleton variant="rounded" width="60%" height={60} sx={{ borderRadius: '16px' }} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                        <Skeleton variant="rounded" width="50%" height={80} sx={{ borderRadius: '16px' }} />
                        <Skeleton variant="circular" width={36} height={36} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Chat messages */}
              {!isLoadingHistory && chatHistory.length > 0 && (
                <Box sx={{ py: 2 }}>
                  {chatHistory.map((message, index) => renderChatMessage(message, index))}
                </Box>
              )}

              {/* Generating loader */}
              {isGenerating && (
                <Box sx={{ px: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, maxWidth: '85%' }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        flexShrink: 0,
                      }}
                    >
                      <AIIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '16px 16px 16px 4px',
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        minWidth: 300,
                      }}
                    >
                      <GeneratingLoader type={selectedType} />
                    </Paper>
                  </Box>
                </Box>
              )}

              {/* Scroll anchor */}
              <div ref={chatEndRef} />
            </Box>

            {/* Action buttons for selected message */}
            {selectedMessage && selectedMessage.role === 'assistant' && (
              <Box
                sx={{
                  px: { xs: 2, sm: 3, md: 4 },
                  py: 1.5,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper,
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  startIcon={!isMobile && <PostAddIcon sx={{ fontSize: 16 }} />}
                  onClick={handleCreatePost}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: { xs: 11, sm: 12 },
                    px: { xs: 1.5, sm: 2 },
                  }}
                >
                  {isMobile ? <PostAddIcon sx={{ fontSize: 16 }} /> : 'Create Post'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={!isMobile && <CopyIcon sx={{ fontSize: 16 }} />}
                  onClick={handleCopyMessage}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: { xs: 11, sm: 12 },
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    px: { xs: 1.5, sm: 2 },
                  }}
                >
                  {isMobile ? <CopyIcon sx={{ fontSize: 16 }} /> : 'Copy'}
                </Button>
                {selectedMessage.mediaUrl && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={!isMobile && <LinkIcon sx={{ fontSize: 16 }} />}
                    onClick={handleCopyLink}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: { xs: 11, sm: 12 },
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.secondary,
                      px: { xs: 1.5, sm: 2 },
                    }}
                  >
                    {isMobile ? <LinkIcon sx={{ fontSize: 16 }} /> : 'Copy Link'}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={!isMobile && <DownloadIcon sx={{ fontSize: 16 }} />}
                  onClick={handleDownload}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: { xs: 11, sm: 12 },
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    px: { xs: 1.5, sm: 2 },
                  }}
                >
                  {isMobile ? <DownloadIcon sx={{ fontSize: 16 }} /> : 'Download'}
                </Button>
              </Box>
            )}

            {/* Input Area */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2, md: 3 },
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
              }}
            >
              {/* Content Type & Aspect Ratio Selection */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1, sm: 2 },
                  mb: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    p: 0.5,
                    bgcolor: theme.palette.background.default,
                    borderRadius: '10px',
                    border: `1px solid ${theme.palette.divider}`,
                    flexWrap: { xs: 'nowrap', sm: 'nowrap' },
                    overflow: 'auto',
                  }}
                >
                  {!isMobile && (
                    <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary, fontWeight: 500, px: 1 }}>
                      Generate:
                    </Typography>
                  )}
                  {contentTypeOptions.map((option) => (
                    <Box
                      key={option.value}
                      onClick={() => setSelectedType(option.value)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: { xs: 1, sm: 1.5 },
                        py: 0.75,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        bgcolor: selectedType === option.value ? theme.palette.background.paper : 'transparent',
                        border: selectedType === option.value ? `1px solid ${theme.palette.divider}` : '1px solid transparent',
                        boxShadow: selectedType === option.value ? theme.shadows[1] : 'none',
                        transition: 'all 0.15s ease',
                        minWidth: 'fit-content',
                      }}
                    >
                      <Box sx={{ color: selectedType === option.value ? theme.palette.primary.main : theme.palette.text.secondary, display: 'flex' }}>
                        {option.icon}
                      </Box>
                      {!isMobile && (
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: selectedType === option.value ? theme.palette.text.primary : theme.palette.text.secondary,
                          }}
                        >
                          {option.label}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>

                {(selectedType === 'image' || selectedType === 'video') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!isMobile && (
                      <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Ratio:
                      </Typography>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAspectRatioClick}
                      endIcon={<ArrowDownIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: { xs: 11, sm: 12 },
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
                        bgcolor: theme.palette.background.paper,
                        py: 0.5,
                        px: { xs: 1, sm: 1.5 },
                        '&:hover': { bgcolor: theme.palette.background.default, borderColor: theme.palette.primary.light },
                      }}
                    >
                      {selectedRatioInfo?.icon} {selectedAspectRatio}
                    </Button>
                    <Menu
                      anchorEl={aspectRatioAnchorEl}
                      open={Boolean(aspectRatioAnchorEl)}
                      onClose={handleAspectRatioClose}
                      PaperProps={{
                        sx: { borderRadius: '12px', boxShadow: theme.shadows[4], minWidth: 180 },
                      }}
                    >
                      {(selectedType === 'video' ? VIDEO_ASPECT_RATIOS : ASPECT_RATIOS).map((ratio) => (
                        <MenuItem
                          key={ratio.value}
                          onClick={() => handleAspectRatioSelect(ratio.value)}
                          selected={selectedAspectRatio === ratio.value}
                          sx={{ py: 1, px: 2, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: 16 }}>{ratio.icon}</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{ratio.value}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                )}
              </Box>

              {/* Input Field */}
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: { xs: '16px', sm: '24px' },
                  border: `1px solid ${theme.palette.divider}`,
                  px: { xs: 1.5, sm: 2 },
                  py: 0.5,
                  bgcolor: theme.palette.background.default,
                  transition: 'all 0.2s ease',
                  '&:focus-within': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                }}
              >
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder={`Describe what you want to generate...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isGenerating}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      fontSize: 14,
                      color: theme.palette.text.primary,
                      '& input::placeholder': { color: theme.palette.text.secondary, opacity: 1 },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!inputValue.trim() || isGenerating}
                  sx={{
                    borderRadius: '20px',
                    minWidth: 44,
                    width: 44,
                    height: 44,
                    p: 0,
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                    '&.Mui-disabled': { bgcolor: theme.palette.action.disabledBackground },
                  }}
                >
                  <SendIcon sx={{ fontSize: 20 }} />
                </Button>
              </Paper>
            </Box>
          </>
        )}

        {/* Bitos View */}
        {currentView === 'bitos' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Bitos Header */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SparkleIcon sx={{ color: '#fff', fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 16, sm: 18 },
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Bitos
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {bitos.length} AI creations
                  </Typography>
                </Box>
                <IconButton onClick={() => fetchBitos()} disabled={isLoadingBitos}>
                  {isLoadingBitos ? <CircularProgress size={20} /> : <GridIcon />}
                </IconButton>
              </Box>

              {/* Filter tabs */}
              <Tabs
                value={bitosFilter}
                onChange={(_, newValue) => setBitosFilter(newValue)}
                sx={{
                  minHeight: 36,
                  '& .MuiTabs-indicator': {
                    bgcolor: theme.palette.primary.main,
                    height: 2,
                  },
                }}
              >
                <Tab
                  value="all"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GridIcon sx={{ fontSize: 16 }} />
                      <span>All ({bitos.length})</span>
                    </Box>
                  }
                  sx={{
                    minHeight: 36,
                    textTransform: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                    },
                  }}
                />
                <Tab
                  value="image"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ImageIconFilled sx={{ fontSize: 16 }} />
                      <span>Images ({imageCount})</span>
                    </Box>
                  }
                  sx={{
                    minHeight: 36,
                    textTransform: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                    },
                  }}
                />
                <Tab
                  value="video"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VideoIcon sx={{ fontSize: 16 }} />
                      <span>Videos ({videoCount})</span>
                    </Box>
                  }
                  sx={{
                    minHeight: 36,
                    textTransform: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                    },
                  }}
                />
              </Tabs>
            </Box>

            {/* Bitos Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 0.5 }}>
              {isLoadingBitos && renderBitosSkeleton()}

              {!isLoadingBitos && bitosError && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 4,
                  }}
                >
                  <Typography sx={{ color: theme.palette.error.main, mb: 2 }}>
                    {bitosError}
                  </Typography>
                  <Button variant="contained" onClick={fetchBitos}>
                    Retry
                  </Button>
                </Box>
              )}

              {!isLoadingBitos && !bitosError && filteredBitos.length === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    {bitosFilter === 'video' ? (
                      <VideoIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                    ) : bitosFilter === 'image' ? (
                      <ImageIconFilled sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                    ) : (
                      <SparkleIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 0.5,
                    }}
                  >
                    No {bitosFilter === 'all' ? 'bitos' : bitosFilter === 'image' ? 'images' : 'videos'} yet
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: theme.palette.text.secondary,
                      textAlign: 'center',
                    }}
                  >
                    Create AI-generated content to see it here
                  </Typography>
                </Box>
              )}

              {!isLoadingBitos && !bitosError && filteredBitos.length > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: { xs: 0.25, sm: 0.5 },
                  }}
                >
                  {filteredBitos.map(renderBitoItem)}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Bito Preview Dialog */}
      <Dialog
        open={bitoPreviewOpen}
        onClose={() => setBitoPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        {selectedBito && (
          <>
            <IconButton
              onClick={() => setBitoPreviewOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: '#fff',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>

            <DialogContent sx={{ p: 0 }}>
              <Box
                sx={{
                  position: 'relative',
                  bgcolor: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  maxHeight: '60vh',
                }}
              >
                {selectedBito.contentType === 'video' ? (
                  <video
                    src={selectedBito.url}
                    poster={selectedBito.thumbnailUrl || undefined}
                    controls
                    autoPlay
                    style={{
                      maxWidth: '100%',
                      maxHeight: '60vh',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <img
                    src={selectedBito.url}
                    alt={selectedBito.prompt}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '60vh',
                      objectFit: 'contain',
                    }}
                  />
                )}

                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  <Chip
                    icon={selectedBito.contentType === 'video' ? <VideoIcon sx={{ fontSize: 14 }} /> : <ImageIconFilled sx={{ fontSize: 14 }} />}
                    label={selectedBito.contentType}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      fontSize: 11,
                      height: 24,
                      '& .MuiChip-icon': {
                        color: '#fff',
                      },
                    }}
                  />
                  {selectedBito.aspectRatio && (
                    <Chip
                      label={selectedBito.aspectRatio}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: 11,
                        height: 24,
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ p: 2 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    color: theme.palette.text.primary,
                    mb: 1.5,
                    lineHeight: 1.5,
                  }}
                >
                  {selectedBito.prompt}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                  <TimeIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                  <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                    {formatSessionTime(selectedBito.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<PostAddIcon />}
                    onClick={() => handleCreatePostFromBito(selectedBito)}
                    sx={{
                      flex: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Create Post
                  </Button>
                  <Tooltip title="Download">
                    <IconButton
                      onClick={() => handleDownloadBito(selectedBito)}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                      }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy Link">
                    <IconButton
                      onClick={() => handleCopyBitoLink(selectedBito)}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                      }}
                    >
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={showCreatePostDialog}
        onClose={() => {
          setShowCreatePostDialog(false);
          setBitoForPost(null);
        }}
        initialContent={bitoForPost ? '' : (selectedMessage?.contentType === 'text' ? selectedMessage.content : '')}
        initialMediaUrl={bitoForPost?.url || selectedMessage?.mediaUrl}
        initialMediaType={bitoForPost?.contentType || (selectedMessage?.contentType === 'image' ? 'image' : selectedMessage?.contentType === 'video' ? 'video' : undefined)}
        onPostCreated={(postData) => {
          console.log('Post created:', postData);
          
          // Determine the source of the content (from bito or from chat message)
          const source = bitoForPost || selectedMessage;
          
          // Call saveBito API for image/video content
          if (source && (source.contentType === 'image' || source.contentType === 'video')) {
            const mediaUrl = bitoForPost?.url || selectedMessage?.mediaUrl;
            
            if (mediaUrl) {
              // Get the prompt - for bitoForPost it's in 'prompt', for selectedMessage we need to find the user message
              let prompt = '';
              if (bitoForPost) {
                prompt = bitoForPost.prompt;
              } else if (selectedMessage) {
                // Find the corresponding user message (the one before this assistant message)
                const messageIndex = chatHistory.findIndex(m => m.id === selectedMessage.id);
                if (messageIndex > 0) {
                  const userMessage = chatHistory[messageIndex - 1];
                  if (userMessage.role === 'user') {
                    prompt = userMessage.content;
                  }
                }
              }

              saveBito(
                source.contentType as 'image' | 'video',
                mediaUrl,
                prompt,
                {
                  thumbnailUrl: bitoForPost?.thumbnailUrl || selectedMessage?.thumbnailUrl || undefined,
                  aspectRatio: bitoForPost?.aspectRatio || selectedMessage?.aspectRatio || undefined,
                  duration: bitoForPost?.duration || selectedMessage?.duration || undefined,
                  resolution: selectedMessage?.resolution || undefined,
                }
              );
            }
          }

          setSnackbar({
            open: true,
            message: 'Post created successfully!',
            severity: 'success',
          });
          setShowCreatePostDialog(false);
          setBitoForPost(null);
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
