// components/posts/TaggedProductsSection.tsx
'use client'
import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  ShoppingBag as ShoppingBagIcon,
  LocalOffer as PriceTagIcon,
  Store as StoreIcon
} from '@mui/icons-material'

export interface TaggedProduct {
  productId: number
  productName: string
  productType: string
  productDescription: string
  productImageUrl: string
  productPrice: number
  shopOwnerId: number
  shopOwnerName: string
}

interface TaggedProductsSectionProps {
  products: TaggedProduct[]
  currentUserId?: string | number
}

const TaggedProductsSection: React.FC<TaggedProductsSectionProps> = ({
  products,
  currentUserId
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isDark = theme.palette.mode === 'dark'

  if (!products || products.length === 0) return null

  const handleProductClick = (e: React.MouseEvent, product: TaggedProduct) => {
    e.stopPropagation()
    const userId = currentUserId || localStorage.getItem('childUserId') || localStorage.getItem('userId') || ''
    const url = `https://www.bitocircle.com/merchandise/product/?productId=${product.productId}&shopCreatorId=${product.shopOwnerId}&userId=${userId}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  return (
    <Box sx={{ mb: 2 }}>
      {/* Section Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 1.5
        }}
      >
        <ShoppingBagIcon
          sx={{
            fontSize: 18,
            color: 'primary.main'
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            color: 'text.primary'
          }}
        >
          Tagged Products
        </Typography>
        <Chip
          label={products.length}
          size="small"
          sx={{
            height: 18,
            fontSize: '0.65rem',
            fontWeight: 600,
            bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
            color: 'primary.main'
          }}
        />
      </Box>

      {/* Products Grid/List */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          overflowX: 'auto',
          pb: 1,
          mx: -0.5,
          px: 0.5,
          // Hide scrollbar but allow scrolling
          '&::-webkit-scrollbar': {
            height: 4
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: 2
          }
        }}
      >
        {products.map((product) => (
          <Card
            key={product.productId}
            onClick={(e) => handleProductClick(e, product)}
            sx={{
              minWidth: { xs: 160, sm: 180 },
              maxWidth: { xs: 160, sm: 180 },
              flexShrink: 0,
              cursor: 'pointer',
              borderRadius: 2,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark
                  ? '0 4px 12px rgba(0,0,0,0.4)'
                  : '0 4px 12px rgba(0,0,0,0.1)',
                borderColor: 'primary.main'
              }
            }}
          >
            {/* Product Image */}
            <CardMedia
              component="img"
              image={product.productImageUrl}
              alt={product.productName}
              sx={{
                height: { xs: 100, sm: 120 },
                objectFit: 'cover',
                bgcolor: isDark ? 'grey.900' : 'grey.100'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-product.png' // Fallback image
              }}
            />

            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              {/* Product Name */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5
                }}
              >
                {product.productName}
              </Typography>

              {/* Shop Owner */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mb: 0.75
                }}
              >
                <StoreIcon
                  sx={{
                    fontSize: 12,
                    color: 'text.secondary'
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.65rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {product.shopOwnerName}
                </Typography>
              </Box>

              {/* Price & Type */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 0.5
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    color: 'primary.main'
                  }}
                >
                  {formatPrice(product.productPrice)}
                </Typography>

                <Chip
                  label={product.productType}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    bgcolor: product.productType === 'DIGITAL'
                      ? (isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)')
                      : (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'),
                    color: product.productType === 'DIGITAL' ? '#8B5CF6' : '#22C55E',
                    '& .MuiChip-label': {
                      px: 0.75
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default TaggedProductsSection