'use client'
import React, { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Box,
  Fade,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'

export interface ReportDialogProps {
  open: boolean
  onClose: () => void
  contentType?: 'post' | 'photo' | 'video' | 'profile' | 'comment' | 'message'
  contentId?: string | number
  onSubmit?: (success: boolean, message: string) => void
}

interface ReportSubcategory {
  subCategoryId: number
  subCategoryName: string
  description: string | null
  categoryId: number
  createdAt: string
}

interface ReportCategory {
  categoryId: number
  categoryName: string
  description: string | null
  severityLevel: string
  isActive: boolean
  createdAt: string
  subcategories: ReportSubcategory[]
}

interface CategoriesResponse {
  success: boolean
  message: string
  data: ReportCategory[]
  errorCode: string | null
}

interface ReportSubmitResponse {
  success: boolean
  message: string
  data: number
  errorCode: string | null
}

// Payload for reporting posts
interface ReportPostPayload {
  reporterUserId: number
  reportedPostId: number
  categoryId: number
  subCategoryId?: number
  reason: string
}

// Payload for reporting accounts/profiles
interface ReportAccountPayload {
  reporterUserId: number
  reportedUserId: number
  categoryId: number
  subCategoryId?: number
  reason: string
  additionalInfo?: string
}

type DialogStep = 'category' | 'subcategory' | 'submitting' | 'success' | 'error'

const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onClose,
  contentType = 'post',
  contentId,
  onSubmit
}) => {
  const [currentStep, setCurrentStep] = useState<DialogStep>('category')
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<ReportSubcategory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<ReportCategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open && categories.length === 0) {
      fetchCategories()
    }
  }, [open])

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    setCategoriesError(null)

    try {
      const response = await  fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/reports/getCategoriesReport',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: CategoriesResponse = await response.json()

      if (result.success && result.data) {
        setCategories(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch report categories')
      }
    } catch (error) {
      console.error('Error fetching report categories:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setCategoriesError('Network error. Please check your connection.')
      } else if (error instanceof Error) {
        setCategoriesError(error.message)
      } else {
        setCategoriesError('Failed to load report categories. Please try again.')
      }
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleClose = () => {
    // Reset state when closing
    setTimeout(() => {
      setCurrentStep('category')
      setSelectedCategory(null)
      setSelectedSubcategory(null)
      setIsSubmitting(false)
      setSubmitError(null)
    }, 200)
    onClose()
  }

  const handleCategorySelect = (category: ReportCategory) => {
    setSelectedCategory(category)
    if (category.subcategories && category.subcategories.length > 0) {
      setCurrentStep('subcategory')
    } else {
      // No subcategories, submit directly
      handleSubmitReport(category.categoryId, null, category.categoryName)
    }
  }

  const handleSubcategorySelect = (subcategory: ReportSubcategory) => {
    setSelectedSubcategory(subcategory)
    handleSubmitReport(
      selectedCategory!.categoryId,
      subcategory.subCategoryId,
      `${selectedCategory?.categoryName} - ${subcategory.subCategoryName}`
    )
  }

  const handleSubmitReport = async (categoryId: number, subCategoryId: number | null, reason: string) => {
    setIsSubmitting(true)
    setCurrentStep('submitting')
    setSubmitError(null)

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        throw new Error('Please login to submit a report')
      }

      if (!contentId) {
        throw new Error('Content ID is missing')
      }

      // Determine if reporting a profile/account or a post
      const isProfileReport = contentType === 'profile'

      // Choose the appropriate endpoint
      const endpoint = isProfileReport
        ? 'https://institutional-bo.paybito.com:8443/BitohubService/reports/reportAccount'
        : 'https://institutional-bo.paybito.com:8443/BitohubService/reports/reportPost'

      // Build the appropriate payload
      let payload: ReportPostPayload | ReportAccountPayload

      if (isProfileReport) {
        // Account/Profile report payload
        const accountPayload: ReportAccountPayload = {
          reporterUserId: parseInt(userId),
          reportedUserId: typeof contentId === 'string' ? parseInt(contentId) : contentId,
          categoryId: categoryId,
          reason: reason
        }

        // Only add subCategoryId if it exists
        if (subCategoryId !== null) {
          accountPayload.subCategoryId = subCategoryId
        }

        payload = accountPayload
      } else {
        // Post report payload
        const postPayload: ReportPostPayload = {
          reporterUserId: parseInt(userId),
          reportedPostId: typeof contentId === 'string' ? parseInt(contentId) : contentId,
          categoryId: categoryId,
          reason: reason
        }

        // Only add subCategoryId if it exists
        if (subCategoryId !== null) {
          postPayload.subCategoryId = subCategoryId
        }

        payload = postPayload
      }

      const response = await  fetchWithAuth(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ReportSubmitResponse = await response.json()

      if (result.success) {
        setCurrentStep('success')
        
        if (onSubmit) {
          onSubmit(true, result.message)
        }

        // Auto close after showing success
        setTimeout(() => {
          handleClose()
          window.location.reload()
        }, 2500)
      } else {
        throw new Error(result.message || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      
      let errorMessage = 'Failed to submit report. Please try again.'
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Network error. Please check your connection.'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setSubmitError(errorMessage)
      setCurrentStep('error')
      
      if (onSubmit) {
        onSubmit(false, errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (currentStep === 'subcategory') {
      setCurrentStep('category')
      setSelectedSubcategory(null)
    } else if (currentStep === 'error') {
      setCurrentStep('category')
      setSubmitError(null)
    }
  }

  const handleRetry = () => {
    if (categoriesError) {
      fetchCategories()
    } else if (submitError && selectedCategory) {
      if (selectedSubcategory) {
        handleSubcategorySelect(selectedSubcategory)
      } else {
        handleSubmitReport(
          selectedCategory.categoryId,
          null,
          selectedCategory.categoryName
        )
      }
    }
  }

  const getTitle = () => {
    if (currentStep === 'success') return ''
    if (currentStep === 'submitting') return ''
    if (currentStep === 'error') return 'Report'
    if (currentStep === 'subcategory') return selectedCategory?.categoryName || 'Report'
    
    switch (contentType) {
      case 'photo': return 'Why are you reporting this photo?'
      case 'video': return 'Why are you reporting this video?'
      case 'profile': return 'Why are you reporting this profile?'
      case 'comment': return 'Why are you reporting this comment?'
      case 'message': return 'Why are you reporting this message?'
      default: return 'Why are you reporting this post?'
    }
  }

  const getSuccessMessage = () => {
    switch (contentType) {
      case 'photo': return 'Thanks for reporting this photo'
      case 'video': return 'Thanks for reporting this video'
      case 'profile': return 'Thanks for reporting this profile'
      case 'comment': return 'Thanks for reporting this comment'
      case 'message': return 'Thanks for reporting this message'
      default: return 'Thanks for reporting this post'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      {/* Header */}
      {currentStep !== 'success' && currentStep !== 'submitting' && (
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(currentStep === 'subcategory' || currentStep === 'error') && (
              <IconButton 
                onClick={handleBack}
                size="small"
                sx={{ ml: -1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Report
            </Typography>
          </Box>
          <IconButton 
            onClick={handleClose}
            size="small"
            sx={{ mr: -1 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent sx={{ p: 0 }}>
        {/* Loading Categories */}
        {isLoadingCategories && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: 6
          }}>
            <CircularProgress />
          </Box>
        )}

        {/* Categories Error */}
        {categoriesError && (
          <Box sx={{ p: 3 }}>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => fetchCategories()}
                  sx={{ textTransform: 'none' }}
                >
                  Retry
                </Button>
              }
            >
              {categoriesError}
            </Alert>
          </Box>
        )}

        {/* Category Selection */}
        {currentStep === 'category' && !isLoadingCategories && !categoriesError && (
          <Fade in>
            <Box>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {getTitle()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If someone is in immediate danger, get help before reporting to BitoCircle. Do not wait.
                </Typography>
              </Box>
              <List sx={{ pt: 0 }}>
                {categories.map((category) => (
                  <ListItemButton
                    key={category.categoryId}
                    onClick={() => handleCategorySelect(category)}
                    sx={{
                      py: 2,
                      px: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText
                      primary={category.categoryName}
                      secondary={category.description}
                      primaryTypographyProps={{
                        fontSize: '0.95rem'
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.85rem'
                      }}
                    />
                    <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Fade>
        )}

        {/* Subcategory Selection */}
        {currentStep === 'subcategory' && selectedCategory && (
          <Fade in>
            <Box>
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Please select a problem to continue
                </Typography>
              </Box>
              <List sx={{ pt: 0 }}>
                {selectedCategory.subcategories?.map((subcategory) => (
                  <ListItemButton
                    key={subcategory.subCategoryId}
                    onClick={() => handleSubcategorySelect(subcategory)}
                    sx={{
                      py: 2,
                      px: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText
                      primary={subcategory.subCategoryName}
                      secondary={subcategory.description}
                      primaryTypographyProps={{
                        fontSize: '0.95rem'
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.85rem'
                      }}
                    />
                    <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Fade>
        )}

        {/* Submitting State */}
        {currentStep === 'submitting' && (
          <Fade in>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              px: 3
            }}>
              <CircularProgress size={48} sx={{ mb: 3 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Submitting your report
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Please wait while we process your report...
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Error State */}
        {currentStep === 'error' && (
          <Fade in>
            <Box sx={{ p: 3 }}>
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
              >
                {submitError}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBack}
                  sx={{
                    textTransform: 'none',
                    py: 1.5
                  }}
                >
                  Go Back
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleRetry}
                  sx={{
                    textTransform: 'none',
                    py: 1.5
                  }}
                >
                  Try Again
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Success State */}
        {currentStep === 'success' && (
          <Fade in>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              px: 3
            }}>
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'success.main',
                  mb: 2
                }} 
              />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                {getSuccessMessage()}
              </Typography>
              
              <Box sx={{ width: '100%', maxWidth: 400 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box component="span" sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mr: 1
                    }} />
                    Report received
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    Your report helps us to improve our processes and keeps BitoHub safe for everyone.
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box component="span" sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mr: 1
                    }} />
                    Awaiting review
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    We use technology and review teams to remove anything that does not follow our standards as quickly as possible.
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box component="span" sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%',
                      bgcolor: 'grey.400',
                      mr: 1
                    }} />
                    Decision made
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    We will send you a notification to view the outcome in your Support Inbox as soon as possible.
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleClose}
                  sx={{
                    textTransform: 'none',
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  Done
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ReportDialog