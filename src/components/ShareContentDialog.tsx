'use client'
import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Avatar,
    Button,
    IconButton,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemButton,
    Checkbox,
    Snackbar,
} from '@mui/material';
import {
    Close as XIcon,
    Search as SearchIcon,
    Share as ShareIcon,
} from '@mui/icons-material';

// Constants
const MAX_SHARE_RECIPIENTS = 5;

// Tagged User Interface
interface TaggedUser {
    userId: number;
    username: string;
    fullName: string;
    profilePicture: string | null;
    isVerified: string;
}

// Participant Interface
interface Participant {
    userId: number;
    username?: string;
    fullName: string;
    profilePicture: string | null;
    isVerified?: string;
    userType?: string;
    joinedAt?: string;
}

// Other Participant Interface
interface OtherParticipant {
    userId: number;
    username?: string;
    fullName: string;
    profilePicture: string | null;
    isVerified?: string;
    isOnline?: boolean;
    lastSeen?: string;
}

// Conversation Interface
interface Conversation {
    conversationId: number | null;
    userId: number;
    conversationType: string;
    conversationName: string;
    conversationImage: string | null;
    createdBy: number | null;
    isActive: string;
    createdAt: string;
    updatedAt: string | null;
    lastMessage: string | null;
    unreadCount: number | null;
    userType: string;
    otherParticipant: OtherParticipant | null;
    participants: Participant[] | null;
}

interface ConversationData {
    conversations: Conversation[];
    totalCount: number;
    pageNo: number | null;
    pageSize: number | null;
}

interface SearchConversationsResponse {
    success: boolean;
    message: string;
    data: ConversationData[];
    errorCode: string | null;
    totalRecords: number | null;
}

interface GetFollowersResponse {
    success: boolean;
    message: string;
    data: TaggedUser[];
    errorCode: string | null;
}

// Share Service Interfaces
interface ShareContentPayload {
    userId: number;
    contentId: number;
    recipientUserIds: number[];
    shareMessage?: string;
    contentType: string;
}

interface ShareContentResponse {
    success: boolean;
    message: string;
    data: boolean;
    errorCode: string | null;
}

interface CreateDirectConversationPayload {
    user1Id: number; // senderId
    user2Id: number; // recipientId
}

interface CreateDirectConversationResponse {
    success: boolean;
    message: string;
    data: {
        conversationId: number;
    };
    errorCode: string | null;
}

interface BulkMessagePayload {
    conversationId: string;
    senderId: string;
    messageText: string;
    messageType: string;
    mediaUrl: string;
    replyToMessageId: string;
}

interface MessageSendResult {
    messageId: number;
    conversationId: number;
    senderId: number;
    messageText: string;
    messageType: string;
    sentAt: string;
    status: string;
}

interface SendBulkMessagesResponse {
    success: boolean;
    message: string;
    data: MessageSendResult[];
    errorCode: string | null;
}

class UserService {
    private baseUrl = 'https://institutional-bo.paybito.com:8443/BitohubService';

    async searchConversations(userId: number, searchQuery: string): Promise<SearchConversationsResponse> {
        const response = await fetchWithAuth(
            `${this.baseUrl}/messaging/searchConversations/${userId}?searchType=ALL&search=${encodeURIComponent(searchQuery)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SearchConversationsResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to search conversations');
        }

        return data;
    }

    async getFollowers(userId: number, page: number = 1, size: number = 50): Promise<GetFollowersResponse> {
        const response = await fetchWithAuth(
            `${this.baseUrl}/profile/getFollowers/${userId}?page=${page}&size=${size}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: GetFollowersResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch followers');
        }

        return data;
    }
}

class ShareService {
    private baseUrl = 'https://institutional-bo.paybito.com:8443/BitohubService';

    async createDirectConversation(payload: CreateDirectConversationPayload): Promise<CreateDirectConversationResponse> {
        const response = await fetchWithAuth(
            `${this.baseUrl}/messaging/conversation/direct`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CreateDirectConversationResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to create conversation');
        }

        return data;
    }

    async sendBulkMessages(messages: BulkMessagePayload[]): Promise<SendBulkMessagesResponse> {
        const response = await fetchWithAuth(
            `${this.baseUrl}/messaging/message/sendBulk`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SendBulkMessagesResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to send messages');
        }

        return data;
    }

    async shareContent(payload: ShareContentPayload): Promise<ShareContentResponse> {
        try {
            const { userId, contentId, recipientUserIds, shareMessage, contentType } = payload;

            // Step 1: Create conversations for each recipient
            const conversationPromises = recipientUserIds.map(recipientId =>
                this.createDirectConversation({
                    user1Id: parseInt(localStorage.getItem('childUserId') || '0'),
                    user2Id: recipientId,
                })
            );

            const conversationResults = await Promise.allSettled(conversationPromises);

            // Extract successful conversations
            const successfulConversations: { conversationId: number; recipientId: number }[] = [];
            const failedConversations: number[] = [];

            conversationResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulConversations.push({
                        conversationId: result.value.data.conversationId,
                        recipientId: recipientUserIds[index],
                    });
                } else {
                    failedConversations.push(recipientUserIds[index]);
                    console.error(`Failed to create conversation for user ${recipientUserIds[index]}:`, result.reason);
                }
            });

            if (successfulConversations.length === 0) {
                throw new Error('Failed to create any conversations');
            }

            // Step 2: Prepare bulk messages
            const messageText = shareMessage && shareMessage.trim()
                ? shareMessage.trim()
                : `Check out this ${contentType.toLowerCase()}!`;

            const bulkMessages: BulkMessagePayload[] = successfulConversations.map(conv => ({
                conversationId: conv.conversationId.toString(),
                senderId: parseInt(localStorage.getItem('childUserId') || '0').toString(),
                messageText: messageText,
                messageType: contentType.toUpperCase(),
                mediaUrl: '',
                replyToMessageId: '',
            }));

            // Step 3: Send bulk messages
            await this.sendBulkMessages(bulkMessages);

            const response: ShareContentResponse = {
                success: true,
                message: failedConversations.length > 0
                    ? `Content shared with ${successfulConversations.length} out of ${recipientUserIds.length} recipients`
                    : 'Content shared successfully',
                data: true,
                errorCode: null,
            };

            return response;
        } catch (error) {
            console.error('Error sharing content:', error);
            throw error;
        }
    }
}

const userService = new UserService();
const shareService = new ShareService();

interface UseShareContentOptions {
    onSuccess?: (data: ShareContentResponse) => void;
    onError?: (error: string) => void;
}

const useShareContent = (options: UseShareContentOptions = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const shareContent = async (payload: ShareContentPayload) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await shareService.shareContent(payload);
            options.onSuccess?.(response);
            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to share content';
            setError(errorMessage);
            options.onError?.(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        shareContent,
        isLoading,
        error,
        clearError: () => setError(null),
    };
};

interface ShareContentDialogProps {
    open: boolean;
    onClose: () => void;
    contentId: number;
    contentType: string;
    message?: string;
    userId?: number;
    onShareSuccess?: (recipientIds: number[]) => void;
}

const ShareContentDialog: React.FC<ShareContentDialogProps> = ({
    open,
    onClose,
    contentId,
    contentType,
    message = '',
    userId = parseInt(localStorage.getItem('childUserId') || '0'),
    onShareSuccess,
}) => {
    const [selectedUsers, setSelectedUsers] = useState<TaggedUser[]>([]);
    const [availableUsers, setAvailableUsers] = useState<TaggedUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [usersError, setUsersError] = useState('');
    const [shareMessage, setShareMessage] = useState(message);
    const [hasSearched, setHasSearched] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error' | 'warning' | 'info'
    });

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Share content hook
    const { shareContent, isLoading: isSharing, error: shareError, clearError } = useShareContent({
        onSuccess: (data) => {
            console.log('Content shared successfully:', data);
            showSnackbar(data.message || `Content shared with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}!`, 'success');
            onShareSuccess?.(selectedUsers.map(u => u.userId));
            setTimeout(() => {
                handleClose();
            }, 1500);
        },
        onError: (error) => {
            console.error('Failed to share content:', error);
            showSnackbar('Failed to share content. Please try again.', 'error');
        }
    });

    const searchConversations = async (query: string) => {
        if (!query.trim() || query.trim().length < 2) {
            setAvailableUsers([]);
            setHasSearched(false);
            return;
        }

        setLoadingUsers(true);
        setUsersError('');
        setHasSearched(true);

        try {
            const response = await userService.searchConversations(userId, query.trim());

            // Extract conversations and convert to TaggedUser format
            const conversations = response.data[0]?.conversations || [];
            const users: TaggedUser[] = conversations.map(conv => ({
                userId: conv.userId,
                username: '', // Not provided in the API response
                fullName: conv.conversationName,
                profilePicture: conv.conversationImage,
                isVerified: 'N', // Not provided in the API response
            }));

            setAvailableUsers(users);
        } catch (error) {
            console.error('Failed to search conversations:', error);
            setUsersError('Failed to search users. Please try again.');
            setAvailableUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        if (!open) return;

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // If search query is empty, clear results
        if (!searchQuery.trim()) {
            setAvailableUsers([]);
            setHasSearched(false);
            return;
        }

        // Set new timeout for debouncing (500ms delay)
        searchTimeoutRef.current = setTimeout(() => {
            searchConversations(searchQuery);
        }, 500);

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, open]);

    useEffect(() => {
        if (open) {
            setShareMessage(message);
        }
    }, [open, message]);

    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setSelectedUsers([]);
                setSearchQuery('');
                setUsersError('');
                setShareMessage('');
                setAvailableUsers([]);
                setHasSearched(false);
                clearError();
                setSnackbar({ open: false, message: '', severity: 'success' });
            }, 300);
        }
    }, [open]);

    const toggleUserSelection = (user: TaggedUser) => {
        setSelectedUsers(prev => {
            const isSelected = prev.some(u => u.userId === user.userId);
            if (isSelected) {
                return prev.filter(u => u.userId !== user.userId);
            } else {
                // Check if we've reached the maximum limit
                if (prev.length >= MAX_SHARE_RECIPIENTS) {
                    showSnackbar(`You can only share with up to ${MAX_SHARE_RECIPIENTS} people at a time`, 'warning');
                    return prev;
                }
                return [...prev, user];
            }
        });
    };

    const handleShare = async () => {
        if (selectedUsers.length === 0) {
            showSnackbar('Please select at least one person to share with', 'warning');
            return;
        }

        if (selectedUsers.length > MAX_SHARE_RECIPIENTS) {
            showSnackbar(`You can only share with up to ${MAX_SHARE_RECIPIENTS} people at a time`, 'warning');
            return;
        }

        clearError();

        try {
            await shareContent({
                userId,
                contentId,
                recipientUserIds: selectedUsers.map(u => u.userId),
                shareMessage: shareMessage.trim() || undefined,
                contentType,
            });
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    const handleClose = () => {
        onClose();
        setSelectedUsers([]);
        setSearchQuery('');
        setUsersError('');
        setShareMessage('');
        setAvailableUsers([]);
        setHasSearched(false);
        clearError();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        maxHeight: '80vh',
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 600,
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShareIcon sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                            Share Content
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handleClose}
                        disabled={isSharing}
                        size="small"
                    >
                        <XIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 0, pt: 2, pb: 0 }}>
                    {/* Search Bar */}
                    <Box sx={{ px: 3, mb: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="small"
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                            helperText={searchQuery.length > 0 && searchQuery.length < 2 ? "Type at least 2 characters to search" : ""}
                        />
                    </Box>

                    {/* Share Message */}
                    {/* <Box sx={{ px: 3, mb: 2 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Add a message (optional)..."
                            value={shareMessage}
                            onChange={(e) => setShareMessage(e.target.value)}
                            disabled={isSharing}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />
                    </Box> */}

                    {/* Selected Users Count */}
                    {selectedUsers.length > 0 && (
                        <Box sx={{ px: 3, mb: 2 }}>
                            <Typography variant="body2" color="primary" fontWeight={600}>
                                {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected
                                {selectedUsers.length >= MAX_SHARE_RECIPIENTS && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        (Maximum reached)
                                    </Typography>
                                )}
                            </Typography>
                        </Box>
                    )}

                    {/* Error Alert */}
                    {(usersError || shareError) && (
                        <Box sx={{ px: 3, mb: 2 }}>
                            <Alert
                                severity="error"
                                onClose={() => {
                                    setUsersError('');
                                    clearError();
                                }}
                            >
                                {usersError || shareError}
                            </Alert>
                        </Box>
                    )}

                    {/* Users List */}
                    {loadingUsers ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : !hasSearched ? (
                        <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
                            <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary" variant="body2">
                                Search for people to share with
                            </Typography>
                            <Typography color="text.disabled" variant="caption" display="block" sx={{ mt: 0.5 }}>
                                Start typing a name to find conversations
                            </Typography>
                            <Typography color="text.disabled" variant="caption" display="block" sx={{ mt: 1 }}>
                                You can share with up to {MAX_SHARE_RECIPIENTS} people at a time
                            </Typography>
                        </Box>
                    ) : availableUsers.length === 0 ? (
                        <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary" variant="body2">
                                No users found matching &quot;{searchQuery}&quot;
                            </Typography>
                            <Typography color="text.disabled" variant="caption" display="block" sx={{ mt: 0.5 }}>
                                Try a different search term
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ maxHeight: 400, overflow: 'auto', px: 0 }}>
                            {availableUsers.map(user => {
                                const isSelected = selectedUsers.some(u => u.userId === user.userId);
                                const isDisabled = !isSelected && selectedUsers.length >= MAX_SHARE_RECIPIENTS;

                                return (
                                    <ListItem key={user.userId} disablePadding>
                                        <ListItemButton
                                            onClick={() => toggleUserSelection(user)}
                                            disabled={isSharing || isDisabled}
                                            sx={{
                                                px: 3,
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                                opacity: isDisabled ? 0.5 : 1,
                                            }}
                                        >
                                            <Checkbox
                                                edge="start"
                                                checked={isSelected}
                                                tabIndex={-1}
                                                disableRipple
                                                disabled={isSharing || isDisabled}
                                                sx={{ mr: 1 }}
                                            />
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={user.profilePicture || undefined}
                                                    sx={{ width: 40, height: 40 }}
                                                >
                                                    {user.fullName[0]}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography variant="body1" fontWeight={600}>
                                                            {user.fullName}
                                                        </Typography>
                                                        {user.isVerified === 'Y' && (
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    borderRadius: '50%',
                                                                    bgcolor: 'primary.main',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    fontSize: '10px',
                                                                    fontWeight: 'bold',
                                                                }}
                                                            >
                                                                ✓
                                                            </Box>
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    user.username ? (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {user.username}
                                                        </Typography>
                                                    ) : null
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </DialogContent>

                {/* Actions */}
                <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                        onClick={handleClose}
                        disabled={isSharing}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleShare}
                        disabled={isSharing || selectedUsers.length === 0}
                        startIcon={
                            isSharing ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                <ShareIcon />
                            )
                        }
                        sx={{
                            textTransform: 'none',
                            px: 3,
                        }}
                    >
                        {isSharing ? 'Sharing...' : `Share${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success/Error Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        ...(snackbar.severity === 'success' && {
                            backgroundColor: '#1B5E20',
                            color: '#ffffff',
                            '& .MuiAlert-icon': {
                                color: '#ffffff',
                            },
                            '& .MuiAlert-action': {
                                color: '#ffffff',
                            },
                            '& .MuiIconButton-root': {
                                color: '#ffffff',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                }
                            }
                        })
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ShareContentDialog;