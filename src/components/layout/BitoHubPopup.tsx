'use client'
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  Box,
  Typography,
  Button,
  Card,
  Fade,
  Chip
} from '@mui/material'
import {
  Shield as ShieldIcon,
  Groups as GroupsIcon,
  Verified as VerifiedIcon,
  Lock as LockIcon,
  Timer as TimerIcon,
  PostAdd as PostAddIcon,
  Person as PersonIcon
} from '@mui/icons-material'

interface BitoHubPopupProps {
  onClaim?: () => void
  onDismiss?: () => void
  rewardAmount?: number
  hasMadeFirstPost?: number
  profileStatus?: number
}

const BitoHubPopup: React.FC<BitoHubPopupProps> = ({ 
  onClaim, 
  onDismiss,
  rewardAmount = 5,
  hasMadeFirstPost = 0,
  profileStatus = 1
}) => {
  const [open, setOpen] = useState(true)
  const [timeLeft, setTimeLeft] = useState({ hours: 48, minutes: 0 })
  const [spotsLeft] = useState(276)

  useEffect(() => {
    const openTimer = setTimeout(() => {
      setOpen(true)
    }, 1000)

    const handleFirstClick = () => {
      setTimeout(() => {
        setOpen(true)
      }, 1000)
      document.removeEventListener('click', handleFirstClick)
    }

    document.addEventListener('click', handleFirstClick)

    return () => {
      clearTimeout(openTimer)
      document.removeEventListener('click', handleFirstClick)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59 }
        }
        return prev
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleClaim = () => {
    if (onClaim) {
      onClaim()
    }
    setOpen(false)
  }

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss()
    }
    setOpen(false)
  }

  const features = [
    {
      icon: <ShieldIcon sx={{ fontSize: 24 }} />,
      title: 'Web3 Identity',
      description: 'Secure blockchain-verified profile',
      color: '#7c3aed'
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 24 }} />,
      title: 'Elite Network',
      description: 'Connect with top builders & VCs',
      color: '#ec4899'
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 24 }} />,
      title: 'Verified Badge',
      description: 'Stand out with early adopter status',
      color: '#06b6d4'
    },
    {
      icon: <LockIcon sx={{ fontSize: 24 }} />,
      title: 'Exclusive Access',
      description: 'Early access to IDOs & airdrops',
      color: '#10b981'
    }
  ]

  // Define all possible reward conditions
  const allRewardConditions = [
    {
      icon: <PostAddIcon sx={{ fontSize: 28 }} />,
      title: 'Make Your First Post',
      description: 'Share your first content with the community',
      color: '#8b5cf6',
      show: hasMadeFirstPost === 0 // Only show if user hasn't made first post
    },
    {
      icon: <PersonIcon sx={{ fontSize: 28 }} />,
      title: 'Complete Your Profile',
      description: 'Fill in your personal profile details',
      color: '#f59e0b',
      show: profileStatus !== 2 // Only show if profile is not completed (status !== 2)
    }
  ]

  // Filter conditions based on show flag
  const rewardConditions = allRewardConditions.filter(condition => condition.show)

  // Calculate remaining steps
  const remainingSteps = rewardConditions.length
  const stepsText = remainingSteps === 1 ? 'Step' : 'Steps'
  const completionText = remainingSteps === 1 
    ? `Complete this step to unlock your $${rewardAmount} reward!`
    : `Complete both steps to unlock your $${rewardAmount} reward!`

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return
        }
        handleDismiss()
      }}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={500}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'rgba(255, 255, 255, 1)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          backdropFilter: 'blur(2px)'
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        p: 3,
        textAlign: 'center'
      }}>
        <Box sx={{
          width: 120,
          height: 120,
          bgcolor: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            BitoCircle
          </Typography>
        </Box>

        <Typography variant="caption" sx={{
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: 2,
          fontWeight: 600
        }}>
          Welcome to the Future of Web3
        </Typography>
      </Box>

      {/* Scrollable Content Area */}
      <Box sx={{
        overflowY: 'auto',
        p: 3,
        flexGrow: 1
      }}>
        <Typography variant="h4" sx={{
          fontWeight: 700,
          textAlign: 'center',
          mb: 3
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Claim Your BitoCircle Profile</span>
        </Typography>

        <Card sx={{
          background: 'linear-gradient(135deg, #FFA500 0%, #FF6347 100%)',
          p: 3,
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 10px 30px rgba(255, 165, 0, 0.3)'
        }}>
          <Typography variant="h3" sx={{
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            ${rewardAmount}
          </Typography>
          <Typography variant="subtitle1" sx={{
            color: 'white',
            textAlign: 'center',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Instant Reward
          </Typography>
        </Card>

        {/* Reward Conditions Section */}
        <Card sx={{
          bgcolor: '#f8fafc',
          border: '2px dashed #667eea',
          p: 2.5,
          mb: 3,
          borderRadius: 3
        }}>
          <Typography variant="subtitle1" sx={{
            fontWeight: 700,
            textAlign: 'center',
            mb: 2,
            color: '#1f2937'
          }}>
            🎯 Complete {remainingSteps === 1 ? 'This' : 'These'} {remainingSteps} {stepsText} to Earn ${rewardAmount}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rewardConditions.map((condition, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  bgcolor: `${condition.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: condition.color,
                  flexShrink: 0
                }}>
                  {condition.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: condition.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700
                    }}>
                      {index + 1}
                    </Typography>
                    <Typography variant="subtitle2" sx={{
                      fontWeight: 700,
                      color: '#1f2937'
                    }}>
                      {condition.title}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{
                    color: 'text.secondary',
                    ml: 4
                  }}>
                    {condition.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Typography variant="caption" sx={{
            display: 'block',
            textAlign: 'center',
            mt: 2,
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            {completionText}
          </Typography>
        </Card>

        <Typography variant="body2" sx={{
          textAlign: 'center',
          color: 'text.secondary',
          mb: 3
        }}>
          Join 50,000+ crypto entrepreneurs, developers, and investors building the decentralized future. Your unique profile is waiting!
        </Typography>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 2,
          mb: 3
        }}>
          {features.map((feature, index) => (
            <Box key={index} sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5
            }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: `${feature.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: feature.color,
                flexShrink: 0
              }}>
                {feature.icon}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 600,
                  color: '#1f2937'
                }}>
                  {feature.title}
                </Typography>
                <Typography variant="caption" sx={{
                  color: 'text.secondary',
                  lineHeight: 1.3
                }}>
                  {feature.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleClaim}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 2,
            borderRadius: 2,
            fontSize: 16,
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 30px rgba(102, 126, 234, 0.5)'
            }
          }}
        >
          GET STARTED & EARN ${rewardAmount} →
        </Button>

        <Button
          fullWidth
          onClick={handleDismiss}
          sx={{
            mt: 2,
            color: 'text.secondary',
            textTransform: 'none',
            fontSize: 14,
            '&:hover': {
              bgcolor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          I&apos;ll miss out on ${rewardAmount}
        </Button>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          mt: 2,
          mb: 2
        }}>
          <Chip
            icon={<TimerIcon sx={{ fontSize: 16 }} />}
            label={`Limited Time: Offer expires in ${timeLeft.hours} hours`}
            size="small"
            sx={{
              bgcolor: '#fee2e2',
              color: '#dc2626',
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: '#dc2626'
              }
            }}
          />
          {/* <Chip
            label={`${spotsLeft} spots left`}
            size="small"
            sx={{
              bgcolor: '#fef3c7',
              color: '#d97706',
              fontWeight: 600
            }}
          /> */}
        </Box>
      </Box>
    </Dialog>
  )
}

export default BitoHubPopup