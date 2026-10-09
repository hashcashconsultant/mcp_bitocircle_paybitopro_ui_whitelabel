import React, { useState, useRef } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Movie as FilmIcon,
  Image as ImageIcon,
  Public as PublicIcon,
  People as PeopleIcon,
  Lock as LockIcon,
  Star as StarIcon,
  Campaign as CampaignIcon,    // ADD
  Search as SearchIcon,         // ADD
  Close as CloseIcon,           // ADD
  Check as CheckIcon,
} from '@mui/icons-material';

// ==================== PRIVACY TYPES ====================

interface PrivacySetting {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface Campaign {
  campaignId: number;
  campaignName: string;
  description: string | null;
  startDate: string;
  endDate: string;
  creatorRegion: string | null;
  creatorType: string | null;
  audienceInterest: string | null;
  compensationType: string | null;
  paymentCurrency: string;
  totalBudget: number;
  kpiType: string;
  kpiTarget: string;
  status: string;
  brandId: number;
  hashtags: string[];
  campaignType: string;
  budgetPerCreator: number;
}

interface GetActiveCampaignsResponse {
  success: boolean;
  message: string;
  data: Campaign[];
  recordCount: number;
}

const privacyOptions: PrivacySetting[] = [
  { value: '1', label: 'Public', description: 'Anyone can see this post', icon: <PublicIcon sx={{ color: '#4caf50' }} /> },
  { value: '2', label: 'Only Followers', description: 'Only your followers can see this post', icon: <PeopleIcon sx={{ color: '#2196f3' }} /> },
  { value: '3', label: 'Only Me', description: 'Only you can see this post', icon: <LockIcon sx={{ color: '#ff9800' }} /> },
  { value: '4', label: 'Exclusive Content', description: 'This content will be visible only to your subscribed followers', icon: <StarIcon sx={{ color: '#9c27b0' }} /> },
];

// ==================== COMPONENT PROPS ====================

interface CreateReelDialogProps {
  open: boolean;
  onClose: () => void;
  onPublish?: (data: {
    title: string;
    description: string;
    hashtags: string;
    video: File | null;
    coverImage?: File;
    visibilityType: string;  // ✅ NEW: pass selected visibility
    campaignId?: number;      // ADD
    brandId?: number;          // ADD
  }) => void;
}

const CreateReelDialog: React.FC<CreateReelDialogProps> = ({ open, onClose, onPublish }) => {
  const [reelTitle, setReelTitle] = useState('');
  const [reelDescription, setReelDescription] = useState('');
  const [hashtags, setHashtags] = useState('#startup #growth #business');
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [visibilityType, setVisibilityType] = useState('1'); // ✅ NEW: default Public

  // Campaign state
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignsError, setCampaignsError] = useState('');
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [additionalHashtags, setAdditionalHashtags] = useState<string[]>([]);
  const [newHashtagInput, setNewHashtagInput] = useState('');

  const MONETIZE_SERVICE_URL = 'https://institutional-bo.paybito.com:8443/MonetizeService';

  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


  const fetchActiveCampaigns = async () => {
    const userId = localStorage.getItem('childUserId') || '0';
    setLoadingCampaigns(true);
    setCampaignsError('');
    try {
      const response = await fetchWithAuth(
        `${MONETIZE_SERVICE_URL}/collab/creator/deal/active/${userId}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: GetActiveCampaignsResponse = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch campaigns');
      setAvailableCampaigns(data.data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setCampaignsError('Failed to load campaigns. Please try again.');
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleCampaignDialogOpen = () => {
    setShowCampaignDialog(true);
    if (availableCampaigns.length === 0) fetchActiveCampaigns();
  };

  const handleCampaignDialogClose = () => {
    setShowCampaignDialog(false);
    setCampaignSearchQuery('');
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setAdditionalHashtags([]);
    setNewHashtagInput('');
    setShowCampaignDialog(false);
    setCampaignSearchQuery('');
  };

  const handleRemoveCampaign = () => {
    setSelectedCampaign(null);
    setAdditionalHashtags([]);
    setNewHashtagInput('');
  };

  const handleAddHashtag = () => {
    let tag = newHashtagInput.trim();
    if (!tag) return;
    if (!tag.startsWith('#')) tag = '#' + tag;
    const campaignTags = selectedCampaign?.hashtags || [];
    if (
      campaignTags.some(t => t.toLowerCase() === tag.toLowerCase()) ||
      additionalHashtags.some(t => t.toLowerCase() === tag.toLowerCase())
    ) return;
    setAdditionalHashtags(prev => [...prev, tag]);
    setNewHashtagInput('');
  };

  const handleRemoveAdditionalHashtag = (index: number) => {
    setAdditionalHashtags(prev => prev.filter((_, i) => i !== index));
  };

  const getAllCampaignHashtags = (): string => {
    if (!selectedCampaign) return '';
    const allTags = [...(selectedCampaign.hashtags || []), ...additionalHashtags];
    return allTags.join(',');
  };

  const filteredCampaigns = availableCampaigns.filter(campaign => {
    const query = campaignSearchQuery.toLowerCase();
    return (
      campaign.campaignName.toLowerCase().includes(query) ||
      (campaign.description || '').toLowerCase().includes(query)
    );
  });

  React.useEffect(() => {
    if (open) {
      fetchActiveCampaigns();
    }
  }, [open]);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validVideoTypes = ['video/mp4', 'video/mov', 'video/quicktime'];
      if (!validVideoTypes.includes(file.type.toLowerCase())) {
        alert('Please select a valid video file (MP4 or MOV)');
        return;
      }

      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('Video file must be less than 500MB');
        return;
      }

      setSelectedVideo(file);
    }
  };

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(file.type.toLowerCase())) {
        alert('Please select a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Cover image must be less than 5MB');
        return;
      }

      setSelectedCover(file);
    }
  };

  const handlePublish = () => {
    // Merge user hashtags with campaign hashtags
    let allHashtags = hashtags || '';
    if (selectedCampaign) {
      const campaignHashtagStr = getAllCampaignHashtags();
      if (campaignHashtagStr) {
        allHashtags = allHashtags
          ? `${allHashtags},${campaignHashtagStr}`
          : campaignHashtagStr;
      }
    }

    const reelData = {
      title: reelTitle,
      description: reelDescription,
      hashtags: allHashtags,
      video: selectedVideo,
      coverImage: selectedCover || undefined,
      visibilityType: visibilityType,
      campaignId: selectedCampaign?.campaignId || undefined,
      brandId: selectedCampaign?.brandId || undefined,
    };

    onPublish?.(reelData);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setReelTitle('');
    setReelDescription('');
    setHashtags('#startup #growth #business');
    setSelectedVideo(null);
    setSelectedCover(null);
    setVisibilityType('1');
    // Reset campaign
    setSelectedCampaign(null);
    setShowCampaignDialog(false);
    setCampaignSearchQuery('');
    setAvailableCampaigns([]);
    setAdditionalHashtags([]);
    setNewHashtagInput('');
    setCampaignsError('');
  };

  const isValid = selectedVideo && reelTitle.trim().length > 0;

  // Get the currently selected privacy option for display
  const selectedPrivacy = privacyOptions.find(opt => opt.value === visibilityType) || privacyOptions[0];

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Create Reel</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Upload Video <span style={{ color: '#ef4444' }}>*</span>
            </Typography>
            <Paper
              sx={{
                border: '2px dashed',
                borderColor: selectedVideo ? 'success.main' : 'grey.300',
                borderRadius: 2,
                p: { xs: 3, sm: 4 },
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                bgcolor: selectedVideo ? 'success.50' : 'transparent',
                '&:hover': {
                  borderColor: selectedVideo ? 'success.dark' : 'grey.400',
                  bgcolor: selectedVideo ? 'success.100' : 'grey.50'
                }
              }}
              onClick={() => videoInputRef.current?.click()}
            >
              {selectedVideo ? (
                <Box>
                  <FilmIcon sx={{
                    fontSize: { xs: 40, sm: 48 },
                    color: '#4caf50',
                    mb: 1
                  }} />
                  <Typography fontWeight="medium" fontSize={{ xs: '0.9rem', sm: '1rem' }}>
                    {selectedVideo.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click to change video
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <FilmIcon sx={{
                    fontSize: { xs: 40, sm: 48 },
                    color: '#9e9e9e',
                    mb: 1
                  }} />
                  <Typography fontWeight="medium" fontSize={{ xs: '0.9rem', sm: '1rem' }}>
                    Tap to upload video
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    MP4, MOV up to 500MB
                  </Typography>
                </Box>
              )}
            </Paper>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/mov,video/quicktime"
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Title <span style={{ color: '#ef4444' }}>*</span>
            </Typography>
            <TextField
              placeholder="Give your reel a catchy title"
              fullWidth
              value={reelTitle}
              onChange={(e) => setReelTitle(e.target.value.slice(0, 150))}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
            <Typography
              variant="caption"
              color={reelTitle.length > 130 ? 'error' : 'text.secondary'}
              sx={{ mt: 0.5, display: 'block' }}
            >
              {reelTitle.length}/150 characters
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Description
            </Typography>
            <TextField
              placeholder="Tell viewers what your reel is about"
              multiline
              rows={3}
              fullWidth
              value={reelDescription}
              onChange={(e) => setReelDescription(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Cover Image (Optional)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={() => coverInputRef.current?.click()}
              sx={{ textTransform: 'none' }}
            >
              {selectedCover ? selectedCover.name : 'Add cover'}
            </Button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleCoverUpload}
              style={{ display: 'none' }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Hashtags
            </Typography>
            <TextField
              placeholder="#startup #growth #business"
              fullWidth
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              variant="outlined"
              size="small"
              helperText="Separate with spaces"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
          </Box>

          {/* Campaign Selection */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Link to Campaign (Optional)
            </Typography>

            {!selectedCampaign ? (
              <Button
                variant="outlined"
                startIcon={<CampaignIcon />}
                onClick={handleCampaignDialogOpen}
                sx={{
                  textTransform: 'none', borderColor: '#FF9800', color: '#FF9800',
                  '&:hover': { borderColor: '#F57C00', bgcolor: 'rgba(255, 152, 0, 0.04)' }
                }}
              >
                Select Campaign
              </Button>
            ) : (
              <Paper sx={{
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.08)' : '#FFF8E1',
                border: '2px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.4)' : '#FFB74D',
                borderRadius: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CampaignIcon sx={{ fontSize: 18, color: '#FF9800' }} />
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#FF9800' }}>
                      {selectedCampaign.campaignName}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={handleRemoveCampaign}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>

                {selectedCampaign.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    {selectedCampaign.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    Budget: {selectedCampaign.paymentCurrency} {selectedCampaign.totalBudget}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    KPI: {selectedCampaign.kpiType} ({selectedCampaign.kpiTarget})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ends: {selectedCampaign.endDate}
                  </Typography>
                </Box>

                {/* Campaign Hashtags (non-deletable) */}
                {selectedCampaign.hashtags?.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Campaign Hashtags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedCampaign.hashtags.map((tag, index) => (
                        <Chip key={`c-tag-${index}`} label={tag} size="small"
                          sx={{
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : '#FFE0B2',
                            color: theme.palette.mode === 'dark' ? '#FFB74D' : '#E65100',
                            fontWeight: 600, fontSize: '0.75rem'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Additional Hashtags (deletable) */}
                {additionalHashtags.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Your Additional Hashtags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {additionalHashtags.map((tag, index) => (
                        <Chip key={`a-tag-${index}`} label={tag} size="small"
                          onDelete={() => handleRemoveAdditionalHashtag(index)}
                          color="primary" variant="outlined" sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Add Hashtag Input */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField size="small" placeholder="Add hashtag..."
                    value={newHashtagInput}
                    onChange={(e) => setNewHashtagInput(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHashtag(); } }}
                    sx={{ flex: 1 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Typography color="text.secondary">#</Typography></InputAdornment>,
                    }}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddHashtag} disabled={!newHashtagInput.trim()}>
                    Add
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>

          {/* ==================== ✅ NEW: Visibility / Privacy Selector ==================== */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Who can see this reel?
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={visibilityType}
                onChange={(e) => setVisibilityType(e.target.value)}
                renderValue={() => (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {selectedPrivacy.icon}
                    <Typography variant="body2">{selectedPrivacy.label}</Typography>
                  </Stack>
                )}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.divider,
                  },
                }}
              >
                {privacyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {option.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={option.label}
                      secondary={option.description}
                      primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {/* ================================================================================ */}

          <Paper sx={{
            bgcolor: '#E3F2FD',
            p: 2,
            mt: 3,
            border: '1px solid',
            borderColor: '#90CAF9'
          }}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="primary.main"
              sx={{ mb: 1 }}
            >
              Tips for great reels:
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.813rem', sm: '0.875rem' },
                lineHeight: 1.6
              }}
            >
              • Keep it short (15-60 seconds)<br />
              • Start with a hook<br />
              • Add captions
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePublish}
            disabled={!isValid}
          >
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign Selection Dialog */}
      <Dialog open={showCampaignDialog} onClose={handleCampaignDialogClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CampaignIcon sx={{ color: '#FF9800' }} />
            Link to Campaign
          </Box>
          <IconButton onClick={handleCampaignDialogClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 0, pt: 2 }}>
          <Box sx={{ px: 3, mb: 2 }}>
            <TextField fullWidth placeholder="Search campaigns..." value={campaignSearchQuery}
              onChange={(e) => setCampaignSearchQuery(e.target.value)} size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
          </Box>

          {selectedCampaign && (
            <Box sx={{ px: 3, mb: 1 }}>
              <Chip icon={<CampaignIcon sx={{ fontSize: 16 }} />}
                label={`Selected: ${selectedCampaign.campaignName}`}
                onDelete={handleRemoveCampaign} color="warning" variant="outlined" sx={{ fontWeight: 600 }}
              />
            </Box>
          )}

          {loadingCampaigns ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : campaignsError ? (
            <Box sx={{ px: 3 }}>
              <Alert severity="error" onClose={() => setCampaignsError('')}>{campaignsError}</Alert>
            </Box>
          ) : filteredCampaigns.length === 0 ? (
            <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {campaignSearchQuery ? 'No campaigns found matching your search' : 'No active campaigns available'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredCampaigns.map(campaign => {
                const isSelected = selectedCampaign?.campaignId === campaign.campaignId;
                return (
                  <ListItem key={campaign.campaignId} disablePadding>
                    <ListItemButton onClick={() => handleSelectCampaign(campaign)} selected={isSelected}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : '#FFF3E0',
                          '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.25)' : '#FFE0B2' }
                        }
                      }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: isSelected ? '#FF9800' : 'grey.400', width: 40, height: 40 }}>
                          <CampaignIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>{campaign.campaignName}</Typography>
                            {isSelected && <CheckIcon sx={{ fontSize: 18, color: '#FF9800' }} />}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {campaign.description && (
                              <Typography variant="body2" color="text.secondary"
                                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                                {campaign.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip label={`${campaign.paymentCurrency} ${campaign.budgetPerCreator > 0 ? campaign.budgetPerCreator : campaign.totalBudget}`}
                                size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                              <Chip label={campaign.kpiType} size="small" sx={{ fontSize: '0.7rem', height: 20 }} variant="outlined" />
                              <Chip label={`Ends: ${campaign.endDate}`} size="small" sx={{ fontSize: '0.7rem', height: 20 }} variant="outlined" />
                            </Box>
                            {campaign.hashtags?.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {campaign.hashtags.map((tag, idx) => (
                                  <Typography key={idx} variant="caption" sx={{ color: '#FF9800', fontWeight: 500 }}>{tag}</Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCampaignDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleCampaignDialogClose}
            sx={{ bgcolor: '#FF9800', '&:hover': { bgcolor: '#F57C00' } }}>
            {selectedCampaign ? 'Done' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>


    </>




  );


};

export default CreateReelDialog;