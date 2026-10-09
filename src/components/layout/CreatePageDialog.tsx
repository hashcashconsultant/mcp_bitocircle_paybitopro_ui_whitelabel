'use client'
import React, { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import SnackbarAlert from '@/components/common/SnackbarAlert'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material'
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CameraAlt as CameraIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  Tag as TagIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material'

interface CreatePageDialogProps {
  open: boolean
  onClose: () => void
  onCreate?: (data: unknown) => void
}

interface PageData {
  type: 'business' | 'personal'
  name: string
  username: string
  email: string
  location: string
  website: string
  bio: string
  categories: string[]
  photo?: File | null
}

// API response interfaces
interface ContentType {
  id: number
  type: string
}

interface ApiResponse {
  error: {
    errorCode: number
    errorMessage: string
  }
  contentTypes: ContentType[]
  totalCount: number
}

interface ValidationResponse {
  success: boolean
  message: string
  data: null
  errorCode: null
  totalRecords: null
}

const CreatePageDialog: React.FC<CreatePageDialogProps> = ({ open, onClose, onCreate }) => {
  const theme = useTheme()
  
  const [formData, setFormData] = useState<PageData>({
    type: 'business',
    name: '',
    username: '',
    email: '',
    location: '',
    website: '',
    bio: '',
    categories: []
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [availableCategories, setAvailableCategories] = useState<ContentType[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success')
  // Validation state
  const [isValidatingUsername, setIsValidatingUsername] = useState(false)
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [usernameValid, setUsernameValid] = useState(false)
  const [emailValid, setEmailValid] = useState(false)

  // Debounce timers
  const usernameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const emailTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch categories from API when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    setCategoriesError(null)
    
    try {
      const response = await  fetchWithAuth('https://institutional-bo.paybito.com:8443/teamupservice/api/creators/getContentTypes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

      if (data.error.errorCode === 0 && data.contentTypes) {
        setAvailableCategories(data.contentTypes)
      } else {
        throw new Error(data.error.errorMessage || 'Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategoriesError(error instanceof Error ? error.message : 'Failed to load categories. Please try again.')
      
      // Fallback to some default categories if API fails
      setAvailableCategories([
        { id: 1, type: 'Financial Tips' },
        { id: 2, type: 'Personal Finance' },
        { id: 3, type: 'Cryptocurrency' },
        { id: 4, type: 'Investment Tips' },
        { id: 5, type: 'Web3 Topics' }
      ])
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // Validate username
  const validateUsername = async (username: string) => {
    if (!username || username.trim() === '') {
      setUsernameError(null)
      setUsernameValid(false)
      return
    }

    setIsValidatingUsername(true)
    setUsernameError(null)
    setUsernameValid(false)

    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/users/validateBitocircleUserInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          username: `@${username.replace('@', '')}`
        })
      })

      const data: ValidationResponse = await response.json()

      if (data.success) {
        setUsernameValid(true)
        setUsernameError(null)
      } else {
        setUsernameValid(false)
        setUsernameError(data.message || 'Username is not available')
      }
    } catch (error) {
      console.error('Error validating username:', error)
      setUsernameError('Failed to validate username. Please try again.')
      setUsernameValid(false)
    } finally {
      setIsValidatingUsername(false)
    }
  }

  // Validate email
  const validateEmail = async (email: string) => {
    if (!email || email.trim() === '') {
      setEmailError(null)
      setEmailValid(false)
      return
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      setEmailValid(false)
      return
    }

    setIsValidatingEmail(true)
    setEmailError(null)
    setEmailValid(false)

    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/users/validateBitocircleUserInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          username: ''
        })
      })

      const data: ValidationResponse = await response.json()

      if (data.success) {
        setEmailValid(true)
        setEmailError(null)
      } else {
        setEmailValid(false)
        setEmailError(data.message || 'Email is already in use')
      }
    } catch (error) {
      console.error('Error validating email:', error)
      setEmailError('Failed to validate email. Please try again.')
      setEmailValid(false)
    } finally {
      setIsValidatingEmail(false)
    }
  }

  const handlePageTypeSelect = (type: 'business' | 'personal') => {
    setFormData({ ...formData, type })
  }

  const handleInputChange = (field: keyof PageData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFormData({ ...formData, [field]: value })

    // Debounced validation for username
    if (field === 'username') {
      if (usernameTimerRef.current) {
        clearTimeout(usernameTimerRef.current)
      }
      setUsernameValid(false)
      setUsernameError(null)
      
      if (value.trim() !== '') {
        usernameTimerRef.current = setTimeout(() => {
          validateUsername(value)
        }, 800)
      }
    }

    // Debounced validation for email
    if (field === 'email') {
      if (emailTimerRef.current) {
        clearTimeout(emailTimerRef.current)
      }
      setEmailValid(false)
      setEmailError(null)
      
      if (value.trim() !== '') {
        emailTimerRef.current = setTimeout(() => {
          validateEmail(value)
        }, 800)
      }
    }
  }

  const handleCategoriesChange = (event: unknown, newValue: string[]) => {
    if (newValue.length <= 5) {
      setFormData({ ...formData, categories: newValue })
    }
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData({ ...formData, photo: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreate = async () => {
    // Final validation check
    if (!usernameValid || !emailValid) {
      setSnackbarMsg('Please ensure username and email are valid')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const adminUser = localStorage.getItem('uuid')
      const userId = localStorage.getItem('userId') || '0'
      const childUserId = localStorage.getItem('childUserId') || '0';

      if (!adminUser) {
        throw new Error('User session not found. Please log in again.')
      }

      let selectedCategoryIds: (number | null)[] = []
      let categoryIdsString = ''
      if (formData.type === 'business') {
        selectedCategoryIds = formData.categories.map(categoryName => {
          const category = availableCategories.find(cat => cat.type === categoryName)
          return category ? category.id : null
        }).filter(id => id !== null)
        categoryIdsString = selectedCategoryIds.join(',')
      } else {
        categoryIdsString = ''
      }

      const data = new FormData()
      data.append('userId', childUserId)
      data.append('pageName', formData.name)
      data.append('pageHandle', `@${formData.username.replace('@', '')}`)
      data.append('description', formData.bio)
      data.append('categoryIds', categoryIdsString)
      data.append('adminUser', adminUser)
      data.append('pageType', formData.type === 'business' ? 'BUSINESS PAGE' : 'PERSONAL PAGE')
      data.append('email', formData.email)
      data.append('location', formData.location)
      data.append('website', formData.website)
      if (formData.photo) {
        data.append('profilePic', formData.photo)
      }

      const response = await  fetch('https://institutional-bo.paybito.com:8443/BitohubService/profile/createPage', {
        method: 'POST',
        body: data
      })

      const result = await response.json()

      if (result.success) {
        if (onCreate) {
          onCreate(result.data)
        }
        handleClose()
        setSnackbarMsg('Page created successfully!')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        setSnackbarMsg(result.message || 'Failed to create page. Please try again.')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
        throw new Error(result.message || 'Failed to create page. Please try again.')
      }
    } catch (error) {
      console.error('Error creating page:', error)
      setSubmitError(error instanceof Error ? error.message : 'An error occurred while creating the page.')
      setSnackbarMsg(error instanceof Error ? error.message : 'An error occurred while creating the page.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Clear timers
    if (usernameTimerRef.current) {
      clearTimeout(usernameTimerRef.current)
    }
    if (emailTimerRef.current) {
      clearTimeout(emailTimerRef.current)
    }

    setFormData({
      type: 'business',
      name: '',
      username: '',
      email: '',
      location: '',
      website: '',
      bio: '',
      categories: []
    })
    setPhotoPreview(null)
    setCategoriesError(null)
    setSubmitError(null)
    setUsernameError(null)
    setEmailError(null)
    setUsernameValid(false)
    setEmailValid(false)
    onClose()
  }

  const handleRetryCategories = () => {
    fetchCategories()
  }

  const isFormValid =
    formData.name &&
    formData.username &&
    usernameValid &&
    formData.email &&
    emailValid &&
    !isValidatingUsername &&
    !isValidatingEmail &&
    (formData.type === 'business' ? formData.categories.length > 0 : true)

  // Define colors based on page type
  const businessColor = theme.palette.primary.main
  const personalColor = theme.palette.mode === 'light' ? '#f97316' : '#fb923c'

  return (
    <Dialog 
      open={open} 
      onClose={!isSubmitting ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
          bgcolor: theme.palette.background.paper
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 2
      }}>
        <Typography variant="h6" fontWeight={600}>
          Create New Page
        </Typography>
        <IconButton onClick={handleClose} size="small" disabled={isSubmitting}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, overflowY: 'auto' }}>
        {categoriesError && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRetryCategories}>
                Retry
              </Button>
            }
          >
            {categoriesError}
          </Alert>
        )}

        <SnackbarAlert
          open={snackbarOpen}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMsg}
          severity={snackbarSeverity}
        />
        
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* Page Type Selection Cards */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose Page Type
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Card 
              sx={{ 
                flex: 1, 
                cursor: 'pointer',
                border: '2px solid',
                borderColor: formData.type === 'business' ? businessColor : 'transparent',
                backgroundColor: formData.type === 'business' 
                  ? theme.palette.mode === 'light' ? '#f0f8ff' : 'rgba(30, 64, 175, 0.1)'
                  : theme.palette.background.paper,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: businessColor,
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
              onClick={() => handlePageTypeSelect('business')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <BusinessIcon sx={{ fontSize: 40, color: businessColor, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Business
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  For companies, brands, organizations, and professional services
                </Typography>
              </CardContent>
            </Card>

            <Card 
              sx={{ 
                flex: 1, 
                cursor: 'pointer',
                border: '2px solid',
                borderColor: formData.type === 'personal' ? personalColor : 'transparent',
                backgroundColor: formData.type === 'personal' 
                  ? theme.palette.mode === 'light' ? '#fff7ed' : 'rgba(251, 146, 60, 0.1)'
                  : theme.palette.background.paper,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: personalColor,
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
              onClick={() => handlePageTypeSelect('personal')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <PersonIcon sx={{ fontSize: 40, color: personalColor, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Personal
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  For personal blogs, portfolios, and personal content creators
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Profile Picture Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <Avatar
            sx={{ 
              width: 64, 
              height: 64,
              bgcolor: formData.type === 'business' ? businessColor : personalColor
            }}
            src={photoPreview || undefined}
          >
            {!photoPreview && (formData.name ? formData.name[0].toUpperCase() : 'A')}
          </Avatar>
          <Button
            variant="contained"
            size="small"
            startIcon={<CameraIcon />}
            component="label"
            disabled={isSubmitting}
            sx={{
              textTransform: 'none',
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            Change Photo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </Button>
        </Box>

        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Name"
            placeholder={formData.type === 'business' ? 'Enter business name' : 'Enter your name'}
            value={formData.name}
            onChange={handleInputChange('name')}
            required
            size="medium"
            variant="outlined"
            disabled={isSubmitting}
          />

          <TextField
            fullWidth
            label="Username"
            placeholder="username"
            value={formData.username}
            onChange={handleInputChange('username')}
            required
            size="medium"
            variant="outlined"
            disabled={isSubmitting}
            error={!!usernameError}
            helperText={usernameError || (usernameValid ? 'Username is available' : '')}
            InputProps={{
              startAdornment: <InputAdornment position="start">@</InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  {isValidatingUsername && <CircularProgress size={20} />}
                  {!isValidatingUsername && usernameValid && (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  )}
                  {!isValidatingUsername && usernameError && (
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                  )}
                </InputAdornment>
              )
            }}
            FormHelperTextProps={{
              sx: {
                color: usernameValid ? 'success.main' : 'error.main'
              }
            }}
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
            size="medium"
            variant="outlined"
            disabled={isSubmitting}
            error={!!emailError}
            helperText={emailError || (emailValid ? 'Email is available' : '')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {isValidatingEmail && <CircularProgress size={20} />}
                  {!isValidatingEmail && emailValid && (
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  )}
                  {!isValidatingEmail && emailError && (
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                  )}
                </InputAdornment>
              )
            }}
            FormHelperTextProps={{
              sx: {
                color: emailValid ? 'success.main' : 'error.main'
              }
            }}
          />

          {/* Categories Multi-Select (only for business) */}
          {formData.type === 'business' && (
            <Autocomplete
              multiple
              id="categories-select"
              options={availableCategories.map(cat => cat.type)}
              value={formData.categories}
              onChange={handleCategoriesChange}
              disableCloseOnSelect
              loading={isLoadingCategories}
              disabled={isLoadingCategories || isSubmitting}
              getOptionLabel={(option) => option}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <input
                    type="checkbox"
                    checked={selected}
                    style={{ marginRight: 8 }}
                  />
                  {option}
                </li>
              )}
              renderTags={(value: string[], getTagProps) =>
                value.map((option: string, index: number) => {
                  const { key, ...otherProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key || index}
                      variant="outlined"
                      label={option}
                      {...otherProps}
                      size="small"
                      sx={{
                        bgcolor: theme.palette.mode === 'light' 
                          ? 'rgba(30, 64, 175, 0.08)' 
                          : 'rgba(30, 64, 175, 0.2)',
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.text.primary
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categories"
                  placeholder={formData.categories.length === 0 ? "Select up to 5 categories" : ""}
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <CategoryIcon sx={{ color: 'action.active', fontSize: 20 }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {isLoadingCategories ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText={`${formData.categories.length}/5 categories selected`}
                />
              )}
              sx={{ width: '100%' }}
            />
           )}

          <TextField
            fullWidth
            label="Location"
            placeholder="San Francisco, CA"
            value={formData.location}
            onChange={handleInputChange('location')}
            size="medium"
            variant="outlined"
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationIcon sx={{ color: 'action.active', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Website"
            placeholder="yourwebsite.com"
            value={formData.website}
            onChange={handleInputChange('website')}
            size="medium"
            variant="outlined"
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WebsiteIcon sx={{ color: 'action.active', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Bio"
            placeholder={formData.type === 'business' ? 'Tell us about your business...' : 'Tell us about yourself...'}
            value={formData.bio}
            onChange={handleInputChange('bio')}
            multiline
            rows={3}
            size="medium"
            variant="outlined"
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                  <TagIcon sx={{ color: 'action.active', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: `1px solid ${theme.palette.divider}`,
        px: 3,
        py: 2
      }}>
        <Button 
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{ 
            textTransform: 'none',
            color: theme.palette.text.secondary,
            fontWeight: 500
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCreate}
          variant="contained"
          disabled={!isFormValid || isSubmitting}
          sx={{ 
            textTransform: 'none',
            bgcolor: theme.palette.primary.main,
            fontWeight: 600,
            px: 3,
            '&:hover': { bgcolor: theme.palette.primary.dark },
            '&:disabled': {
              bgcolor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
              Creating...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreatePageDialog