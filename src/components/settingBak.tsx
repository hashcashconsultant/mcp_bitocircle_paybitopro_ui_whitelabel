// components/SettingsPageContent.tsx
'use client';

import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Type definitions
type AllowTagsFromType = 'everyone' | 'peopleYouFollow' | 'noOne';
type AllowMentionsFromType = 'everyone' | 'peopleYouFollow' | 'noOne';
type AllowCommentsFromType = 'followers' | 'followersYouFollowBack' | 'off';

interface Settings {
  privateAccount: boolean;
  activityStatus: boolean;
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
  id: string;
  name: string;
  username: string;
  avatar?: string;
  note?: string;
}

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

  const [settings, setSettings] = useState<Settings>({
    privateAccount: false,
    activityStatus: true,
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

  // Sample blocked users data
  const [blockedUsers] = useState<BlockedUser[]>([
    {
      id: '1',
      name: 'jayati.m.bk',
      username: '@jayati.m.bk',
      note: 'Includes other accounts they may have or create',
    },
    {
      id: '2',
      name: 'Goutam Saha',
      username: '@goutam.saha',
      note: 'Includes other accounts they may have or create',
    },
  ]);

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

  const handleToggleSetting = (settingKey: keyof Settings) => {
    setSettings(prev => ({ 
      ...prev, 
      [settingKey]: !prev[settingKey] as boolean
    }));
  };

  const handleUnblockUser = (userId: string) => {
    console.log('Unblocking user:', userId);
  };

  const handleEditEmail = () => {
    router.push('/settings/email');
  };

  const handleChangePassword = () => {
    router.push('/settings/password');
  };

  const handleSignOut = async () => {
    try {
      router.push('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
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
    }
  };

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default,
      minHeight: '100vh',
      pb: 4
    }}>
      <Container maxWidth="md" sx={{ 
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3 }
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            mb: 4,
            color: theme.palette.text.primary,
            fontSize: { xs: '1.75rem', sm: '2.125rem' }
          }}
        >
          Settings
        </Typography>
        
        {/* Account Settings */}
        <Card sx={{ 
          mb: 3,
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'light'
            ? '0 1px 3px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.3)',
          border: 'none',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  color: theme.palette.text.primary
                }}
              >
                Account Settings
              </Typography>
            </Box>
            <Divider />
            
            <SettingItem
              title="Email Address"
              subtitle="your.email@example.com"
              action={
                <ChevronRightIcon 
                  sx={{ 
                    color: theme.palette.action.disabled,
                    fontSize: 22
                  }} 
                />
              }
              onClick={handleEditEmail}
            />
            <Divider sx={{ mx: 3 }} />
            
            <SettingItem
              title="Password"
              subtitle="Last changed 3 months ago"
              action={
                <ChevronRightIcon 
                  sx={{ 
                    color: theme.palette.action.disabled,
                    fontSize: 22
                  }} 
                />
              }
              onClick={handleChangePassword}
            />
            <Divider sx={{ mx: 3 }} />
            
            <SettingItem
              title="Two-Factor Authentication"
              subtitle="Enhanced security for your account"
              action={
                <Box sx={{ 
                  px: 2, 
                  py: 0.5, 
                  bgcolor: theme.palette.mode === 'light' ? '#D1FAE5' : 'rgba(16, 185, 129, 0.2)',
                  color: theme.palette.mode === 'light' ? '#065F46' : '#6EE7B7',
                  borderRadius: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  Enabled
                </Box>
              }
            />
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card sx={{ 
          mb: 3,
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'light'
            ? '0 1px 3px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.3)',
          border: 'none',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  color: theme.palette.text.primary
                }}
              >
                Privacy Settings
              </Typography>
            </Box>
            <Divider />
            
            <SettingItem
              title="Private Account"
              subtitle="Only followers can see your content"
              action={
                <Switch
                  checked={settings.privateAccount}
                  onChange={() => handleToggleSetting('privateAccount')}
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
            <Divider sx={{ mx: 3 }} />
            
            <SettingItem
              title="Show Activity Status"
              subtitle="Let others see when you're online"
              action={
                <Switch
                  checked={settings.activityStatus}
                  onChange={() => handleToggleSetting('activityStatus')}
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
            <Divider sx={{ mx: 3 }} />

            <SettingItem
              icon={<BlockIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
              title="Blocked Accounts"
              subtitle="Manage accounts you've blocked"
              action={
                <ChevronRightIcon 
                  sx={{ 
                    color: theme.palette.action.disabled,
                    fontSize: 22
                  }} 
                />
              }
              onClick={() => setBlockedAccountsOpen(true)}
            />
            <Divider sx={{ mx: 3 }} />

            <SettingItem
              icon={<TagIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
              title="Tags and Mentions"
              subtitle="Control who can tag and mention you"
              action={
                <ChevronRightIcon 
                  sx={{ 
                    color: theme.palette.action.disabled,
                    fontSize: 22
                  }} 
                />
              }
              onClick={() => setTagsAndMentionsOpen(true)}
            />
            <Divider sx={{ mx: 3 }} />

            <SettingItem
              icon={<CommentIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
              title="Comments"
              subtitle="Control who can comment on your posts"
              action={
                <ChevronRightIcon 
                  sx={{ 
                    color: theme.palette.action.disabled,
                    fontSize: 22
                  }} 
                />
              }
              onClick={() => setCommentsOpen(true)}
            />
            <Divider sx={{ mx: 3 }} />

            <SettingItem
              icon={<ShareIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
              title="Sharing"
              subtitle="Manage how others can share your content"
              action={
                <ChevronRightIcon 
                  sx={{ 
                    color: theme.palette.action.disabled,
                    fontSize: 22
                  }} 
                />
              }
              onClick={() => setSharingOpen(true)}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card sx={{ 
          mb: 4,
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'light'
            ? '0 1px 3px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.3)',
          border: 'none',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  color: theme.palette.text.primary
                }}
              >
                Notifications
              </Typography>
            </Box>
            <Divider />
            
            <SettingItem
              title="Push Notifications"
              subtitle="Receive notifications on your device"
              action={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={() => handleToggleSetting('pushNotifications')}
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
            <Divider sx={{ mx: 3 }} />
            
            <SettingItem
              title="Email Notifications"
              subtitle="Get updates via email"
              action={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={() => handleToggleSetting('emailNotifications')}
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

        {/* Sign Out Button */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<LogOutIcon sx={{ fontSize: 22 }} />}
          onClick={handleSignOut}
          sx={{
            py: 1.75,
            bgcolor: theme.palette.error.main,
            borderRadius: 3,
            textTransform: 'none',
            fontSize: { xs: '0.95rem', sm: '1rem' },
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: theme.palette.error.dark,
              boxShadow: theme.palette.mode === 'light'
                ? '0 4px 6px rgba(239, 68, 68, 0.25)'
                : '0 4px 6px rgba(0, 0, 0, 0.4)'
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
          <Typography
            variant="body2"
            sx={{
              p: 2,
              color: theme.palette.text.secondary,
              bgcolor: theme.palette.mode === 'light' 
                ? 'rgba(0, 0, 0, 0.02)' 
                : 'rgba(255, 255, 255, 0.02)'
            }}
          >
            You can block people anytime from their profiles.
          </Typography>
          <List sx={{ pt: 0 }}>
            {blockedUsers.map((user) => (
              <ListItem key={user.id} sx={{ px: 2, py: 1.5 }}>
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.action.hover,
                    color: theme.palette.text.secondary
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight={500}>
                      {user.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {user.note}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleUnblockUser(user.id)}
                    sx={{
                      textTransform: 'none',
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary,
                      '&:hover': {
                        borderColor: theme.palette.text.secondary,
                        bgcolor: theme.palette.action.hover
                      }
                    }}
                  >
                    Unblock
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
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
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Who can tag you
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose who can tag you in their photos and videos. When people try to tag you, they will see if you do not allow tags from everyone.
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
              />
              <FormControlLabel 
                value="peopleYouFollow" 
                control={<Radio sx={{ color: theme.palette.primary.main }} />} 
                label="Allow tags from people you follow"
                sx={{ mb: 1 }}
              />
              <FormControlLabel 
                value="noOne" 
                control={<Radio sx={{ color: theme.palette.primary.main }} />} 
                label="Don't allow tags"
              />
            </RadioGroup>
            
            <Button
              variant="text"
              sx={{
                mt: 2,
                color: theme.palette.primary.main,
                textTransform: 'none',
                p: 0,
                '&:hover': {
                  bgcolor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              Manually approve tags →
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

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
              />
              <FormControlLabel 
                value="peopleYouFollow" 
                control={<Radio sx={{ color: theme.palette.primary.main }} />} 
                label="Allow mentions from people you follow"
                sx={{ mb: 1 }}
              />
              <FormControlLabel 
                value="noOne" 
                control={<Radio sx={{ color: theme.palette.primary.main }} />} 
                label="Don't allow mentions"
              />
            </RadioGroup>
          </Box>
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
                label={
                  <Box>
                    <Typography variant="body1">Your followers</Typography>
                    <Typography variant="caption" color="text.secondary">
                      18 People
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />
              <FormControlLabel 
                value="followersYouFollowBack" 
                control={<Radio sx={{ color: theme.palette.primary.main }} />} 
                label={
                  <Box>
                    <Typography variant="body1">Followers you follow back</Typography>
                    <Typography variant="caption" color="text.secondary">
                      2 People
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, alignItems: 'flex-start' }}
              />
              <FormControlLabel 
                value="off" 
                control={<Radio sx={{ color: theme.palette.primary.main }} />} 
                label="Off"
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
              onChange={() => setSettings(prev => ({
                ...prev,
                commentSettings: {
                  ...prev.commentSettings,
                  allowGifComments: !prev.commentSettings.allowGifComments
                }
              }))}
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
            What people can share on BitoHub
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
              onChange={() => setSettings(prev => ({
                ...prev,
                sharingSettings: {
                  ...prev.sharingSettings,
                  allowStoriesSharing: !prev.sharingSettings.allowStoriesSharing
                }
              }))}
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
    </Box>
  );
};

export default SettingsPageContent;