'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { CheckCircleOutline as CheckIcon, Apps as AppsIcon } from '@mui/icons-material'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { BITOHUBWEBSERVICE } from '@/services/CoreDataService'
import { tokenCookie } from '@/hooks/useAuthRedirect'
import { signedInUuid } from '@/utils/apiAuth'
import { savePendingAuthorize } from '@/utils/pendingAuthorize'

const SIGN_IN_URL = 'https://myaccount.paybito.com/signin?continue=https://www.bitocircle.com&app=BitoCircle'

interface ScopeInfo {
  scope: string
  title: string
  description: string
}

interface AppDetails {
  clientId: string
  appName: string
  logoUrl?: string | null
  developerName?: string | null
  isSandbox: boolean
  scopes: ScopeInfo[]
}

interface ErrorResponse {
  error_data: number
  error_msg: string
}

/** Adds query parameters to a redirect URL the backend has already checked against the app's registration. */
const withParams = (url: string, params: Record<string, string>) => {
  const u = new URL(url)
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
  return u.toString()
}

export default function AuthorizeAppContent({ sandbox = false }: { sandbox?: boolean }) {
  const theme = useTheme()
  const params = useSearchParams()

  const request = useMemo(() => {
    const scopes = (params.get('scopes') || params.get('scope') || '')
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      clientId: params.get('clientId') || '',
      redirectUrl: params.get('redirectUrl') || '',
      scopes,
      state: params.get('state') || '',
    }
  }, [params])

  const [app, setApp] = useState<AppDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const missing = (['clientId', 'redirectUrl', 'state'] as const).filter((k) => !request[k])
    if (missing.length || request.scopes.length === 0) {
      setError(`This authorization link is incomplete (missing ${[...missing, ...(request.scopes.length ? [] : ['scopes'])].join(', ')}).`)
      setLoading(false)
      return
    }
    // Same sign-in check as the API calls: the uuid cookie is not always readable, so signedInUuid() also uses localStorage.
    if (!tokenCookie.get() || !signedInUuid()) {
      savePendingAuthorize()
      window.location.href = SIGN_IN_URL
      return
    }
    ;(async () => {
      try {
        const response = await fetchWithAuth(`${BITOHUBWEBSERVICE}/app/checkAppEligibility`, {
          method: 'POST',
          body: JSON.stringify({ ...request, isSandbox: sandbox }),
        })
        const body = (await response.json().catch(() => ({}))) as { appDetails?: AppDetails; errorResponse?: ErrorResponse }
        if (response.status === 401) {
          savePendingAuthorize()
          window.location.href = SIGN_IN_URL
          return
        }
        if (!body.appDetails || body.errorResponse?.error_data !== 0) {
          setError(body.errorResponse?.error_msg || 'This app cannot be authorized.')
        } else {
          setApp(body.appDetails)
        }
      } catch {
        setError('Could not reach BitoCircle. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    })()
  }, [request, sandbox])

  const allow = async () => {
    setSubmitting(true)
    try {
      const response = await fetchWithAuth(`${BITOHUBWEBSERVICE}/app/authorizeApp`, {
        method: 'POST',
        body: JSON.stringify({ ...request, isSandbox: sandbox }),
      })
      const body = (await response.json().catch(() => ({}))) as { redirectUrl?: string; errorResponse?: ErrorResponse }
      if (body.redirectUrl && body.errorResponse?.error_data === 0) {
        window.location.href = body.redirectUrl
        return
      }
      setError(body.errorResponse?.error_msg || 'Authorization failed.')
    } catch {
      setError('Could not reach BitoCircle. Check your connection and try again.')
    }
    setSubmitting(false)
  }

  // Only reached after checkAppEligibility accepted redirectUrl, so this never sends the user to an unregistered URL.
  const deny = () => {
    window.location.href = withParams(request.redirectUrl, {
      error: 'access_denied',
      error_description: 'The user denied the request',
      state: request.state,
    })
  }

  let redirectHost = ''
  try {
    redirectHost = new URL(request.redirectUrl).host
  } catch {
    redirectHost = ''
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card elevation={0} sx={{ width: '100%', maxWidth: 480, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : error && !app ? (
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Cannot authorize this app
              </Typography>
              <Alert severity="error">{error}</Alert>
              <Typography variant="body2" color="text.secondary">
                Go back to the app and try again, or contact its developer.
              </Typography>
            </Stack>
          ) : app ? (
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={app.logoUrl || undefined} variant="rounded" sx={{ width: 56, height: 56 }}>
                  <AppsIcon />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                    {app.appName}
                  </Typography>
                  {app.developerName && (
                    <Typography variant="body2" color="text.secondary">
                      by {app.developerName}
                    </Typography>
                  )}
                </Box>
                {app.isSandbox && <Chip size="small" color="warning" label="Sandbox" />}
              </Stack>

              <Typography>
                <strong>{app.appName}</strong> wants to use your BitoCircle account. It will be able to:
              </Typography>

              <List dense disablePadding>
                {app.scopes.map((s) => (
                  <ListItem key={s.scope} disableGutters alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: 34, mt: 0.5 }}>
                      <CheckIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={s.title} secondary={s.description} />
                  </ListItem>
                ))}
              </List>

              <Alert severity="info" variant="outlined">
                It can never send money, change your password or 2FA, or see your API keys. You can disconnect it at any
                time in Settings → Connected Apps.
              </Alert>

              {error && <Alert severity="error">{error}</Alert>}

              <Divider />
              <Typography variant="caption" color="text.secondary">
                After you choose, you will be sent back to {redirectHost || 'the app'}.
              </Typography>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button onClick={deny} disabled={submitting} sx={{ textTransform: 'none' }}>
                  Deny
                </Button>
                <Button variant="contained" onClick={allow} disabled={submitting} sx={{ textTransform: 'none', px: 3 }}>
                  {submitting ? 'Authorizing…' : 'Allow'}
                </Button>
              </Stack>
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  )
}
