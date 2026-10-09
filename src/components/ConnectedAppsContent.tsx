'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { Apps as AppsIcon, LinkOff as DisconnectIcon } from '@mui/icons-material'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { BITOHUBWEBSERVICE } from '@/services/CoreDataService'

interface ConnectedApp {
  grantId: number
  clientId: string
  appName?: string
  logoUrl?: string | null
  developerName?: string | null
  scopes: { scope: string; title: string; description: string }[]
  isSandbox: boolean
  authorizedAt: string | null
  lastRefreshedAt: string | null
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '—')

export default function ConnectedAppsContent() {
  const theme = useTheme()
  const [apps, setApps] = useState<ConnectedApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<ConnectedApp | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchWithAuth(`${BITOHUBWEBSERVICE}/app/connectedApps`)
      const body = await response.json().catch(() => ({}))
      if (!response.ok || body.errorResponse?.error_data !== 0) {
        throw new Error(body.errorResponse?.error_msg || `Request failed (${response.status})`)
      }
      setApps(body.connectedApps || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const disconnect = async () => {
    if (!disconnecting) return
    setSaving(true)
    try {
      const response = await fetchWithAuth(`${BITOHUBWEBSERVICE}/app/connectedApps/${disconnecting.grantId}`, {
        method: 'DELETE',
      })
      const body = await response.json().catch(() => ({}))
      if (body.errorResponse?.error_data !== 0) {
        throw new Error(body.errorResponse?.error_msg || 'Could not disconnect the app.')
      }
      setDisconnecting(null)
      load()
    } catch (e) {
      setError((e as Error).message)
      setDisconnecting(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        Connected Apps
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Apps from the PayBito App Store that you allowed to use your BitoCircle account. Disconnecting an app stops it
        within a minute.{' '}
        <a href="/api/developer-portal" target="_blank" rel="noopener noreferrer">Build your own app</a>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : apps.length === 0 ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AppsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography fontWeight={600}>No connected apps</Typography>
            <Typography color="text.secondary" variant="body2">
              Apps you allow will show up here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {apps.map((app) => (
            <Card key={app.grantId} elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                    <Avatar src={app.logoUrl || undefined} variant="rounded">
                      <AppsIcon />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                        {app.appName || app.clientId}
                        {app.isSandbox && <Chip size="small" color="warning" label="Sandbox" sx={{ ml: 1 }} />}
                      </Typography>
                      {app.developerName && (
                        <Typography variant="body2" color="text.secondary">
                          by {app.developerName}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <Box>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DisconnectIcon />}
                      sx={{ textTransform: 'none' }}
                      onClick={() => setDisconnecting(app)}
                    >
                      Disconnect
                    </Button>
                  </Box>
                </Stack>
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ my: 1.5 }}>
                  {app.scopes.map((s) => (
                    <Tooltip key={s.scope} title={s.description}>
                      <Chip size="small" label={s.title} />
                    </Tooltip>
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Allowed {formatDate(app.authorizedAt)} · Last active {formatDate(app.lastRefreshedAt || app.authorizedAt)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={!!disconnecting} onClose={() => !saving && setDisconnecting(null)}>
        <DialogTitle>Disconnect {disconnecting?.appName || 'this app'}?</DialogTitle>
        <DialogContent>
          <Typography>The app loses access to your account. You can allow it again later from the app.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisconnecting(null)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={disconnect} disabled={saving} sx={{ textTransform: 'none' }}>
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
