// components/SettingsPageContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
// import QRCode from 'react-qr-code';
import { QRCodeCanvas } from "qrcode.react";
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { tokenCookie, logoutUser } from '@/hooks/useAuthRedirect'


import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  RadioGroup,
  Radio,
  FormControlLabel,
  ListItemSecondaryAction,
  CircularProgress,
  Snackbar,
  Alert,
  Backdrop,
  TextField,
} from '@mui/material';
import {
  Logout as LogOutIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
  Block as BlockIcon,
  LocalOffer as TagIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// API Configuration
const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BitohubService';

// Type definitions
type AllowTagsFromType = 'everyone' | 'peopleYouFollow' | 'noOne';
type AllowMentionsFromType = 'everyone' | 'peopleYouFollow' | 'noOne';
type AllowCommentsFromType = 'followers' | 'followersYouFollowBack' | 'off';

type ApiTagsFromType = 'EVERYONE' | 'PEOPLEYOUFOLLOW' | 'NOONE';
type ApiMentionsFromType = 'EVERYONE' | 'PEOPLEYOUFOLLOW' | 'NOONE';
type ApiCommentsFromType = 'FOLLOWERS' | 'FOLLOWERSYOUFOLLOWBACK' | 'OFF';

interface HiddenStoryUser {
  hiddenUserId: number;
  email: string;
  fullName: string;
}

interface Settings {
  privateAccount: boolean;
  activityStatus: boolean;
  twoFactorEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  tagSettings: {
    allowTagsFrom: AllowTagsFromType;
    allowMentionsFrom: AllowMentionsFromType;
  };
  commentSettings: {
    allowCommentsFrom: AllowCommentsFromType;
    allowGifComments: boolean;
  };
  sharingSettings: {
    allowStoriesSharing: boolean;
  };
}

interface SettingItemProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface BlockedUser {
  blockId: string;
  blockedName: string;
  blockedUsername: string;
  userId: string;
  avatar?: string;
  note?: string;
  blockNote?: string;
  blockedDate?: string;
  blockedUserId?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

interface ApiResponse2 {
  error: {
    error_data: string | number;
    error_msg: string;
  };
}

interface Get2FAKeyResponse {
  success: boolean;
  message: string;

  data?: {
    twoFactorKey: string;
  };
}

interface Verify2FAResponse {
  error: {
    error_data: string | number;
    error_msg: string;
  };
}

interface Update2FAResponse {
  error: {
    error_data: string | number;
    error_msg: string;
  };
}

interface UserSettingsData {
  userId: number;
  email: string;
  username: string;
  privateAccount: boolean;
  activityStatus: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  twoFactorEnabled: boolean;
  passwordLastChanged: string | null;
  tagSettings: {
    allowTagsFrom: ApiTagsFromType;
    allowMentionsFrom: ApiMentionsFromType;
  };
  commentSettings: {
    allowCommentsFrom: ApiCommentsFromType;
    allowGifComments: boolean;
  };
  sharingSettings: {
    allowStoriesSharing: boolean;
  };
  blockedUsers: BlockedUser[];
}

// Utility functions for data transformation
const transformApiToLocal = {
  tagsFrom: (value: ApiTagsFromType): AllowTagsFromType => {
    const map: Record<ApiTagsFromType, AllowTagsFromType> = {
      'EVERYONE': 'everyone',
      'PEOPLEYOUFOLLOW': 'peopleYouFollow',
      'NOONE': 'noOne'
    };
    return map[value] || 'everyone';
  },
  mentionsFrom: (value: ApiMentionsFromType): AllowMentionsFromType => {
    const map: Record<ApiMentionsFromType, AllowMentionsFromType> = {
      'EVERYONE': 'everyone',
      'PEOPLEYOUFOLLOW': 'peopleYouFollow',
      'NOONE': 'noOne'
    };
    return map[value] || 'everyone';
  },
  commentsFrom: (value: ApiCommentsFromType): AllowCommentsFromType => {
    const map: Record<ApiCommentsFromType, AllowCommentsFromType> = {
      'FOLLOWERS': 'followers',
      'FOLLOWERSYOUFOLLOWBACK': 'followersYouFollowBack',
      'OFF': 'off'
    };
    return map[value] || 'followers';
  }
};

const transformLocalToApi = {
  tagsFrom: (value: AllowTagsFromType): ApiTagsFromType => {
    const map: Record<AllowTagsFromType, ApiTagsFromType> = {
      'everyone': 'EVERYONE',
      'peopleYouFollow': 'PEOPLEYOUFOLLOW',
      'noOne': 'NOONE'
    };
    return map[value] || 'EVERYONE';
  },
  mentionsFrom: (value: AllowMentionsFromType): ApiMentionsFromType => {
    const map: Record<AllowMentionsFromType, ApiMentionsFromType> = {
      'everyone': 'EVERYONE',
      'peopleYouFollow': 'PEOPLEYOUFOLLOW',
      'noOne': 'NOONE'
    };
    return map[value] || 'EVERYONE';
  },
  commentsFrom: (value: AllowCommentsFromType): ApiCommentsFromType => {
    const map: Record<AllowCommentsFromType, ApiCommentsFromType> = {
      'followers': 'FOLLOWERS',
      'followersYouFollowBack': 'FOLLOWERSYOUFOLLOWBACK',
      'off': 'OFF'
    };
    return map[value] || 'FOLLOWERS';
  }
};

// Type guard functions
const isValidTagsFrom = (value: string): value is AllowTagsFromType => {
  return ['everyone', 'peopleYouFollow', 'noOne'].includes(value);
};

const isValidMentionsFrom = (value: string): value is AllowMentionsFromType => {
  return ['everyone', 'peopleYouFollow', 'noOne'].includes(value);
};

const isValidCommentsFrom = (value: string): value is AllowCommentsFromType => {
  return ['followers', 'followersYouFollowBack', 'off'].includes(value);
};

const SettingsPageContent: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get userId from localStorage or your auth context
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [emailOtp, setEmailOtp] = useState<string>('');


  const [settings, setSettings] = useState<Settings>({
    privateAccount: false,
    activityStatus: true,
    twoFactorEnabled: false,
    pushNotifications: true,
    emailNotifications: true,
    tagSettings: {
      allowTagsFrom: 'everyone',
      allowMentionsFrom: 'everyone',
    },
    commentSettings: {
      allowCommentsFrom: 'followers',
      allowGifComments: true,
    },
    sharingSettings: {
      allowStoriesSharing: true,
    },
  });

  // Dialog states
  const [blockedAccountsOpen, setBlockedAccountsOpen] = useState(false);
  const [tagsAndMentionsOpen, setTagsAndMentionsOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [twoFactorVerifyDialogOpen, setTwoFactorVerifyDialogOpen] = useState(false);
  const [twoFactorQRDialogOpen, setTwoFactorQRDialogOpen] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  // Email update
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpDialogOpen, setEmailOtpDialogOpen] = useState(false);
  const [emailUpdateOtp, setEmailUpdateOtp] = useState('');
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);
  const [canResendEmailOtp, setCanResendEmailOtp] = useState(true);

  // Password update
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA states
  const [twoFactorOTP, setTwoFactorOTP] = useState('');
  const [twoFactorAuthOTP, setTwoFactorAuthOTP] = useState('');
  const [twoFactorQRCode, setTwoFactorQRCode] = useState('');
  const [twoFactorKey, setTwoFactorKey] = useState('');
  const [twoFactorVerificationCode, setTwoFactorVerificationCode] = useState('');
  const [is2FAEnabling, setIs2FAEnabling] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);

  // Loading and notification states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deactivatingAccount, setDeactivatingAccount] = useState(false);
  const [hiddenStoryUsers, setHiddenStoryUsers] = useState<HiddenStoryUser[]>([]);
  const [hiddenStoriesDialogOpen, setHiddenStoriesDialogOpen] = useState(false);
  const [hiddenStoriesLoading, setHiddenStoriesLoading] = useState(false);

  // Fetch user settings on component mount
  useEffect(() => {
    // Get userId from localStorage (adjust this based on your auth implementation)
    const storedUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId') || ''; // Default fallback
    setUserId(storedUserId);
    fetchUserSettings(storedUserId);
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  // Email OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailOtpTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendEmailOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailOtpTimer]);


  const deactivateAccount = async (userId: string) => {
    try {
      setDeactivatingAccount(true);
      const response = await fetchWithAuth(
        `${API_BASE_URL}/settings/account/deactivateAccount`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            action: "DEACTIVATE"
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showSnackbar('Account deactivated successfully. You will be logged out.', 'success');
        setTimeout(() => {
          handleSignOut();
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to deactivate account');
      }
    } catch (error) {
      console.error('Error deactivating account:', error);
      showSnackbar('Failed to deactivate account. Please try again.', 'error');
    } finally {
      setDeactivatingAccount(false);
    }
  };

  const deleteAccount = async (userId: string) => {
    try {
      setDeletingAccount(true);
      const response = await fetchWithAuth(
        `${API_BASE_URL}/settings/account/deleteAccount`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            action: "DELETE"
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showSnackbar('Account deleted successfully. You will be logged out.', 'success');
        setTimeout(() => {
          handleSignOut();
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showSnackbar('Failed to delete account. Please try again.', 'error');
    } finally {
      setDeletingAccount(false);
    }
  };


  const handleDeactivateAccount = () => {
    setDeactivateDialogOpen(true);
  };

  const handleConfirmDeactivate = () => {
    if (userId) {
      deactivateAccount(userId);
      setDeactivateDialogOpen(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userId) {
      deleteAccount(userId);
      setDeleteDialogOpen(false);
    }
  };

  // API Functions
  const sendOtpFor2FA = async () => {
    try {
      setLoading(true);
      const payload = {
        userId: localStorage.getItem('childUserId') || '',
        email: userEmail
      };

      const response = await axios.post<Get2FAKeyResponse>(
        `https://institutional-bo.paybito.com:8443/BitohubService/email/sendEmail/twoFectorOtp`,
        payload
      );

      if (response.data.success === true) {
        showSnackbar(response.data.message || 'OTP sent to your email', 'success');
        // Start OTP timer
        setOtpTimer(60); // 60 seconds
        setCanResendOtp(false);
        return true;
      } else {
        showSnackbar(response.data.message || 'Failed to send OTP', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      showSnackbar('Failed to send OTP', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSettings = async (uid: string) => {
    try {
      setInitialLoading(true);
      const currentPageId = localStorage.getItem('pageId') || '0'
      const isPersonalProfile = currentPageId === '0'
      const settingsUserId = isPersonalProfile ? uid : '0'
      const settingsPageId = isPersonalProfile ? '0' : currentPageId

      const response = await axios.get<ApiResponse<UserSettingsData>>(
        `${API_BASE_URL}/settings?userId=${settingsUserId}&pageId=${settingsPageId}`
      );

      if (response.data.success) {
        const data = response.data.data;

        // Update user info
        setUserEmail(data.email);
        setUsername(data.username);

        // Store push notification setting in localStorage for global access
        localStorage.setItem('pushNotificationsEnabled', data.pushNotifications ? 'true' : 'false');

        // Transform and set settings
        setSettings({
          privateAccount: data.privateAccount,
          activityStatus: data.activityStatus,
          twoFactorEnabled: data.twoFactorEnabled,
          pushNotifications: data.pushNotifications,
          emailNotifications: data.emailNotifications,
          tagSettings: {
            allowTagsFrom: transformApiToLocal.tagsFrom(data.tagSettings.allowTagsFrom),
            allowMentionsFrom: transformApiToLocal.mentionsFrom(data.tagSettings.allowMentionsFrom),
          },
          commentSettings: {
            allowCommentsFrom: transformApiToLocal.commentsFrom(data.commentSettings.allowCommentsFrom),
            allowGifComments: data.commentSettings.allowGifComments,
          },
          sharingSettings: {
            allowStoriesSharing: data.sharingSettings.allowStoriesSharing,
          },
        });

        // Set blocked users
        setBlockedUsers(data.blockedUsers);
      } else {
        showSnackbar(response.data.message || 'Failed to fetch settings', 'error');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showSnackbar('Failed to load settings. Please try again.', 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  const updatePrivacySettings = async (privateAccount: boolean, activityStatus: boolean) => {
    try {
      setLoading(true);
      const currentPageId = localStorage.getItem('pageId') || '0'
      const isPersonalProfile = currentPageId === '0'
      const privacyUserId = isPersonalProfile ? userId : '0'
      const privacyPageId = isPersonalProfile ? '0' : currentPageId

      const response = await axios.put<ApiResponse<boolean>>(
        `${API_BASE_URL}/settings/privacy/accountAndActivity?privateAccount=${privateAccount}&activityStatus=${activityStatus}&userId=${privacyUserId}&pageId=${privacyPageId}`
      );

      if (response.data.success) {
        showSnackbar('Privacy settings updated successfully', 'success');
      } else {
        showSnackbar(response.data.message || 'Failed to update privacy settings', 'error');
        // Revert on failure
        fetchUserSettings(userId);
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      showSnackbar('Failed to update privacy settings', 'error');
      // Revert on failure
      fetchUserSettings(userId);
    } finally {
      setLoading(false);
    }
  };

  const update2FASettings = async (twoFactorEnabled: boolean) => {
    // Don't make API call here, just open the verification dialog
    setIs2FAEnabling(twoFactorEnabled);
    setTwoFactorOTP('');
    setTwoFactorAuthOTP('');
    setTwoFactorVerifyDialogOpen(true);
  };

  // Get 2FA key and show QR code
  const get2FAKey = async () => {
    if (!twoFactorOTP) {
      showSnackbar('Please enter OTP', 'error');
      return;
    }

    // If user already has 2FA enabled and trying to enable again, we need the auth OTP
    if (settings.twoFactorEnabled && is2FAEnabling && !twoFactorAuthOTP) {
      showSnackbar('Please enter Google Authenticator OTP', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload: {
        userId: string;
        otp: string;
        gaOtp?: string;
      } = {
        userId: userId,
        otp: twoFactorOTP,
      };
      setEmailOtp(twoFactorOTP)

      if (settings.twoFactorEnabled) {
        payload.gaOtp = twoFactorAuthOTP;
      }

      const response = await axios.post<Get2FAKeyResponse>(
        `https://institutional-bo.paybito.com:8443/BitohubService/settings/account/getTwoFactorKey`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('access_token_us') || ''}`,
          },
        }
      );

      if (response.data.success === true) {

        if (settings.twoFactorEnabled) {
          showSnackbar(response.data.message, 'success');

        }
        else {

          const twoFactorAuthKey = response.data?.data?.twoFactorKey;
          if (!twoFactorAuthKey) {
            showSnackbar('Failed to get 2FA key', 'error');
            setSettings(prev => ({ ...prev, twoFactorEnabled: !is2FAEnabling }));
            return;
          }
          const encodedString = `otpauth://totp/${userEmail}?secret=${twoFactorAuthKey}&issuer=BitoCircle`;

          setTwoFactorQRCode(encodedString);
          setTwoFactorKey(twoFactorAuthKey);
          setTwoFactorVerifyDialogOpen(false);
          setTwoFactorQRDialogOpen(true);

        }


      } else {
        showSnackbar(response.data.message || 'Failed to get 2FA key', 'error');
        // Close the dialog
        setTwoFactorVerifyDialogOpen(false);
      }
    } catch (error) {
      console.error('Error getting 2FA key:', error);
      showSnackbar('Failed to get 2FA key', 'error');
      // Close the dialog
      setTwoFactorVerifyDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA code from authenticator
  const verify2FACode = async () => {
    if (!twoFactorVerificationCode) {
      showSnackbar('Please enter the verification code', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        userId: localStorage.getItem('childUserId') || '',
        otp: emailOtp,
        gaOtp: twoFactorVerificationCode
      };

      const response = await axios.post<Get2FAKeyResponse>(
        `https://institutional-bo.paybito.com:8443/BitohubService/settings/account/updateTwoFactorAuth`,
        payload
      );

      if (response.data?.success === true) {
        // Verification successful, now enable 2FA
        // await change2FAStatus(1);
        showSnackbar(response.data.message, 'success');
        setTimeout(() => {
          handleSignOut();

        }, 1500);

      } else {
        showSnackbar(response.data.message || 'Invalid verification code', 'error');
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      showSnackbar('Failed to verify code', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Enable/Disable 2FA status
  const change2FAStatus = async (enabled2fa: number) => {
    try {
      setLoading(true);
      const payload: {
        user_id: string;
        uuid: string;
        enabled2fa: number;
        otp: string;
        securityCode?: string;
      } = {
        user_id: localStorage.getItem('userId') || '',
        uuid: localStorage.getItem('uuid') || '',
        enabled2fa: enabled2fa,
        otp: twoFactorOTP,
      };

      if (enabled2fa === 1) {
        payload.securityCode = twoFactorVerificationCode;
      } else {
        payload.securityCode = twoFactorAuthOTP;
      }

      const response = await axios.post<Update2FAResponse>(
        `https://institutional-bo.paybito.com:8443/BrokerAdminApi/adminAccess/change2FaStatus`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem('access_token_us') || ''}`,
          },
        }
      );

      if (response.data.error.error_data === '0' || response.data.error.error_data === 0) {
        showSnackbar(
          '2FA status updated successfully. Please login again.',
          'success'
        );

        // Close all dialogs
        setTwoFactorQRDialogOpen(false);
        setTwoFactorVerifyDialogOpen(false);

        // Clear local storage and redirect to login after a delay
        setTimeout(async () => {
          const success = await logoutUser();
          if (success) {
            router.push('/login');
          }
        }, 2000);
      } else {
        showSnackbar(response.data.error.error_msg || 'Failed to update 2FA status', 'error');
        // Close dialogs
        setTwoFactorQRDialogOpen(false);
        setTwoFactorVerifyDialogOpen(false);
      }
    } catch (error) {
      console.error('Error changing 2FA status:', error);
      showSnackbar('Failed to update 2FA status', 'error');
      // Close dialogs
      setTwoFactorQRDialogOpen(false);
      setTwoFactorVerifyDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle disabling 2FA
  const disable2FA = async () => {
    if (!twoFactorOTP || !twoFactorAuthOTP) {
      showSnackbar('Please enter both OTP and Google Authenticator code', 'error');
      return;
    }

    await change2FAStatus(0);
  };

  // Copy 2FA key to clipboard
  const copy2FAKey = () => {
    navigator.clipboard.writeText(twoFactorKey);
    showSnackbar('2FA key copied to clipboard', 'success');
  };

  // Handle cancel of 2FA verification dialog
  const handle2FAVerifyCancel = () => {
    setTwoFactorVerifyDialogOpen(false);
    // No need to revert toggle since we never changed it
    setTwoFactorOTP('');
    setTwoFactorAuthOTP('');
    setOtpTimer(0);
    setCanResendOtp(true);
  };

  const updateNotificationSettings = async (type: 'PUSH' | 'EMAIL' | 'BOTH', enabled: boolean) => {
    try {
      setLoading(true);
      const response = await axios.post<ApiResponse<boolean>>(
        `${API_BASE_URL}/settings/notifications`,
        {
          userId: userId,
          type: type,
          enabled: enabled.toString()
        }
      );

      if (response.data.success) {
        showSnackbar('Notification settings updated successfully', 'success');
      } else {
        showSnackbar(response.data.message || 'Failed to update notification settings', 'error');
        // Revert on failure
        fetchUserSettings(userId);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      showSnackbar('Failed to update notification settings', 'error');
      // Revert on failure
      fetchUserSettings(userId);
    } finally {
      setLoading(false);
    }
  };

  const updateTagMentionSettings = async (allowTagsFrom: AllowTagsFromType, allowMentionsFrom: AllowMentionsFromType) => {
    try {
      setLoading(true);
      const response = await axios.post<ApiResponse<boolean>>(
        `${API_BASE_URL}/settings/updateTagMentionSettings`,
        {
          userId: userId,
          allowTagsFrom: transformLocalToApi.tagsFrom(allowTagsFrom),
          allowMentionsFrom: transformLocalToApi.mentionsFrom(allowMentionsFrom)
        }
      );

      if (response.data.success) {
        showSnackbar('Tag and mention settings updated successfully', 'success');
      } else {
        showSnackbar(response.data.message || 'Failed to update tag settings', 'error');
        // Revert on failure
        fetchUserSettings(userId);
      }
    } catch (error) {
      console.error('Error updating tag/mention settings:', error);
      showSnackbar('Failed to update tag settings', 'error');
      // Revert on failure
      fetchUserSettings(userId);
    } finally {
      setLoading(false);
    }
  };

  const updateCommentSettings = async (allowCommentsFrom: AllowCommentsFromType, allowGifComments: boolean) => {
    try {
      setLoading(true);
      const response = await axios.post<ApiResponse<boolean>>(
        `${API_BASE_URL}/settings/comments`,
        {
          userId: userId,
          allowCommentsFrom: transformLocalToApi.commentsFrom(allowCommentsFrom),
          allowGifComments: allowGifComments.toString()
        }
      );

      if (response.data.success) {
        showSnackbar('Comment settings updated successfully', 'success');
      } else {
        showSnackbar(response.data.message || 'Failed to update comment settings', 'error');
        // Revert on failure
        fetchUserSettings(userId);
      }
    } catch (error) {
      console.error('Error updating comment settings:', error);
      showSnackbar('Failed to update comment settings', 'error');
      // Revert on failure
      fetchUserSettings(userId);
    } finally {
      setLoading(false);
    }
  };

  const updateSharingSettings = async (allowStoriesSharing: boolean) => {
    try {
      setLoading(true);
      const response = await axios.post<ApiResponse<boolean>>(
        `${API_BASE_URL}/settings/sharing`,
        {
          userId: userId,
          allowStoriesSharing: allowStoriesSharing.toString()
        }
      );

      if (response.data.success) {
        showSnackbar('Sharing settings updated successfully', 'success');
      } else {
        showSnackbar(response.data.message || 'Failed to update sharing settings', 'error');
        // Revert on failure
        fetchUserSettings(userId);
      }
    } catch (error) {
      console.error('Error updating sharing settings:', error);
      showSnackbar('Failed to update sharing settings', 'error');
      // Revert on failure
      fetchUserSettings(userId);
    } finally {
      setLoading(false);
    }
  };

  const sendOTPForEmailUpdate = async (newEmailAddress: string) => {
    try {
      setLoading(true);
      const response = await axios.post<ApiResponse<ApiResponse2>>(
        'https://institutional-bo.paybito.com:8443/BitohubService/email/sendEmail/updateEmailOtp',
        {
          email: newEmailAddress,
          userId: localStorage.getItem('childUserId') || ''
        }
      );

      if (response.data.success) {
        showSnackbar('OTP sent to your new email address', 'success');
        // Store the pending email and open OTP dialog
        setPendingNewEmail(newEmailAddress);
        setEmailDialogOpen(false);
        setNewEmail('');
        setEmailUpdateOtp('');
        setEmailOtpTimer(60);
        setCanResendEmailOtp(false);
        setEmailOtpDialogOpen(true);
      } else {
        showSnackbar(response.data.message || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      showSnackbar('Failed to send OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendEmailUpdateOtp = async () => {
    if (!pendingNewEmail) {
      showSnackbar('Please enter email first', 'error');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post<ApiResponse<ApiResponse2>>(
        'https://institutional-bo.paybito.com:8443/BitohubService/email/sendEmail/updateEmailOtp',
        {
          email: pendingNewEmail,
          userId: localStorage.getItem('childUserId') || ''
        }
      );

      if (response.data.success) {
        showSnackbar('OTP resent to your new email address', 'success');
        setEmailOtpTimer(60);
        setCanResendEmailOtp(false);
      } else {
        showSnackbar(response.data.message || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      showSnackbar('Failed to resend OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateEmailWithOtp = async () => {
    if (!emailUpdateOtp) {
      showSnackbar('Please enter the OTP', 'error');
      return;
    }

    if (!pendingNewEmail) {
      showSnackbar('Email address not found. Please try again.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post<ApiResponse<{ message: string; status: boolean }>>(
        'https://institutional-bo.paybito.com:8443/BitohubService/settings/account/updateEmail',
        {
          email: pendingNewEmail,
          uuid: localStorage.getItem('uuid') || '',
          otp: parseInt(emailUpdateOtp)
        }
      );

      if (response.data.success && response.data.data?.status) {
        showSnackbar(response.data.data.message || 'Email updated successfully', 'success');
        setEmailOtpDialogOpen(false);
        setEmailUpdateOtp('');
        setPendingNewEmail('');
        // Refresh user settings to get updated email
        const storedUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId') || '';
        fetchUserSettings(storedUserId);
      } else {
        showSnackbar(response.data.message || 'Failed to update email', 'error');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      showSnackbar('Failed to update email. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpDialogClose = () => {
    setEmailOtpDialogOpen(false);
    setEmailUpdateOtp('');
    setPendingNewEmail('');
    setEmailOtpTimer(0);
    setCanResendEmailOtp(true);
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    try {
      setLoading(true);

      const storedAccessToken = localStorage.getItem('access_token_us');

      const response = await axios.post<ApiResponse2>(
        'https://institutional-bo.paybito.com:8443/BrokerAdminApi/adminAccess/changePassword',
        {
          uuid: localStorage.getItem('uuid'),
          password: currentPass,
          newPassword: newPass
        },
        {
          headers: {
            authorization: `bearer ${storedAccessToken}`
          }
        }
      );

      // Check if error object exists and has success message
      if (response.data.error && response.data.error.error_msg) {
        const errorMsg = response.data.error.error_msg;
        // Check for success (error_data === 0 means success)
        if (response.data.error.error_data === 0 || response.data.error.error_data === '0') {
          showSnackbar('Password changed successfully', 'success');
          setPasswordDialogOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          showSnackbar(errorMsg, 'error');
        }
      } else {
        showSnackbar('Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showSnackbar('Failed to change password. Please try again.', 'error');
    } finally {
      setLoading(false);  // ✅ Always stops loading, even if there's an error
    }
  };


  // Helper function to show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Event handlers
  const handlePrivateAccountToggle = () => {
    const newValue = !settings.privateAccount;
    setSettings(prev => ({ ...prev, privateAccount: newValue }));
    updatePrivacySettings(newValue, settings.activityStatus);
  };

  const handleActivityStatusToggle = () => {
    const newValue = !settings.activityStatus;
    setSettings(prev => ({ ...prev, activityStatus: newValue }));
    updatePrivacySettings(settings.privateAccount, newValue);
  };

  const handleTwoFactorToggle = async () => {
    const newValue = !settings.twoFactorEnabled;

    // Store the intention (enabling or disabling)
    setIs2FAEnabling(newValue);

    // Send OTP to email first
    const otpSent = await sendOtpFor2FA();

    if (otpSent) {
      // Open verification dialog to enter email OTP
      setTwoFactorOTP('');
      setTwoFactorAuthOTP('');
      setTwoFactorVerifyDialogOpen(true);
    }
  };

  const handlePushNotificationsToggle = () => {
    const newValue = !settings.pushNotifications;
    setSettings(prev => ({ ...prev, pushNotifications: newValue }));
    // Update localStorage for global access
    localStorage.setItem('pushNotificationsEnabled', newValue ? 'true' : 'false');
    updateNotificationSettings('PUSH', newValue);
  };

  const handleEmailNotificationsToggle = () => {
    const newValue = !settings.emailNotifications;
    setSettings(prev => ({ ...prev, emailNotifications: newValue }));
    updateNotificationSettings('EMAIL', newValue);
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      // Get logged-in user's ID
      const loggedInUserId = localStorage.getItem('childUserId')

      if (!loggedInUserId) {
        showSnackbar('Please login to perform this action', 'error')
        return
      }

      // Choose the appropriate API endpoint
      const endpoint = `https://institutional-bo.paybito.com:8443/BitohubService/settings/unblockUser/${loggedInUserId}/${userId}`

      const method = 'DELETE';

      const response = await fetchWithAuth(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar('User unblocked successfully', 'success')
        const storedUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId') || ''; // Default fallback

        fetchUserSettings(storedUserId);


      } else {
        throw new Error(result.message || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
    } finally {
      // handleMenuClose()
    }
  };

  const handleEditEmail = () => {
    setNewEmail('');
    setEmailDialogOpen(true);
  };

  const handleEmailUpdate = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail.trim()) {
      showSnackbar('Please enter an email address', 'error');
      return;
    }
    if (!emailRegex.test(newEmail)) {
      showSnackbar('Please enter a valid email address', 'error');
      return;
    }
    if (newEmail.toLowerCase() === userEmail.toLowerCase()) {
      showSnackbar('New email cannot be the same as current email', 'error');
      return;
    }
    sendOTPForEmailUpdate(newEmail);
  };

  const handleChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordDialogOpen(true);
  };

  const handlePasswordUpdate = () => {
    // Validation
    if (!currentPassword.trim()) {
      showSnackbar('Please enter your current password', 'error');
      return;
    }
    if (!newPassword.trim()) {
      showSnackbar('Please enter a new password', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showSnackbar('New password must be at least 8 characters long', 'error');
      return;
    }
    if (newPassword === currentPassword) {
      showSnackbar('New password must be different from current password', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }
    // Password strength validation (at least one uppercase, one lowercase, one number, one special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/;
    if (!passwordRegex.test(newPassword)) {
      showSnackbar('Password must contain uppercase, lowercase, number, and special character', 'error');
      return;
    }
    changePassword(currentPassword, newPassword);
  };



  const handleSignOut = async () => {
    try {
      const success = await logoutUser();
      if (success) {
        router.push('/login');
      } else {
        showSnackbar('Failed to sign out', 'error');
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      showSnackbar('Failed to sign out', 'error');
    }
  };

  const handleTagsFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (isValidTagsFrom(value)) {
      setSettings(prev => ({
        ...prev,
        tagSettings: {
          ...prev.tagSettings,
          allowTagsFrom: value
        }
      }));
      updateTagMentionSettings(value, settings.tagSettings.allowMentionsFrom);
    }
  };

  const handleMentionsFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (isValidMentionsFrom(value)) {
      setSettings(prev => ({
        ...prev,
        tagSettings: {
          ...prev.tagSettings,
          allowMentionsFrom: value
        }
      }));
      updateTagMentionSettings(settings.tagSettings.allowTagsFrom, value);
    }
  };

  const handleCommentsFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (isValidCommentsFrom(value)) {
      setSettings(prev => ({
        ...prev,
        commentSettings: {
          ...prev.commentSettings,
          allowCommentsFrom: value
        }
      }));
      updateCommentSettings(value, settings.commentSettings.allowGifComments);
    }
  };

  const handleGifCommentsToggle = () => {
    const newValue = !settings.commentSettings.allowGifComments;
    setSettings(prev => ({
      ...prev,
      commentSettings: {
        ...prev.commentSettings,
        allowGifComments: newValue
      }
    }));
    updateCommentSettings(settings.commentSettings.allowCommentsFrom, newValue);
  };

  const handleStoriesSharingToggle = () => {
    const newValue = !settings.sharingSettings.allowStoriesSharing;
    setSettings(prev => ({
      ...prev,
      sharingSettings: {
        ...prev.sharingSettings,
        allowStoriesSharing: newValue
      }
    }));
    updateSharingSettings(newValue);
  };

  const fetchHiddenStoryUsers = async () => {
    try {
      setHiddenStoriesLoading(true);
      const uid = localStorage.getItem('childUserId') || localStorage.getItem('userId') || '';
      const response = await axios.get<ApiResponse<HiddenStoryUser[]>>(
        `${API_BASE_URL}/stories/hidden-users/${uid}`
      );

      if (response.data.success) {
        setHiddenStoryUsers(response.data.data || []);
      } else {
        showSnackbar(response.data.message || 'Failed to fetch hidden users', 'error');
      }
    } catch (error) {
      console.error('Error fetching hidden story users:', error);
      showSnackbar('Failed to load hidden story users', 'error');
    } finally {
      setHiddenStoriesLoading(false);
    }
  };

  const handleUnhideStoryUser = async (hiddenUserId: number) => {
    try {
      setLoading(true);
      const uid = localStorage.getItem('childUserId') || localStorage.getItem('userId') || '';
      const response = await axios.post<ApiResponse<{ success: boolean; message: string }>>(
        `${API_BASE_URL}/stories/visibility`,
        {
          userId: uid,
          hiddenUserId: hiddenUserId.toString(),
          action: 'UNHIDE'
        }
      );

      if (response.data.success) {
        showSnackbar('User stories unhidden successfully', 'success');
        // Remove from local list
        setHiddenStoryUsers(prev => prev.filter(u => u.hiddenUserId !== hiddenUserId));
      } else {
        showSnackbar(response.data.message || 'Failed to unhide user', 'error');
      }
    } catch (error) {
      console.error('Error unhiding story user:', error);
      showSnackbar('Failed to unhide user. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHiddenStories = () => {
    setHiddenStoriesDialogOpen(true);
    fetchHiddenStoryUsers();
  };

  const SettingItem: React.FC<SettingItemProps> = ({ title, subtitle, action, onClick, icon }) => (
    <Box
      sx={{
        py: 2.5,
        px: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
        '&:hover': onClick ? {
          bgcolor: theme.palette.mode === 'light'
            ? 'rgba(0, 0, 0, 0.02)'
            : 'rgba(255, 255, 255, 0.05)'
        } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, mr: 2 }}>
        {icon && (
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: subtitle ? 0.5 : 0,
              fontSize: { xs: '0.95rem', sm: '1rem' }
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.813rem', sm: '0.875rem' }
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {action}
    </Box>
  );

  // Show loading spinner while fetching initial data
  if (initialLoading) {
    return (
      <Box sx={{
        bgcolor: theme.palette.background.default,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: theme.palette.background.default,
      minHeight: '100vh',
      pb: 4
    }}>
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Container maxWidth="md" sx={{ pt: { xs: 2, sm: 4 } }}>
        {/* Header */}
        <Box sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          {isMobile && (
            <IconButton
              onClick={() => router.back()}
              sx={{ ml: -1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2.125rem' }
            }}
          >
            Settings
          </Typography>
        </Box>

        {/* User Info Card */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Logged in as
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userEmail}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.125rem', sm: '1.25rem' }
                }}
              >
                Account
              </Typography>
            </Box>
            <Divider />

            <SettingItem
              title="Private account"
              subtitle="When your account is private, only the people you approve can see your photos, videos, and activity on BitoCircle."
              action={
                <Switch
                  checked={settings.privateAccount}
                  onChange={handlePrivateAccountToggle}
                  disabled={loading}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                        '& + .MuiSwitch-track': {
                          backgroundColor: theme.palette.primary.main,
                          opacity: 1,
                        }
                      }
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: theme.palette.action.disabledBackground,
                      opacity: 1,
                    }
                  }}
                />
              }
            />

            <Divider />

            <SettingItem
              title="Activity status"
              subtitle="Allow people to see when you're active on BitoHub apps and services."
              action={
                <Switch
                  checked={settings.activityStatus}
                  onChange={handleActivityStatusToggle}
                  disabled={loading}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                        '& + .MuiSwitch-track': {
                          backgroundColor: theme.palette.primary.main,
                          opacity: 1,
                        }
                      }
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: theme.palette.action.disabledBackground,
                      opacity: 1,
                    }
                  }}
                />
              }
            />

            <Divider />

            <SettingItem
              title="Edit email"
              onClick={handleEditEmail}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />

            <Divider />

            <SettingItem
              title="Change password"
              onClick={handleChangePassword}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />
            <Divider />


            <SettingItem
              title="Two-Factor Authentication"
              subtitle="Enhanced security for your account"
              action={
                <Switch
                  checked={settings.twoFactorEnabled}
                  onChange={handleTwoFactorToggle}
                  disabled={loading}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                        '& + .MuiSwitch-track': {
                          backgroundColor: theme.palette.primary.main,
                          opacity: 1,
                        }
                      }
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: theme.palette.action.disabledBackground,
                      opacity: 1,
                    }
                  }}
                />
              }
            />

            <Divider />

            <SettingItem
              title="Deactivate Account"
              subtitle="Temporarily disable your account"
              onClick={handleDeactivateAccount}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />

            <Divider />

            <SettingItem
              title="Delete Account"
              subtitle="Permanently delete your account and all data"
              onClick={handleDeleteAccount}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />
          </CardContent>
        </Card>

        {/* Interactions Card */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.125rem', sm: '1.25rem' }
                }}
              >
                How people can interact with you
              </Typography>
            </Box>
            <Divider />

            <SettingItem
              title="Blocked accounts"
              subtitle={`${blockedUsers.length} account${blockedUsers.length !== 1 ? 's' : ''}`}
              icon={<BlockIcon sx={{ color: theme.palette.text.secondary }} />}
              onClick={() => setBlockedAccountsOpen(true)}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />

            <Divider />

            <SettingItem
              title="Tags"
              subtitle={`Allow tags from ${settings.tagSettings.allowTagsFrom === 'everyone' ? 'everyone' :
                settings.tagSettings.allowTagsFrom === 'peopleYouFollow' ? 'people you follow' :
                  'no one'
                }`}
              icon={<TagIcon sx={{ color: theme.palette.text.secondary }} />}
              onClick={() => setTagsAndMentionsOpen(true)}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />

            <Divider />

            <SettingItem
              title="Comments"
              subtitle={`Allow comments from ${settings.commentSettings.allowCommentsFrom === 'followers' ? 'followers' :
                settings.commentSettings.allowCommentsFrom === 'followersYouFollowBack' ? 'followers you follow back' :
                  'off'
                }`}
              icon={<CommentIcon sx={{ color: theme.palette.text.secondary }} />}
              onClick={() => setCommentsOpen(true)}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />

            <Divider />

            <SettingItem
              title="Sharing"
              subtitle="Manage sharing settings"
              icon={<ShareIcon sx={{ color: theme.palette.text.secondary }} />}
              onClick={() => setSharingOpen(true)}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />

            <Divider />

            <SettingItem
              title="Hidden stories"
              subtitle={`Users whose stories you've hidden`}
              icon={<VisibilityOffIcon sx={{ color: theme.palette.text.secondary }} />}
              onClick={handleOpenHiddenStories}
              action={<ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />}
            />
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.125rem', sm: '1.25rem' }
                }}
              >
                Notifications
              </Typography>
            </Box>
            <Divider />

            <SettingItem
              title="Push notifications"
              subtitle="Receive push notifications on your device"
              action={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={handlePushNotificationsToggle}
                  disabled={loading}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                        '& + .MuiSwitch-track': {
                          backgroundColor: theme.palette.primary.main,
                          opacity: 1,
                        }
                      }
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: theme.palette.action.disabledBackground,
                      opacity: 1,
                    }
                  }}
                />
              }
            />

            <Divider />

            <SettingItem
              title="Email notifications"
              subtitle="Receive email updates about your account"
              action={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={handleEmailNotificationsToggle}
                  disabled={loading}
                  sx={{
                    '& .MuiSwitch-switchBase': {
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                        '& + .MuiSwitch-track': {
                          backgroundColor: theme.palette.primary.main,
                          opacity: 1,
                        }
                      }
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: theme.palette.action.disabledBackground,
                      opacity: 1,
                    }
                  }}
                />
              }
            />
          </CardContent>
        </Card>

        {/* BitoConnect Settings Card */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 0 }}>


            {/* Payments and Wallet */}
            <SettingItem
              title="Payments and Wallet"
              subtitle="Manage your B$ wallet and payment methods"
              onClick={() => router.push('/bitodollar-wallet')}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 600
                  }}
                >
                  Go to Payments and Wallet
                </Button>
              }
            />


          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 0 }}>



            {/* Identity Verification */}
            <SettingItem
              title="Identity Verification"
              subtitle="Complete KYC verification for full access"
              onClick={() => router.push('/kyc')}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 600
                  }}
                >
                  Go to KYC Page
                </Button>
              }
            />


          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper
          }}
        >
          <CardContent sx={{ p: 0 }}>




            {/* Withdrawal Bank */}
            <SettingItem
              title="Withdrawal Bank"
              subtitle="Manage your bank account for withdrawals"
              onClick={() => router.push('/bank-details')}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 600
                  }}
                >
                  Bank Info Page
                </Button>
              }
            />

            {/* API Keys */}
            <SettingItem
              title="API Keys"
              subtitle="Call the BitoCircle API from your own server or app"
              onClick={() => router.push('/api-keys')}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 600
                  }}
                >
                  Manage Keys
                </Button>
              }
            />

            {/* Community Domains */}
            <SettingItem
              title="Community Domains"
              subtitle="Run your own BitoCircle community on your own domain"
              onClick={() => router.push('/domains')}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 600
                  }}
                >
                  Manage Domains
                </Button>
              }
            />

            {/* Connected Apps */}
            <SettingItem
              title="Connected Apps"
              subtitle="App Store apps you allowed to use your account"
              onClick={() => router.push('/connected-apps')}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    fontWeight: 600
                  }}
                >
                  Manage Apps
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button
          fullWidth
          variant="outlined"
          onClick={handleSignOut}
          startIcon={<LogOutIcon />}
          sx={{
            py: 1.5,
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            color: theme.palette.error.main,
            borderColor: theme.palette.error.main,
            '&:hover': {
              borderColor: theme.palette.error.dark,
              bgcolor: theme.palette.mode === 'light'
                ? 'rgba(211, 47, 47, 0.04)'
                : 'rgba(244, 67, 54, 0.08)'
            }
          }}
        >
          Sign Out
        </Button>
      </Container>

      {/* Blocked Accounts Dialog */}
      <Dialog
        open={blockedAccountsOpen}
        onClose={() => setBlockedAccountsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setBlockedAccountsOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Blocked accounts
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {blockedUsers.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <BlockIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No blocked accounts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Accounts you block will appear here
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {blockedUsers.map((user, index) => (
                <React.Fragment key={user.blockId}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.02)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.avatar}>
                        {user.blockedName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={600}>
                          {user.blockedName}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {user.blockedUsername}
                          </Typography>
                          {user.note && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {user.note}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleUnblockUser(user.blockedUserId || 0)}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 2,
                          fontWeight: 600
                        }}
                      >
                        Unblock
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Tags and Mentions Dialog */}
      <Dialog
        open={tagsAndMentionsOpen}
        onClose={() => setTagsAndMentionsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setTagsAndMentionsOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Tags and mentions
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Who can tag you
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose who can tag you to link your account in their photos, videos, and other content. When people try to tag you, they will see if you do not allow tags from everyone.
            </Typography>
            <RadioGroup
              value={settings.tagSettings.allowTagsFrom}
              onChange={handleTagsFromChange}
            >
              <FormControlLabel
                value="everyone"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Allow tags from everyone"
                sx={{ mb: 1 }}
                disabled={loading}
              />
              <FormControlLabel
                value="peopleYouFollow"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Allow tags from people you follow"
                sx={{ mb: 1 }}
                disabled={loading}
              />
              <FormControlLabel
                value="noOne"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Don't allow tags"
                disabled={loading}
              />
            </RadioGroup>
          </Box>

          {/* <Divider sx={{ mb: 3 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Who can mention you
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose who can mention you to link your account in their stories, notes, comments, live videos, and captions. When people try to mention you, they will see if you do not allow mentions.
            </Typography>
            <RadioGroup
              value={settings.tagSettings.allowMentionsFrom}
              onChange={handleMentionsFromChange}
            >
              <FormControlLabel
                value="everyone"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Allow mentions from everyone"
                sx={{ mb: 1 }}
                disabled={loading}
              />
              <FormControlLabel
                value="peopleYouFollow"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Allow mentions from people you follow"
                sx={{ mb: 1 }}
                disabled={loading}
              />
              <FormControlLabel
                value="noOne"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Don't allow mentions"
                disabled={loading}
              />
            </RadioGroup>
          </Box> */}
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setCommentsOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Comments
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Allow comments from
            </Typography>
            <RadioGroup
              value={settings.commentSettings.allowCommentsFrom}
              onChange={handleCommentsFromChange}
            >
              <FormControlLabel
                value="followers"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Your followers"
                sx={{ mb: 2, alignItems: 'flex-start' }}
                disabled={loading}
              />
              <FormControlLabel
                value="followersYouFollowBack"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Followers you follow back"
                sx={{ mb: 2, alignItems: 'flex-start' }}
                disabled={loading}
              />
              <FormControlLabel
                value="off"
                control={<Radio sx={{ color: theme.palette.primary.main }} />}
                label="Off"
                disabled={loading}
              />
            </RadioGroup>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Allow GIF comments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                People will be able to comment GIFs on your posts and reels.
              </Typography>
            </Box>
            <Switch
              checked={settings.commentSettings.allowGifComments}
              onChange={handleGifCommentsToggle}
              disabled={loading}
              sx={{
                '& .MuiSwitch-switchBase': {
                  '&.Mui-checked': {
                    color: theme.palette.primary.main,
                    '& + .MuiSwitch-track': {
                      backgroundColor: theme.palette.primary.main,
                      opacity: 1,
                    }
                  }
                },
                '& .MuiSwitch-track': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  opacity: 1,
                }
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Sharing Dialog */}
      <Dialog
        open={sharingOpen}
        onClose={() => setSharingOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setSharingOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Sharing
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            What people can share on BitoCircle
          </Typography>

          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            py: 2
          }}>
            <Box sx={{ flex: 1, mr: 2 }}>
              <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
                Stories in messages
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Allow people to send your stories in a message to someone else on BitoHub. Only your followers can see your stories.
              </Typography>
            </Box>
            <Switch
              checked={settings.sharingSettings.allowStoriesSharing}
              onChange={handleStoriesSharingToggle}
              disabled={loading}
              sx={{
                '& .MuiSwitch-switchBase': {
                  '&.Mui-checked': {
                    color: theme.palette.primary.main,
                    '& + .MuiSwitch-track': {
                      backgroundColor: theme.palette.primary.main,
                      opacity: 1,
                    }
                  }
                },
                '& .MuiSwitch-track': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  opacity: 1,
                }
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setEmailDialogOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Edit Email
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your new email address. We will send you a verification code to confirm the change.
          </Typography>
          <TextField
            fullWidth
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter your new email"
            disabled={loading}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Current email: {userEmail}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setEmailDialogOpen(false)}
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEmailUpdate}
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              }
            }}
          >
            Send OTP
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setPasswordDialogOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Change Password
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your current password and choose a new password. Your password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
          </Typography>

          <TextField
            fullWidth
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            disabled={loading}
            autoFocus
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            disabled={loading}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setPasswordDialogOpen(false)}
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordUpdate}
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              }
            }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Verification Dialog - for OTP entry */}
      <Dialog
        open={twoFactorVerifyDialogOpen}
        onClose={handle2FAVerifyCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={handle2FAVerifyCancel}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {is2FAEnabling ? 'Enable' : 'Disable'} Two-Factor Authentication
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {is2FAEnabling
              ? 'We have sent a verification code to your registered email. Please enter it below to proceed.'
              : 'We have sent a verification code to your registered email. Please enter it below to proceed with disabling 2FA.'}
          </Typography>

          <TextField
            fullWidth
            label="Email OTP"
            type="text"
            value={twoFactorOTP}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                setTwoFactorOTP(value);
              }
            }}
            placeholder="Enter OTP sent to your email"
            disabled={loading}
            autoFocus
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* Resend OTP Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              onClick={() => sendOtpFor2FA()}
              disabled={!canResendOtp || loading}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem'
              }}
            >
              {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend OTP'}
            </Button>
          </Box>

          {(settings.twoFactorEnabled || !is2FAEnabling) && (
            <TextField
              fullWidth
              label="Google Authenticator OTP"
              type="text"
              value={twoFactorAuthOTP}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  setTwoFactorAuthOTP(value);
                }
              }}
              placeholder="Enter Google Authenticator code"
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handle2FAVerifyCancel}
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={is2FAEnabling ? get2FAKey : get2FAKey}
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              }
            }}
          >
            {is2FAEnabling ? 'Continue' : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA QR Code Dialog */}
      <Dialog
        open={twoFactorQRDialogOpen}
        onClose={() => { }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Scan QR Code
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Scan this QR code with your Google Authenticator app, then enter the verification code below.
          </Typography>

          {/* QR Code */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
            p: 2,
            bgcolor: theme.palette.background.default,
            borderRadius: 2
          }}>
            {/* <QRCode
              value={twoFactorQRCode}
              size={200}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
            /> */}
            <QRCodeCanvas
              value={twoFactorQRCode}
              size={256}
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />

          </Box>

          {/* 2FA Key */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Two Factor Auth Key
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              value={twoFactorKey}
              disabled
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <Button
              onClick={copy2FAKey}
              variant="outlined"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                minWidth: 100
              }}
            >
              Copy
            </Button>
          </Box>

          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            *Please do not reload the page or click the back button.
          </Typography>

          <TextField
            fullWidth
            label="Enter Google Authentication Code"
            type="text"
            value={twoFactorVerificationCode}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                setTwoFactorVerificationCode(value);
              }
            }}
            placeholder="Enter the 6-digit code from your authenticator app"
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={verify2FACode}
            variant="contained"
            disabled={loading || !twoFactorVerificationCode}
            fullWidth
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              py: 1.5,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              }
            }}
          >
            Verify and Enable 2FA
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email OTP Verification Dialog */}
      <Dialog
        open={emailOtpDialogOpen}
        onClose={handleEmailOtpDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={handleEmailOtpDialogClose}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Verify Email
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We have sent a verification code to your email id. Please enter the OTP below to confirm your new email address.
          </Typography>

          <TextField
            fullWidth
            label="Enter OTP"
            type="text"
            value={emailUpdateOtp}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                setEmailUpdateOtp(value);
              }
            }}
            placeholder="Enter the OTP sent to your email"
            disabled={loading}
            autoFocus
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* Resend OTP Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              onClick={resendEmailUpdateOtp}
              disabled={!canResendEmailOtp || loading}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem'
              }}
            >
              {emailOtpTimer > 0 ? `Resend OTP in ${emailOtpTimer}s` : 'Resend OTP'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleEmailOtpDialogClose}
            disabled={loading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={updateEmailWithOtp}
            variant="contained"
            disabled={loading || !emailUpdateOtp}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              }
            }}
          >
            Verify & Update Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Account Warning Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setDeactivateDialogOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, color: theme.palette.warning.main }}>
            Deactivate Account
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="body1" fontWeight={600} sx={{ mt: 2, mb: 2, color: theme.palette.warning.main }}>
            Are you sure you want to deactivate your account?
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            When you deactivate your account:
          </Typography>

          <Box component="ul" sx={{ pl: 2, mb: 3 }}>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Your profile, posts, and comments will be hidden
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              You will be able to log in with this account any time
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              You can reactivate your account by logging with your username and password
            </Typography>

          </Box>

          <Typography variant="caption" color="text.secondary">
            To proceed with deactivation, you will be logged out immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeactivateDialogOpen(false)}
            disabled={deactivatingAccount}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeactivate}
            variant="contained"
            disabled={deactivatingAccount}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              bgcolor: theme.palette.warning.main,
              '&:hover': {
                bgcolor: theme.palette.warning.dark,
              }
            }}
          >
            {deactivatingAccount ? 'Deactivating...' : 'Deactivate Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Warning Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, color: theme.palette.error.main }}>
            Delete Account Permanently
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography variant="body1" fontWeight={600} sx={{ mt: 2, mb: 2, color: theme.palette.error.main }}>
            ⚠️ This action cannot be undone!
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            When you delete your account:
          </Typography>

          <Box component="ul" sx={{ pl: 2, mb: 3 }}>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              All your posts, comments, likes, and shares will be permanently deleted
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Your profile information will be erased
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Your followers and following lists will be cleared
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              All your messages and conversations will be deleted
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Your B$ wallet balance may be forfeited (check wallet terms)
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">
            This action is irreversible. You won&apos;t be able to recover your account or any data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingAccount}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={deletingAccount}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              bgcolor: theme.palette.error.main,
              '&:hover': {
                bgcolor: theme.palette.error.dark,
              }
            }}
          >
            {deletingAccount ? 'Deleting...' : 'Delete Account Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden Story Users Dialog */}
      <Dialog
        open={hiddenStoriesDialogOpen}
        onClose={() => setHiddenStoriesDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}>
          <IconButton
            onClick={() => setHiddenStoriesDialogOpen(false)}
            sx={{ ml: -1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Hidden Stories
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {hiddenStoriesLoading ? (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : hiddenStoryUsers.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <VisibilityOffIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No hidden story users
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Users whose stories you hide will appear here
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {hiddenStoryUsers.map((user, index) => (
                <React.Fragment key={user.hiddenUserId}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'light'
                          ? 'rgba(0, 0, 0, 0.02)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {user.fullName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={600}>
                          {user.fullName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleUnhideStoryUser(user.hiddenUserId)}
                        disabled={loading}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 2,
                          fontWeight: 600
                        }}
                      >
                        Unhide
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SettingsPageContent;