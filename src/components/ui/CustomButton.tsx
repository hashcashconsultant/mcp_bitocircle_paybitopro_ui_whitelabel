import React from 'react'
import { Button, ButtonProps, CircularProgress } from '@mui/material'
import { styled } from '@mui/material/styles'

interface CustomButtonProps extends ButtonProps {
  loading?: boolean
  loadingPosition?: 'start' | 'end' | 'center'
}

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadows[4],
  },
  '&.MuiButton-containedPrimary': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
    '&:hover': {
      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
    },
  },
}))

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  loading = false,
  loadingPosition = 'center',
  disabled,
  startIcon,
  endIcon,
  ...props
}) => {
  const LoadingComponent = (
    <CircularProgress
      size={16}
      color="inherit"
      sx={{ 
        mr: loadingPosition === 'start' ? 1 : 0,
        ml: loadingPosition === 'end' ? 1 : 0 
      }}
    />
  )

  return (
    <StyledButton
      {...props}
      disabled={disabled || loading}
      startIcon={loading && loadingPosition === 'start' ? LoadingComponent : startIcon}
      endIcon={loading && loadingPosition === 'end' ? LoadingComponent : endIcon}
    >
      {loading && loadingPosition === 'center' ? LoadingComponent : children}
    </StyledButton>
  )
}

export default CustomButton