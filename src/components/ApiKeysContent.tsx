'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
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
  Edit as EditIcon,
  Key as KeyIcon,
} from '@mui/icons-material'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { BITOHUBWEBSERVICE } from '@/services/CoreDataService'

const API = `${BITOHUBWEBSERVICE}/apikeys`

type Permission = 'READ' | 'WRITE' | 'MONEY'

interface ApiKey {
  apiKey: string
  label: string
  permissions: Permission[]
  ipWhitelist: string[]
  domainWhitelist: string[]
  createdAt: string | null
  expiresAt: string | null
  lastUsedAt: string | null
}

interface CreatedKey extends ApiKey {
  secretKey: string
}

const PERMISSIONS: { value: Permission; label: string; help: string }[] = [
  { value: 'READ', label: 'Read', help: 'Read your feed, profile, posts, messages and shop data.' },
  { value: 'WRITE', label: 'Write', help: 'Post, comment, like, message and change content settings.' },
  { value: 'MONEY', label: 'Money', help: 'Send gifts and payments, subscribe, place orders. Use with care.' },
]

const EXPIRY_OPTIONS = [
  { value: '', label: 'Never' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
]

const lines = (text: string) =>
  text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)

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

function WhitelistFields({
  ips,
  domains,
  onIps,
  onDomains,
  ipRequired,
}: {
  ips: string
  domains: string
  onIps: (v: string) => void
  onDomains: (v: string) => void
  ipRequired: boolean
}) {
  return (
    <>
      <TextField
        label={ipRequired ? 'Allowed IP addresses (required)' : 'Allowed IP addresses'}
        helperText="One per line. IPv4, IPv6 or CIDR, e.g. 203.0.113.10 or 203.0.113.0/24. Calls from other IPs are refused."
        value={ips}
        onChange={(e) => onIps(e.target.value)}
        multiline
        minRows={2}
        fullWidth
        required={ipRequired}
      />
      <TextField
        label="Allowed domains"
        helperText="One per line, e.g. https://app.example.com. Browser calls from other sites are refused."
        value={domains}
        onChange={(e) => onDomains(e.target.value)}
        multiline
        minRows={2}
        fullWidth
      />
    </>
  )
}

export default function ApiKeysContent() {
  const theme = useTheme()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [permissions, setPermissions] = useState<Permission[]>(['READ'])
  const [ips, setIps] = useState('')
  const [domains, setDomains] = useState('')
  const [expiry, setExpiry] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedKey | null>(null)

  const [editing, setEditing] = useState<ApiKey | null>(null)
  const [revoking, setRevoking] = useState<ApiKey | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setKeys(await call<ApiKey[]>(API))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const needsIp = permissions.includes('WRITE') || permissions.includes('MONEY')

  const openCreate = () => {
    setLabel('')
    setPermissions(['READ'])
    setIps('')
    setDomains('')
    setExpiry('')
    setFormError(null)
    setCreateOpen(true)
  }

  const togglePermission = (p: Permission) =>
    setPermissions((current) => (current.includes(p) ? current.filter((x) => x !== p) : [...current, p]))

  const create = async () => {
    setFormError(null)
    if (permissions.length === 0) return setFormError('Pick at least one permission.')
    if (needsIp && lines(ips).length === 0) return setFormError('Write and Money keys need at least one allowed IP.')
    setSaving(true)
    try {
      const data = await call<CreatedKey>(API, {
        method: 'POST',
        body: JSON.stringify({
          label: label.trim() || undefined,
          permissions,
          ipWhitelist: lines(ips),
          domainWhitelist: lines(domains),
          expiresInDays: expiry ? Number(expiry) : undefined,
        }),
      })
      setCreateOpen(false)
      setCreated(data)
      load()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const saveWhitelist = async () => {
    if (!editing) return
    setFormError(null)
    setSaving(true)
    try {
      await call(`${API}/${encodeURIComponent(editing.apiKey)}/whitelist`, {
        method: 'PUT',
        body: JSON.stringify({ ipWhitelist: lines(ips), domainWhitelist: lines(domains) }),
      })
      setEditing(null)
      load()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const revoke = async () => {
    if (!revoking) return
    setSaving(true)
    try {
      await call(`${API}/${encodeURIComponent(revoking.apiKey)}`, { method: 'DELETE' })
      setRevoking(null)
      load()
    } catch (e) {
      setError((e as Error).message)
      setRevoking(null)
    } finally {
      setSaving(false)
    }
  }

  const headerExample = created ? `X-MBX-APIKEY: base64("${created.apiKey}:<secret>")` : ''
  const curlExample = created
    ? `curl -H "X-MBX-APIKEY: $(printf '%s' '${created.apiKey}:${created.secretKey}' | base64 -w0)" \\\n  "${BITOHUBWEBSERVICE}/feeds/getFeeds?userId=<your userId>&pageId=0&offset=1&limit=10"`
    : ''

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={700}>
          API Keys
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none' }}>
          Create API key
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Use an API key to call the BitoCircle API as yourself from your own server or app. A key can only act on
        your account. Keys cannot change your password, 2FA, email or other keys.{' '}
        <a href="/api/api-key" target="_blank" rel="noopener noreferrer">Read the API key docs</a>
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
      ) : keys.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }} elevation={0}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <KeyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography fontWeight={600}>No API keys yet</Typography>
            <Typography color="text.secondary" variant="body2">
              Create a key to start using the API.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {keys.map((k) => (
            <Card key={k.apiKey} elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700}>{k.label}</Typography>
                    <Stack direction="row" alignItems="center" sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {k.apiKey}
                      </Typography>
                      <CopyButton value={k.apiKey} label="API key" />
                    </Stack>
                  </Box>
                  <Stack direction="row" gap={1} alignItems="flex-start">
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      sx={{ textTransform: 'none' }}
                      onClick={() => {
                        setIps(k.ipWhitelist.join('\n'))
                        setDomains(k.domainWhitelist.join('\n'))
                        setFormError(null)
                        setEditing(k)
                      }}
                    >
                      Whitelist
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      sx={{ textTransform: 'none' }}
                      onClick={() => setRevoking(k)}
                    >
                      Revoke
                    </Button>
                  </Stack>
                </Stack>
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ my: 1.5 }}>
                  {k.permissions.map((p) => (
                    <Chip key={p} size="small" label={p} color={p === 'MONEY' ? 'warning' : 'default'} />
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  IPs: {k.ipWhitelist.length ? k.ipWhitelist.join(', ') : 'any'} · Domains:{' '}
                  {k.domainWhitelist.length ? k.domainWhitelist.join(', ') : 'any'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created {formatDate(k.createdAt)} · Last used {formatDate(k.lastUsedAt)} · Expires{' '}
                  {k.expiresAt ? formatDate(k.expiresAt) : 'never'}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Create */}
      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create API key</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Name"
              placeholder="e.g. My trading bot"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              inputProps={{ maxLength: 100 }}
              fullWidth
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Permissions
              </Typography>
              <FormGroup>
                {PERMISSIONS.map((p) => (
                  <FormControlLabel
                    key={p.value}
                    control={
                      <Checkbox checked={permissions.includes(p.value)} onChange={() => togglePermission(p.value)} />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {p.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.help}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
            <WhitelistFields ips={ips} domains={domains} onIps={setIps} onDomains={setDomains} ipRequired={needsIp} />
            <TextField select label="Expires" value={expiry} onChange={(e) => setExpiry(e.target.value)} fullWidth>
              {EXPIRY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={create} disabled={saving} sx={{ textTransform: 'none' }}>
            {saving ? 'Creating…' : 'Create key'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Secret, shown once */}
      <Dialog open={!!created} fullWidth maxWidth="sm">
        <DialogTitle>Save your secret key</DialogTitle>
        <DialogContent>
          {created && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning">This is the only time the secret key is shown. Store it somewhere safe.</Alert>
              {(['apiKey', 'secretKey'] as const).map((field) => (
                <Box key={field}>
                  <Typography variant="caption" color="text.secondary">
                    {field === 'apiKey' ? 'API key' : 'Secret key'}
                  </Typography>
                  <Stack direction="row" alignItems="center">
                    <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                      {created[field]}
                    </Typography>
                    <CopyButton value={created[field]} label={field === 'apiKey' ? 'API key' : 'secret key'} />
                  </Stack>
                </Box>
              ))}
              <Box>
                <Typography variant="subtitle2">How to call the API</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Send one header, the same as the PayBito exchange API: {headerExample}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 1.5,
                    m: 0,
                    borderRadius: 2,
                    bgcolor: theme.palette.action.hover,
                    fontSize: 12,
                    overflowX: 'auto',
                    whiteSpace: 'pre',
                  }}
                >
                  {curlExample}
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCreated(null)} sx={{ textTransform: 'none' }}>
            I have saved it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit whitelist */}
      <Dialog open={!!editing} onClose={() => !saving && setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>Whitelist for {editing?.label}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <WhitelistFields
              ips={ips}
              domains={domains}
              onIps={setIps}
              onDomains={setDomains}
              ipRequired={!!editing && (editing.permissions.includes('WRITE') || editing.permissions.includes('MONEY'))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={saveWhitelist} disabled={saving} sx={{ textTransform: 'none' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke */}
      <Dialog open={!!revoking} onClose={() => !saving && setRevoking(null)}>
        <DialogTitle>Revoke {revoking?.label}?</DialogTitle>
        <DialogContent>
          <Typography>
            Anything using this key stops working immediately. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevoking(null)} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={revoke} disabled={saving} sx={{ textTransform: 'none' }}>
            Revoke key
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
