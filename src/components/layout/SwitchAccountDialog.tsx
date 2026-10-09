'use client'
import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Avatar
} from '@mui/material'
import {
  SwapHoriz as SwitchIcon
} from '@mui/icons-material'

interface SwitchAccountDialogProps {
  open: boolean
  onClose: () => void
  onSwitch: () => void
  pageName: string
  pageAvatar?: string
  pageAvatarBgColor?: string
  pageCategory?: string
  profilePicture?: string | null
}

const SwitchAccountDialog: React.FC<SwitchAccountDialogProps> = ({
  open,
  onClose,
  onSwitch,
  pageName,
  pageAvatar,
  pageAvatarBgColor,
  pageCategory,
  profilePicture
}) => {

  const handleSwitch = () => {
    onSwitch()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: 400
        }
      }}
    >
      <DialogTitle sx={{
        textAlign: 'center',
        pt: 3,
        pb: 1
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profilePicture || undefined}
              sx={{
                bgcolor: pageAvatarBgColor || '#1877f2',
                width: 64,
                height: 64,
                fontSize: 20,
                fontWeight: 600
              }}
            >
              {!profilePicture && pageAvatar}
            </Avatar>
            <Box sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              bgcolor: 'white',
              borderRadius: '50%',
              p: 0.5,
              boxShadow: 1
            }}>
              <SwitchIcon sx={{ fontSize: 20, color: '#65676b' }} />
            </Box>
          </Box>
          <Typography variant="h6" fontWeight={600}>
            Switch Account
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="body1" color="text.primary">
          Would you like to switch to <strong>{pageName}</strong> page to take more action?
        </Typography>
        {pageCategory && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {pageCategory}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        pb: 3,
        pt: 1,
        gap: 1,
        justifyContent: 'center'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 100,
            borderColor: '#dadde1',
            color: '#050505',
            bgcolor: '#f2f3f5',

            '&:hover': {
              borderColor: '#8a8d91',
              bgcolor: '#f2f3f5'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSwitch}
          variant="contained"
          sx={{
            textTransform: 'none',
            bgcolor: '#1877f2',
            fontWeight: 600,
            minWidth: 100,
            '&:hover': {
              bgcolor: '#166fe5'
            }
          }}
        >
          Switch
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SwitchAccountDialog