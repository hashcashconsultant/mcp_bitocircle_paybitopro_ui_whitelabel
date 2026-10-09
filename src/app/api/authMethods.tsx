'use client'

import React from 'react'
import { Alert, Box, Card, CardContent, Chip, Stack, Typography, useTheme } from '@mui/material'

/** The three ways to call the BitoCircle API; each has its own docs route. */
export type AuthMethod = 'whiteLabel' | 'apiKey' | 'developerPortal'

/**
 * What the backend publishes for each operation (springdoc extension "x-bitocircle-auth", built from
 * auth-policy.json): the permission the endpoint needs and, for apps, the OAuth scope.
 */
export interface EndpointAuth {
  perm?: string
  scope?: string | null
}

export interface Availability {
  available: boolean
  label: string
  tooltip: string
}

const API_KEY_PERMS = ['PUBLIC', 'PUBLIC_READ', 'READ', 'WRITE', 'MONEY']

/** Can this method call the endpoint, and what does it need? Unknown (older spec without the extension) = unknown. */
export function availability(method: AuthMethod, auth: EndpointAuth | undefined): Availability | null {
  if (!auth?.perm) return null
  const perm = auth.perm
  if (perm === 'PUBLIC') return { available: true, label: 'Public', tooltip: 'No credentials needed.' }
  if (method === 'apiKey') {
    if (!API_KEY_PERMS.includes(perm)) {
      return { available: false, label: 'Not with API keys', tooltip: 'Account, security and admin endpoints need the user\'s own sign-in.' }
    }
    if (perm === 'PUBLIC_READ' || perm === 'READ') return { available: true, label: 'Key: READ', tooltip: 'Needs a key with the READ permission.' }
    return { available: true, label: `Key: ${perm}`, tooltip: `Needs a key with the ${perm} permission and a whitelisted IP.` }
  }
  if (method === 'developerPortal') {
    if (!auth.scope) {
      return { available: false, label: 'Not for apps', tooltip: 'Apps can never call money, account, settings-change or admin endpoints.' }
    }
    return { available: true, label: auth.scope, tooltip: `The user must grant your app the ${auth.scope} scope.` }
  }
  if (perm === 'ADMIN') return { available: false, label: 'Admin only', tooltip: 'Not available to users.' }
  return { available: true, label: perm === 'PUBLIC_READ' ? 'Optional sign-in' : 'Sign-in token', tooltip: 'Authorization: Bearer <token> and uuid headers.' }
}

/** Header lines for the cURL example of each method. */
export function curlHeaders(method: AuthMethod | undefined, needsAuth: boolean): string[] {
  if (!needsAuth) return []
  switch (method) {
    case 'apiKey':
      return ['X-MBX-APIKEY: <base64(apiKey:secretKey)>']
    case 'developerPortal':
      return ['Authorization: Bearer <accessToken>', 'X-CLIENT-ID: <your clientId>']
    case 'whiteLabel':
      return ['Authorization: Bearer <sign-in token>', 'uuid: <user uuid>']
    default:
      return ['Authorization: Bearer <YOUR_JWT_TOKEN>']
  }
}

export const METHOD_TITLES: Record<AuthMethod, string> = {
  whiteLabel: 'White-label (sign-in token)',
  apiKey: 'API key & secret',
  developerPortal: 'Developer Portal apps (scopes)',
}

function Code({ children }: { children: string }) {
  const theme = useTheme()
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.5,
        borderRadius: 2,
        fontSize: 12.5,
        lineHeight: 1.6,
        overflowX: 'auto',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${theme.palette.divider}`,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      {children}
    </Box>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <Chip size="small" label={n} color="primary" sx={{ fontWeight: 700, minWidth: 28 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={700} sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        {children}
      </Box>
    </Box>
  )
}

const BITOHUB = 'https://institutional-bo.paybito.com:8443/BitohubService'

function ApiKeyGuide() {
  return (
    <Stack spacing={2.5}>
      <Typography color="text.secondary">
        Call the API as yourself from your own server or tool. A key can only act on the account that created it.
      </Typography>
      <Step n={1} title="Create a key">
        <Typography variant="body2" color="text.secondary">
          In BitoCircle go to <b>Settings → API Keys</b>. Pick permissions (READ, WRITE, MONEY), add the IPs your server
          calls from (required for WRITE and MONEY) and, for browser apps, the allowed domains. The secret is shown once.
        </Typography>
      </Step>
      <Step n={2} title="Send one header (same as the PayBito exchange API)">
        <Code>{`X-MBX-APIKEY: base64(apiKey + ":" + secretKey)

# or, like the PayBito payments API, two headers sent as-is:
X-MBX-APIKEY: <apiKey>
X-MBX-SECRETKEY: <secretKey>`}</Code>
      </Step>
      <Step n={3} title="Example">
        <Code>{`curl "${BITOHUB}/activity/getAccountHistory?userId=<your userId>" \\
  -H "X-MBX-APIKEY: $(printf '%s' 'bck_xxx:secret' | base64 -w0)"`}</Code>
      </Step>
      <Alert severity="info" variant="outlined">
        Ids in the request that name the acting user (userId, adminUser, senderId, pageId…) must be your own. API keys
        can never change your password, 2FA, email or other keys. Each endpoint below shows the permission it needs.
      </Alert>
    </Stack>
  )
}

function DeveloperPortalGuide() {
  return (
    <Stack spacing={2.5}>
      <Typography color="text.secondary">
        Build an app on developers.paybito.com for the <b>BitoCircle Platform</b>. Users install it from the App Store
        and allow it to act for them within the scopes they grant. Same flow as the PayBito Launch Platform.
      </Typography>
      <Step n={1} title="Register the app">
        <Typography variant="body2" color="text.secondary">
          On the developer portal choose platform <b>BitoCircle Platform</b>, pick the <code>bitocircle.*</code> scopes
          you need and set your success URL. You get a clientId and secret (and sandbox ones for testing before review).
        </Typography>
      </Step>
      <Step n={2} title="Send the user to authorize">
        <Code>{`GET https://www.bitocircle.com/authorize
      ?clientId=<clientId>
      &redirectUrl=<your success URL>
      &scopes=bitocircle.feed.read,bitocircle.post.write
      &state=<sha256(plainState) as hex>

# sandbox: https://www.bitocircle.com/sandbox/authorize?...`}</Code>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          The user signs in with PayBito if needed, sees your app and its scopes, and is sent back to{' '}
          <code>redirectUrl?code=…&state=…</code> (or <code>?error=access_denied</code>).
        </Typography>
      </Step>
      <Step n={3} title="Exchange the code (from your server)">
        <Code>{`POST ${BITOHUB}/api/oauth/v1/token      (sandbox: /api/oauth/v1/sandbox/token)
X-CLIENT-ID: <clientId>
Content-Type: application/json

{ "clientId": "...", "clientSecret": "...", "redirectUri": "<success URL>",
  "code": "<code>", "state": "<plainState>", "scopes": ["bitocircle.feed.read"] }

→ { "accessToken", "tokenType": "Bearer", "expiresIn": <epoch seconds>, "refreshToken",
    "scopes", "principalId": "<user uuid>", "brokerId",
    "errorResponse": { "error_data": 0, "error_msg": "Success" } }`}</Code>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Refresh: <code>POST …/api/oauth/v1/refresh</code> with clientId, clientSecret, refreshToken, principalId and
          scopes (each refresh token works once). Revoke: <code>POST …/api/oauth/v1/revoke</code> with clientId,
          clientSecret and accessToken.
        </Typography>
      </Step>
      <Step n={4} title="Call the API">
        <Code>{`curl "${BITOHUB}/feeds/getFeeds?userId=<user's userId>&pageId=0&offset=1&limit=10" \\
  -H "Authorization: Bearer <accessToken>" \\
  -H "X-CLIENT-ID: <clientId>"`}</Code>
      </Step>
      <Alert severity="info" variant="outlined">
        Each endpoint below shows the scope it needs. Apps can never send money, change account or security settings,
        or call admin endpoints. Users can disconnect your app at any time in Settings → Connected Apps.
      </Alert>
    </Stack>
  )
}

function WhiteLabelGuide() {
  return (
    <Stack spacing={2.5}>
      <Typography color="text.secondary">
        For your own branded BitoCircle community: your users sign up and sign in with PayBito under your brand, and your
        app calls the API with their sign-in token.
      </Typography>
      <Step n={1} title="Verify your domain">
        <Typography variant="body2" color="text.secondary">
          In BitoCircle go to <b>Settings → Community Domains</b> and add the domain your community runs on, for example{' '}
          <code>community.example.com</code>. Add the TXT record it shows at your DNS provider and click <b>Verify</b>.
          Browsers can use BitoCircle sign-in only from bitocircle.com and verified domains. The record is checked daily,
          so keep it in place.
        </Typography>
        <Code>{`Type:  TXT
Name:  _bitocircle.community.example.com
Value: bitocircle-verify=<code shown in Settings>`}</Code>
      </Step>
      <Step n={2} title="Send the user's sign-in token on every call">
        <Code>{`Authorization: Bearer <user's sign-in token>
uuid: <user's uuid>`}</Code>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Both headers are required on every endpoint, and the token must belong to that uuid. Mobile apps send no
          browser Origin, so they only need these two headers.
        </Typography>
      </Step>
    </Stack>
  )
}

export function AuthGuide({ method }: { method: AuthMethod }) {
  const theme = useTheme()
  return (
    <Card elevation={0} sx={{ mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
          How to authenticate
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          {METHOD_TITLES[method]}
        </Typography>
        {method === 'apiKey' ? <ApiKeyGuide /> : method === 'developerPortal' ? <DeveloperPortalGuide /> : <WhiteLabelGuide />}
      </CardContent>
    </Card>
  )
}
