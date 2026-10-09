'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
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
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Language as DomainIcon,
  Refresh as VerifyIcon,
} from '@mui/icons-material'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { BITOHUBWEBSERVICE } from '@/services/CoreDataService'

const API = `${BITOHUBWEBSERVICE}/domains`

type DomainStatus = 'PENDING' | 'VERIFIED'

interface CommunityDomain {
  domainId: number
  domain: string
  origin: string
  status: DomainStatus
  dnsRecord: { type: 'TXT'; name: string; value: string }
  createdAt: string | null
  verifiedAt: string | null
  lastCheckedAt: string | null
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '—')

async function call<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, init)
  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.success === false) {
    throw new Error(body.message || `Request failed (${response.status})`)
  }
  return body.data as T
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Tooltip title={copied ? 'Copied' : `Copy ${label}`}>
      <IconButton
        size="small"
        aria-label={`Copy ${label}`}
        onClick={() => {
          navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        <CopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

function RecordRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme()
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 56, flex: 'none' }}>
        {label}
      </Typography>
      <Box
        component="code"
        sx={{
          flex: 1,
          minWidth: 0,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: theme.palette.action.hover,
          fontSize: 13,
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </Box>
      <CopyButton value={value} label={label.toLowerCase()} />
    </Stack>
  )
}

export default function CommunityDomainsContent() {
  const theme = useTheme()
  const [domains, setDomains] = useState<CommunityDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const [verifying, setVerifying] = useState<number | null>(null)
  const [removing, setRemoving] = useState<CommunityDomain | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDomains(await call<CommunityDomain[]>(API))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newDomain.trim()) return
    setAdding(true)
    setError(null)
    setNotice(null)
    try {
      const created = await call<CommunityDomain>(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })
      setNewDomain('')
      setNotice(`${created.domain} added. Add the TXT record below at your DNS provider, then click Verify.`)
      load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAdding(false)
    }
  }

  const verify = async (domain: CommunityDomain) => {
    setVerifying(domain.domainId)
    setError(null)
    setNotice(null)
    try {
      await call<CommunityDomain>(`${API}/${domain.domainId}/verify`, { method: 'POST' })
      setNotice(`${domain.domain} is verified. Your community can now sign in with BitoCircle from ${domain.origin}.`)
      load()
    } catch (e) {
      setError((e as Error).message)
      load()
    } finally {
      setVerifying(null)
    }
  }

  const remove = async () => {
    if (!removing) return
    setSaving(true)
    try {
      await call(`${API}/${removing.domainId}`, { method: 'DELETE' })
      setRemoving(null)
      load()
    } catch (e) {
      setError((e as Error).message)
      setRemoving(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        Community Domains
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Run your own BitoCircle community on your own domain. Prove you own the domain with a DNS record, and
        BitoCircle sign-in will work from it.{' '}
        <a href="/api" target="_blank" rel="noopener noreferrer">
          White-label API docs
        </a>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={add}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
              <TextField
                label="Domain"
                placeholder="community.example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                size="small"
                fullWidth
                helperText="The exact host name your community runs on, without https://"
                inputProps={{ autoComplete: 'off', spellCheck: false }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={adding ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                disabled={adding || !newDomain.trim()}
                sx={{ textTransform: 'none', whiteSpace: 'nowrap', minWidth: 140, height: 40 }}
              >
                Add domain
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : domains.length === 0 ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <DomainIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography fontWeight={600}>No domains yet</Typography>
            <Typography color="text.secondary" variant="body2">
              Add the domain of your community to get its DNS record.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {domains.map((d) => {
            const verified = d.status === 'VERIFIED'
            return (
              <Card key={d.domainId} elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                        {d.domain}
                        <Chip
                          size="small"
                          color={verified ? 'success' : 'warning'}
                          label={verified ? 'Verified' : 'Waiting for DNS'}
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {verified
                          ? `Verified ${formatDate(d.verifiedAt)} · checked daily`
                          : `Added ${formatDate(d.createdAt)}${d.lastCheckedAt ? ` · last checked ${formatDate(d.lastCheckedAt)}` : ''}`}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      {!verified && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={verifying === d.domainId ? <CircularProgress size={14} color="inherit" /> : <VerifyIcon />}
                          disabled={verifying !== null}
                          onClick={() => verify(d)}
                          sx={{ textTransform: 'none' }}
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setRemoving(d)}
                        sx={{ textTransform: 'none' }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      {verified ? 'Keep this DNS record in place' : 'Add this DNS record at your domain provider'}
                    </Typography>
                    <Stack spacing={1}>
                      <RecordRow label="Type" value={d.dnsRecord.type} />
                      <RecordRow label="Name" value={d.dnsRecord.name} />
                      <RecordRow label="Value" value={d.dnsRecord.value} />
                    </Stack>
                    {!verified && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Some providers add your domain to the name automatically: then enter only _bitocircle
                        {d.domain.split('.').length > 2 ? `.${d.domain.split('.').slice(0, -2).join('.')}` : ''}. DNS
                        changes can take a few minutes.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}

      <Dialog open={!!removing} onClose={() => !saving && setRemoving(null)}>
        <DialogTitle>Remove {removing?.domain}?</DialogTitle>
        <DialogContent>
          <Typography>
            BitoCircle sign-in stops working on this domain within a minute. You can add and verify it again later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoving(null)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={remove} disabled={saving} sx={{ textTransform: 'none' }}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
