'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Collapse,
  List,
  ListItemText,
  ListItemButton,
  Drawer,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Search as SearchIcon,
  ContentCopy as CopyIcon,
  ArrowBack as BackIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Lock as LockIcon,
  Check as CheckIcon,
  Terminal as TerminalIcon,
  Menu as MenuIcon,
  BugReport as DebugIcon,
  Person as UserIcon,
  MonetizationOn as MonetizeIcon,
} from '@mui/icons-material'
import { useThemeMode } from '@/contexts/ThemeContext'
import { AuthGuide, availability, curlHeaders, METHOD_TITLES, type AuthMethod, type EndpointAuth } from './authMethods'

export type ModuleType = 'user' | 'monetize' | 'admin'

interface ApiClientProps {
  adminSpec?: any
  monetizeSpec?: any
  userSpec?: any
  initialSpec?: any
  allowedModules?: ModuleType[]
  defaultModule?: ModuleType
  /** Which access method this page documents (each has its own route). Unset = the original /api page. */
  authMethod?: AuthMethod
}

interface Endpoint {
  path: string
  method: string
  tags: string[]
  summary?: string
  description?: string
  operationId?: string
  parameters?: any[]
  requestBody?: any
  responses?: any
  security?: any[]
  auth?: EndpointAuth
}

export default function ApiClient({ adminSpec, monetizeSpec, userSpec, initialSpec, allowedModules, defaultModule, authMethod }: ApiClientProps) {
  const theme = useTheme()
  const { mode, toggleTheme } = useThemeMode()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const resolvedMonetizeSpec = monetizeSpec || adminSpec

  const effectiveAllowedModules = useMemo<ModuleType[]>(() => {
    if (allowedModules && allowedModules.length > 0) {
      return allowedModules
    }
    const hasMonetize = !!resolvedMonetizeSpec
    if (userSpec && !hasMonetize) return ['user']
    if (hasMonetize && !userSpec) return ['monetize']
    return ['user', 'monetize']
  }, [allowedModules, userSpec, resolvedMonetizeSpec])

  const initialModule = defaultModule && effectiveAllowedModules.includes(defaultModule)
    ? defaultModule
    : effectiveAllowedModules.includes('user')
      ? 'user'
      : (effectiveAllowedModules[0] || 'user')

  const [selectedModule, setSelectedModule] = useState<ModuleType>(initialModule)

  const currentSpec = useMemo(() => {
    if (selectedModule === 'user') {
      return userSpec || initialSpec || resolvedMonetizeSpec
    }
    return resolvedMonetizeSpec || initialSpec || userSpec
  }, [selectedModule, userSpec, resolvedMonetizeSpec, initialSpec])

  // Flags whether each module tab is backed by its OWN spec, or is quietly
  // falling back to the shared initialSpec (or the other module's spec).
  // Used to show a small warning chip instead of pretending everything's wired up.
  const userSpecIsFallback = !userSpec
  const monetizeSpecIsFallback = !resolvedMonetizeSpec

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [activeTabMap, setActiveTabMap] = useState<Record<string, number>>({})

  // Tracks which named example is selected per "{uniqueKey}-{responseCode}" key
  const [activeExampleMap, setActiveExampleMap] = useState<Record<string, string>>({})

  const handleModuleChange = (newModule: ModuleType) => {
    if (newModule === selectedModule) return
    setSelectedModule(newModule)
    setSelectedTag(null)
    setSearchQuery('')
    setExpandedEndpoints({})
    setActiveTabMap({})
  }

  // Count total endpoints for a given spec
  const countEndpoints = (spec: any) => {
    if (!spec || !spec.paths) return 0
    let count = 0
    Object.keys(spec.paths).forEach((path) => {
      const pathItem = spec.paths[path]
      Object.keys(pathItem).forEach((method) => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          count++
        }
      })
    })
    return count
  }

  const userCount = useMemo(() => countEndpoints(userSpec || initialSpec), [userSpec, initialSpec])
  const monetizeCount = useMemo(() => countEndpoints(resolvedMonetizeSpec || initialSpec), [resolvedMonetizeSpec, initialSpec])

  // Resolve JSON references recursively to generate mock JSON payload matching Swagger UI
  const generateSampleJson = (schema: any, components: any, depth = 0): string => {
    if (!schema) return '{}'
    if (depth > 8) return '"..."'

    const resolve = (s: any, d: number): any => {
      if (!s) return null
      if (s.$ref) {
        const refName = s.$ref.split('/').pop()
        const refSchema = components?.schemas?.[refName]
        if (!refSchema) return {}
        return resolve(refSchema, d + 1)
      }

      if (s.allOf && Array.isArray(s.allOf)) {
        const merged: any = {}
        s.allOf.forEach((part: any) => {
          const res = resolve(part, d + 1)
          if (typeof res === 'object' && res !== null && !Array.isArray(res)) {
            Object.assign(merged, res)
          }
        })
        return merged
      }

      if (s.oneOf && Array.isArray(s.oneOf) && s.oneOf.length > 0) {
        return resolve(s.oneOf[0], d + 1)
      }
      if (s.anyOf && Array.isArray(s.anyOf) && s.anyOf.length > 0) {
        return resolve(s.anyOf[0], d + 1)
      }

      // Field-level (or whole-schema) "example" / "default" wins over generic type placeholders
      if (s.example !== undefined) {
        return s.example
      }
      if (s.default !== undefined) {
        return s.default
      }

      if (s.properties || s.type === 'object') {
        const obj: any = {}
        if (s.properties) {
          Object.keys(s.properties).forEach((key) => {
            obj[key] = resolve(s.properties[key], d + 1)
          })
        }
        if (s.additionalProperties && typeof s.additionalProperties === 'object' && Object.keys(s.additionalProperties).length > 0) {
          obj['additionalProp1'] = resolve(s.additionalProperties, d + 1)
        }
        return obj
      }

      if (s.type === 'array' || s.items) {
        return [resolve(s.items || {}, d + 1)]
      }

      if (s.type === 'string') {
        if (s.format === 'date-time') return new Date().toISOString()
        if (s.format === 'date') return '2026-09-01'
        if (s.enum && Array.isArray(s.enum) && s.enum.length > 0) return s.enum[0]
        return 'string'
      }

      if (s.type === 'integer' || s.type === 'number') {
        return 0
      }

      if (s.type === 'boolean') {
        return true
      }

      // Untyped or empty schema {} defaults to 'string' matching Swagger UI
      return 'string'
    }

    try {
      const resolved = resolve(schema, depth)
      return JSON.stringify(resolved, null, 2)
    } catch (e) {
      return '{}'
    }
  }


  // Resolve the best-available sample for a response's media type
  const resolveResponseSample = (
    mediaType: any,
    components: any,
    selectedExampleName?: string
  ): { text: string | null; exampleNames: string[]; activeExampleName: string | null } => {
    if (!mediaType) return { text: null, exampleNames: [], activeExampleName: null }

    if (mediaType.examples && typeof mediaType.examples === 'object') {
      const exampleNames = Object.keys(mediaType.examples)
      if (exampleNames.length > 0) {
        const activeExampleName =
          selectedExampleName && mediaType.examples[selectedExampleName]
            ? selectedExampleName
            : exampleNames[0]
        const chosen = mediaType.examples[activeExampleName]
        const value = chosen?.value
        const text = value !== undefined ? JSON.stringify(value, null, 2) : null
        if (text) {
          return { text, exampleNames, activeExampleName }
        }
      }
    }

    if (mediaType.example !== undefined) {
      return {
        text: JSON.stringify(mediaType.example, null, 2),
        exampleNames: [],
        activeExampleName: null,
      }
    }

    if (mediaType.schema) {
      return {
        text: generateSampleJson(mediaType.schema, components),
        exampleNames: [],
        activeExampleName: null,
      }
    }

    return { text: null, exampleNames: [], activeExampleName: null }
  }

  // Parse path and query parameters, HTTP methods, tags, etc.
  const endpoints: Endpoint[] = useMemo(() => {
    const list: Endpoint[] = []
    if (!currentSpec || !currentSpec.paths) return list

    Object.keys(currentSpec.paths).forEach((path) => {
      const pathItem = currentSpec.paths[path]
      Object.keys(pathItem).forEach((method) => {
        const lowerMethod = method.toLowerCase()
        if (['get', 'post', 'put', 'delete', 'patch'].includes(lowerMethod)) {
          const op = pathItem[method]
          list.push({
            path,
            method: method.toUpperCase(),
            tags: op.tags && op.tags.length > 0 ? op.tags : ['General'],
            summary: op.summary || '',
            description: op.description || '',
            operationId: op.operationId || '',
            parameters: op.parameters || [],
            requestBody: op.requestBody || null,
            responses: op.responses || {},
            security: op.security || currentSpec.security || [],
            auth: op['x-bitocircle-auth'],
          })
        }
      })
    })
    return list
  }, [currentSpec])

  // Get active tags and counting details
  const tagsList = useMemo(() => {
    const map: Record<string, number> = {}
    endpoints.forEach((ep) => {
      ep.tags.forEach((tag) => {
        map[tag] = (map[tag] || 0) + 1
      })
    })

    const apiTags = currentSpec?.tags || []
    return Object.keys(map).map((tagName) => {
      const found = apiTags.find((t: any) => t.name === tagName)
      return {
        name: tagName,
        description: found?.description || `${tagName} related endpoints`,
        count: map[tagName],
      }
    })
  }, [endpoints, currentSpec])

  // Filter endpoints based on search and selected tag
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch =
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ep.summary && ep.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ep.description && ep.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ep.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTag = !selectedTag || ep.tags.includes(selectedTag)

      return matchesSearch && matchesTag
    })
  }, [endpoints, searchQuery, selectedTag])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleEndpointExpand = (key: string) => {
    setExpandedEndpoints((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' }
      case 'POST':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' }
      case 'PUT':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' }
      case 'DELETE':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
      case 'PATCH':
        return { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' }
    }
  }

  const getParamDisplayType = (schema: any): string => {
    if (!schema) return 'string'
    if (schema.$ref) {
      return schema.$ref.split('/').pop() || 'object'
    }
    if (schema.type === 'array') {
      const itemType = schema.items?.$ref
        ? schema.items.$ref.split('/').pop()
        : schema.items?.type || 'string'
      return `Array[${itemType}]`
    }
    if (schema.format) {
      return `${schema.type || 'string'} ($${schema.format})`
    }
    return schema.type || 'string'
  }

  const resolveParamValue = (param: any): string => {
    if (param.example !== undefined) return String(param.example)
    if (param.schema?.example !== undefined) return String(param.schema.example)
    if (param.schema?.default !== undefined) return String(param.schema.default)
    return `<${param.name}>`
  }

  // Generate Sample cURL Command
  const generateCurl = (endpoint: Endpoint, sUrl: string) => {
    const { path, method, parameters, requestBody, security } = endpoint

    let resolvedPath = path
    if (parameters) {
      parameters.forEach((param: any) => {
        if (param.in === 'path') {
          resolvedPath = resolvedPath.replace(`{${param.name}}`, resolveParamValue(param))
        }
      })
    }

    let curl = `curl -X ${method} "${sUrl}${resolvedPath}"`

    const isSecure = !!security && security.length > 0 && endpoint.auth?.perm !== 'PUBLIC'
    curlHeaders(authMethod, isSecure).forEach((header) => {
      curl += ` \\\n  -H "${header}"`
    })
    curl += ` \\\n  -H "Content-Type: application/json"`

    const queryParams: string[] = []
    if (parameters) {
      parameters.forEach((param: any) => {
        if (param.in === 'query') {
          queryParams.push(`${param.name}=${resolveParamValue(param)}`)
        }
      })
    }

    if (queryParams.length > 0) {
      curl = curl.replace(
        `"${sUrl}${resolvedPath}"`,
        `"${sUrl}${resolvedPath}?${queryParams.join('&')}"`
      )
    }

    if (requestBody) {
      const mediaType = requestBody.content?.['application/json']
      if (mediaType) {
        const { text: sample } = resolveResponseSample(mediaType, currentSpec?.components)
        if (sample) {
          const cleanSample = sample.replace(/"/g, '\\"').split('\n').join('\n    ')
          curl += ` \\\n  -d "${cleanSample}"`
        }
      }
    }

    return curl
  }

  const serverUrl = useMemo(() => {
    if (currentSpec?.servers && currentSpec.servers.length > 0) {
      return currentSpec.servers[0].url
    }
    return selectedModule === 'user'
      ? 'https://institutional-bo.paybito.com:8443/BitohubService'
      : 'https://institutional-bo.paybito.com:8443/MonetizeService'
  }, [currentSpec, selectedModule])

  const moduleSelector = effectiveAllowedModules.length > 1 ? (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 0.5,
        borderRadius: '12px',
        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
        border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
        gap: 0.5,
      }}
    >
      {effectiveAllowedModules.includes('user') && (
        <Button
          size="small"
          onClick={() => handleModuleChange('user')}
          startIcon={<UserIcon sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: selectedModule === 'user' ? 700 : 500,
            fontSize: '0.8rem',
            py: 0.6,
            px: 1.5,
            bgcolor: selectedModule === 'user' ? (mode === 'dark' ? '#1e40af' : '#2563eb') : 'transparent',
            color: selectedModule === 'user' ? '#ffffff' : 'text.secondary',
            boxShadow: selectedModule === 'user' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
            '&:hover': {
              bgcolor: selectedModule === 'user' ? (mode === 'dark' ? '#1d4ed8' : '#1d4ed8') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
            },
          }}
        >
          User Module
          <Chip
            label={userCount}
            size="small"
            sx={{
              ml: 1,
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: selectedModule === 'user' ? 'rgba(255, 255, 255, 0.25)' : (mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
              color: selectedModule === 'user' ? '#ffffff' : 'text.secondary',
            }}
          />
        </Button>
      )}

      {(effectiveAllowedModules.includes('monetize') || effectiveAllowedModules.includes('admin')) && (
        <Button
          size="small"
          onClick={() => handleModuleChange('monetize')}
          startIcon={<MonetizeIcon sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: (selectedModule === 'monetize' || selectedModule === 'admin') ? 700 : 500,
            fontSize: '0.8rem',
            py: 0.6,
            px: 1.5,
            bgcolor: (selectedModule === 'monetize' || selectedModule === 'admin') ? (mode === 'dark' ? '#1e40af' : '#2563eb') : 'transparent',
            color: (selectedModule === 'monetize' || selectedModule === 'admin') ? '#ffffff' : 'text.secondary',
            boxShadow: (selectedModule === 'monetize' || selectedModule === 'admin') ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
            '&:hover': {
              bgcolor: (selectedModule === 'monetize' || selectedModule === 'admin') ? (mode === 'dark' ? '#1d4ed8' : '#1d4ed8') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
            },
          }}
        >
          Monetize Module
          <Chip
            label={monetizeCount}
            size="small"
            sx={{
              ml: 1,
              height: 18,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: (selectedModule === 'monetize' || selectedModule === 'admin') ? 'rgba(255, 255, 255, 0.25)' : (mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
              color: (selectedModule === 'monetize' || selectedModule === 'admin') ? '#ffffff' : 'text.secondary',
            }}
          />
        </Button>
      )}
    </Box>
  ) : null

  // Small non-blocking notice shown when the currently-selected module doesn't have
  // its own spec wired up yet and is silently reusing initialSpec / the other module's
  // spec. Purely informational.
  const moduleFallbackNotice =
    (selectedModule === 'user' && userSpecIsFallback && !initialSpec) ||
    ((selectedModule === 'monetize' || selectedModule === 'admin') && monetizeSpecIsFallback && !initialSpec) ? (
      <Chip
        label={
          selectedModule === 'user'
            ? 'No dedicated User spec wired up — showing fallback data'
            : 'No dedicated Monetize spec wired up — showing fallback data'
        }
        size="small"
        color="warning"
        variant="outlined"
        sx={{ fontWeight: 600, fontSize: '0.7rem', mb: 2 }}
      />
    ) : null

  const sidebarContent = (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Module Switcher in Sidebar */}
      {moduleSelector && (
        <Box sx={{ mb: 2 }}>
          {moduleSelector}
        </Box>
      )}

      {/* Search Field */}
      <TextField
        fullWidth
        size="small"
        placeholder={`Filter ${selectedModule === 'user' ? 'User' : 'Monetize'} endpoints...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            background: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            backdropFilter: 'blur(5px)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s ease',
            '&:hover': {
              border: '1px solid #1e40af',
            },
            '&.Mui-focused': {
              border: '1px solid #1e40af',
              boxShadow: '0 0 10px rgba(30, 64, 175, 0.25)',
            },
            '& fieldset': { border: 'none' },
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Navigation Label */}
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, mb: 1, color: 'text.secondary', px: 1 }}>
        {selectedModule === 'user' ? 'USER API CATEGORIES' : 'MONETIZE API CATEGORIES'}
      </Typography>

      {/* Tags Nav List */}
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
        <List sx={{ p: 0 }}>
          {/* All Endpoints Button */}
          <ListItemButton
            selected={selectedTag === null}
            onClick={() => {
              setSelectedTag(null)
              setMobileOpen(false)
            }}
            sx={{
              borderRadius: '10px',
              mb: 0.5,
              py: 1,
              px: 1.5,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                bgcolor: 'rgba(30, 64, 175, 0.15)',
                color: '#1e40af',
                fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(30, 64, 175, 0.2)' },
              },
            }}
          >
            <ListItemText
              primary="All Categories"
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: selectedTag === null ? 600 : 500 }}
            />
            <Chip
              label={endpoints.length}
              size="small"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                color: 'text.secondary',
              }}
            />
          </ListItemButton>

          {/* Tags Mapping */}
          {tagsList.map((tag) => (
            <ListItemButton
              key={tag.name}
              selected={selectedTag === tag.name}
              onClick={() => {
                setSelectedTag(tag.name)
                setMobileOpen(false)
              }}
              sx={{
                borderRadius: '10px',
                mb: 0.5,
                py: 1,
                px: 1.5,
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  bgcolor: 'rgba(30, 64, 175, 0.15)',
                  color: '#1e40af',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(30, 64, 175, 0.2)' },
                },
              }}
            >
              <ListItemText
                primary={tag.name}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: selectedTag === tag.name ? 600 : 500, noWrap: true }}
              />
              <Chip
                label={tag.count}
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: selectedTag === tag.name ? 'rgba(30, 64, 175, 0.2)' : (mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                  color: selectedTag === tag.name ? '#1e40af' : 'text.secondary',
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Dev Header */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          background: mode === 'dark' ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)} size="small" sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              color: '#ffffff',
            }}
          >
            <DebugIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
              {effectiveAllowedModules.length === 1
                ? (selectedModule === 'user' ? 'Paybito Bitohub' : 'Paybito Monetize')
                : 'Paybito API Reference'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem', mt: -0.2 }}>
              {authMethod ? METHOD_TITLES[authMethod] : 'Interactive API Reference'}
            </Typography>
          </Box>
        </Box>

        {/* Center Module Switcher (Desktop) */}
        {!isMobile && moduleSelector && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {moduleSelector}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            component="a"
            href="/"
            size="small"
            startIcon={<BackIcon />}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              color: 'text.primary',
              bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' },
              borderRadius: '8px',
            }}
          >
            Back to App
          </Button>

          <IconButton onClick={toggleTheme} color="inherit" size="small" sx={{ bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}>
            {mode === 'dark' ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Box>
      </Box>

      {/* Main Layout Container */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Desktop Left Sidebar */}
        {!isMobile && (
          <Box
            sx={{
              width: 320,
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              bgcolor: mode === 'dark' ? 'rgba(18, 18, 18, 0.3)' : 'rgba(255, 255, 255, 0.3)',
            }}
          >
            {sidebarContent}
          </Box>
        )}

        {/* Mobile Navigation Drawer */}
        <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 300, bgcolor: 'background.default' } }}>
          {sidebarContent}
        </Drawer>

        {/* Right Details/Documentation Pane */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>

          {moduleFallbackNotice}

          {/* Switch between the three access-method docs */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {([
              { href: '/api', label: 'White-label (sign-in token)', method: undefined },
              { href: '/api/api-key', label: 'API key & secret', method: 'apiKey' },
              { href: '/api/developer-portal', label: 'Developer Portal apps', method: 'developerPortal' },
            ] as const).map((doc) => (
              <Chip
                key={doc.href}
                component="a"
                href={doc.href}
                clickable
                label={doc.label}
                color={authMethod === doc.method || (!authMethod && !doc.method) ? 'primary' : 'default'}
                variant={authMethod === doc.method || (!authMethod && !doc.method) ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Box>

          {/* Spec Header Info Card */}
          <Card
            sx={{
              mb: 4,
              borderRadius: '16px',
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
              background: mode === 'dark' ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.6) 0%, rgba(20, 20, 20, 0.6) 100%)' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 245, 245, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5, color: '#1e40af' }}>
                  {currentSpec?.info?.title || (selectedModule === 'user' ? 'Paybito Bitohub Service API' : 'Paybito Bitohub Monetize Service API')}
                </Typography>
                <Chip
                  label={selectedModule === 'user' ? 'User Module' : 'Monetize Module'}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                />
                <Chip
                  label={`v${currentSpec?.info?.version || '1.0.0'}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(30, 64, 175, 0.1)',
                    color: '#1e40af',
                    border: '1px solid rgba(30, 64, 175, 0.2)'
                  }}
                />
              </Box>

              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, maxWidth: 800 }}>
                {currentSpec?.info?.description || (selectedModule === 'user' ? 'REST API documentation for Paybito Bitohub Service.' : 'REST API documentation for Paybito Bitohub Monetize Service.')}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.75rem' }}>
                    API Server URLs
                  </Typography>
                  {currentSpec?.servers?.map((server: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={server.description || 'Server'} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'action.hover' }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
                        {server.url}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.75rem' }}>
                    Developer Support
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Email:{' '}
                    <a href={`mailto:${currentSpec?.info?.contact?.email || 'support@paybito.com'}`} style={{ color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>
                      {currentSpec?.info?.contact?.email || 'support@paybito.com'}
                    </a>
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Publisher: {currentSpec?.info?.contact?.name || 'Paybito'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {authMethod && !selectedTag && <AuthGuide method={authMethod} />}

          {/* Tag Title Block */}
          {selectedTag && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {selectedTag}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                ({filteredEndpoints.length} endpoints)
              </Typography>
            </Box>
          )}

          {/* Endpoints Listing */}
          {filteredEndpoints.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', border: '1px dashed border.divider' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Endpoints Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No API routes match your filter queries in the {selectedModule === 'user' ? 'User' : 'Monetize'} module.
              </Typography>
            </Paper>
          ) : (
            filteredEndpoints.map((ep, idx) => {
              const uniqueKey = `${selectedModule}-${ep.method}-${ep.path}-${idx}`
              const isExpanded = !!expandedEndpoints[uniqueKey]
              const colors = getMethodColor(ep.method)
              const requiresAuth = ep.security && ep.security.length > 0
              const activeTab = activeTabMap[uniqueKey] || 0

              return (
                <Card
                  key={uniqueKey}
                  sx={{
                    mb: 2,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                    background: mode === 'dark' ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.7)',
                    transition: 'all 0.3s ease',
                    boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                    '&:hover': {
                      borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    },
                  }}
                >
                  {/* Endpoint Header clickable area */}
                  <Box
                    onClick={() => toggleEndpointExpand(uniqueKey)}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      justifyContent: 'space-between',
                      userSelect: 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, overflow: 'hidden' }}>
                      {/* Method Chip */}
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '6px',
                          bgcolor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          minWidth: 64,
                          textAlign: 'center',
                        }}
                      >
                        {ep.method}
                      </Box>

                      {/* Path String */}
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: { xs: '0.8rem', md: '0.9rem' },
                          fontWeight: 600,
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ep.path}
                      </Typography>

                      {/* Access badge for this page's auth method */}
                      {authMethod && (() => {
                        const access = availability(authMethod, ep.auth)
                        return access ? (
                          <Tooltip title={access.tooltip}>
                            <Chip
                              size="small"
                              label={access.label}
                              color={access.available ? 'success' : 'default'}
                              variant={access.available ? 'outlined' : 'filled'}
                              sx={{ ml: 1, height: 22, fontSize: '0.7rem', fontFamily: 'monospace', flexShrink: 0 }}
                            />
                          </Tooltip>
                        ) : null
                      })()}

                      {/* Security Lock Badge */}
                      {!authMethod && requiresAuth && (
                        <Tooltip title="Requires JWT Bearer Token">
                          <LockIcon sx={{ fontSize: 16, color: '#f59e0b', ml: 0.5 }} />
                        </Tooltip>
                      )}
                    </Box>

                    {/* Actions and expand button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Copy path">
                        <IconButton
                          size="small"
                          onClick={() => handleCopy(ep.path, `${uniqueKey}-path`)}
                          sx={{
                            color: 'text.secondary',
                            bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          {copiedId === `${uniqueKey}-path` ? <CheckIcon sx={{ fontSize: 15, color: 'success.main' }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
                        </IconButton>
                      </Tooltip>

                      <IconButton size="small" onClick={() => toggleEndpointExpand(uniqueKey)} sx={{ color: 'text.secondary' }}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Summary/Description text when closed */}
                  {!isExpanded && ep.summary && (
                    <Box sx={{ px: 2, pb: 2, pt: 0, mt: -0.5 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {ep.summary}
                      </Typography>
                    </Box>
                  )}

                  {/* Expanded Content Details */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box
                      sx={{
                        p: 3,
                        borderTop: '1px solid',
                        borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                        bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.01)',
                      }}
                    >
                      {/* Detailed Summary and Description */}
                      {ep.summary && (
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                          {ep.summary}
                        </Typography>
                      )}
                      {ep.description && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                          {ep.description}
                        </Typography>
                      )}

                      {/* Tabs Controller */}
                      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs
                          value={activeTab}
                          onChange={(_, newVal) => {
                            setActiveTabMap((prev) => ({ ...prev, [uniqueKey]: newVal }))
                          }}
                          sx={{ minHeight: 32 }}
                        >
                          <Tab label="Request Details" sx={{ textTransform: 'none', minHeight: 32, fontSize: '0.8rem', fontWeight: 600 }} />
                          <Tab label="Responses" sx={{ textTransform: 'none', minHeight: 32, fontSize: '0.8rem', fontWeight: 600 }} />
                          <Tab label="cURL Code" sx={{ textTransform: 'none', minHeight: 32, fontSize: '0.8rem', fontWeight: 600 }} />
                        </Tabs>
                      </Box>

                      {/* Tab Panels */}
                      {activeTab === 0 && (
                        <Box>
                          {/* Query/Path parameters */}
                          {ep.parameters && ep.parameters.length > 0 ? (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem', color: 'text.primary' }}>
                                Parameters
                              </Typography>
                              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', bgcolor: 'transparent' }}>
                                <Table size="small">
                                  <TableHead sx={{ bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Location</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Required</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Example</TableCell>
                                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Description</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {ep.parameters.map((param: any, pIdx: number) => {
                                      const exampleValue =
                                        param.example !== undefined
                                          ? param.example
                                          : param.schema?.example !== undefined
                                            ? param.schema.example
                                            : param.schema?.default !== undefined
                                              ? param.schema.default
                                              : null

                                      return (
                                        <TableRow key={pIdx}>
                                          <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>{param.name}</TableCell>
                                          <TableCell sx={{ fontSize: '0.75rem' }}><Chip label={param.in} size="small" sx={{ height: 18, fontSize: '0.65rem' }} /></TableCell>
                                          <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{getParamDisplayType(param.schema)}</TableCell>
                                          <TableCell sx={{ fontSize: '0.75rem' }}>{param.required ? <Chip label="Required" color="error" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} /> : 'Optional'}</TableCell>
                                          <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'text.secondary' }}>
                                            {exampleValue !== null ? String(exampleValue) : '—'}
                                          </TableCell>
                                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{param.description || 'No description provided'}</TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 3, fontSize: '0.8rem' }}>
                              No query or path parameters required.
                            </Typography>
                          )}

                          {/* Request Body Payload */}
                          {ep.requestBody && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem', color: 'text.primary' }}>
                                Request Body (application/json)
                              </Typography>
                              {(() => {
                                const mediaType = ep.requestBody.content?.['application/json']
                                if (!mediaType) return null
                                const { text: sample } = resolveResponseSample(mediaType, currentSpec?.components)
                                if (!sample) return null

                                return (
                                  <Box sx={{ position: 'relative' }}>
                                    <pre
                                      style={{
                                        margin: 0,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        fontSize: '0.75rem',
                                        fontFamily: 'monospace',
                                        background: mode === 'dark' ? '#0a0a0a' : '#f8f9fa',
                                        border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                                        color: mode === 'dark' ? '#38bdf8' : '#0369a1',
                                        overflowX: 'auto',
                                      }}
                                    >
                                      {sample}
                                    </pre>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCopy(sample, `${uniqueKey}-body`)}
                                      sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        color: 'text.secondary',
                                        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.03)',
                                        '&:hover': { bgcolor: 'action.hover' },
                                      }}
                                    >
                                      {copiedId === `${uniqueKey}-body` ? <CheckIcon sx={{ fontSize: 13, color: 'success.main' }} /> : <CopyIcon sx={{ fontSize: 13 }} />}
                                    </IconButton>
                                  </Box>
                                )
                              })()}
                            </Box>
                          )}
                        </Box>
                      )}

                      {activeTab === 1 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>
                            Responses
                          </Typography>
                          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', bgcolor: 'transparent' }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>HTTP Code</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Description</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Response Object</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.keys(ep.responses).map((code) => {
                                  const response = ep.responses[code]
                                  const mediaType = response.content?.['application/json'] || response.content?.['*/*']

                                  const exampleStateKey = `${uniqueKey}-${code}`
                                  const selectedExampleName = activeExampleMap[exampleStateKey]

                                  const { text: sampleText, exampleNames, activeExampleName } = resolveResponseSample(
                                    mediaType,
                                    currentSpec?.components,
                                    selectedExampleName
                                  )

                                  return (
                                    <TableRow key={code}>
                                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, verticalAlign: 'top' }}>
                                        <Chip
                                          label={code}
                                          size="small"
                                          color={code.startsWith('2') ? 'success' : (code.startsWith('4') ? 'warning' : 'error')}
                                          variant="outlined"
                                          sx={{ height: 18, fontSize: '0.65rem' }}
                                        />
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', verticalAlign: 'top' }}>
                                        {response.description || 'No description'}
                                      </TableCell>
                                      <TableCell sx={{ fontSize: '0.75rem' }}>
                                        {sampleText ? (
                                          <Box sx={{ mt: 0.5 }}>
                                            {/* Example selector */}
                                            {exampleNames.length > 1 && (
                                              <Select
                                                size="small"
                                                value={activeExampleName || exampleNames[0]}
                                                onChange={(e) =>
                                                  setActiveExampleMap((prev) => ({
                                                    ...prev,
                                                    [exampleStateKey]: e.target.value as string,
                                                  }))
                                                }
                                                sx={{
                                                  mb: 1,
                                                  fontSize: '0.7rem',
                                                  height: 28,
                                                  minWidth: 220,
                                                  '& .MuiSelect-select': { py: 0.5, fontSize: '0.7rem' },
                                                }}
                                              >
                                                {exampleNames.map((name) => (
                                                  <MenuItem key={name} value={name} sx={{ fontSize: '0.7rem' }}>
                                                    {name}
                                                  </MenuItem>
                                                ))}
                                              </Select>
                                            )}

                                            <Box sx={{ position: 'relative' }}>
                                              <pre
                                                style={{
                                                  margin: 0,
                                                  padding: '8px',
                                                  borderRadius: '6px',
                                                  fontSize: '0.7rem',
                                                  fontFamily: 'monospace',
                                                  background: mode === 'dark' ? '#0a0a0a' : '#f8f9fa',
                                                  color: mode === 'dark' ? '#34d399' : '#047857',
                                                  overflowX: 'auto',
                                                  maxWidth: '450px',
                                                }}
                                              >
                                                {sampleText}
                                              </pre>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleCopy(sampleText, `${uniqueKey}-res-${code}`)}
                                                sx={{
                                                  position: 'absolute',
                                                  top: 4,
                                                  right: 4,
                                                  color: 'text.secondary',
                                                  '&:hover': { bgcolor: 'action.hover' },
                                                }}
                                              >
                                                {copiedId === `${uniqueKey}-res-${code}` ? <CheckIcon sx={{ fontSize: 11, color: 'success.main' }} /> : <CopyIcon sx={{ fontSize: 11 }} />}
                                              </IconButton>
                                            </Box>
                                          </Box>
                                        ) : (
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Empty Response Body</Typography>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {activeTab === 2 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TerminalIcon sx={{ fontSize: 16 }} />
                            Sample cURL Request
                          </Typography>

                          {(() => {
                            const curlCommand = generateCurl(ep, serverUrl)
                            return (
                              <Box sx={{ position: 'relative' }}>
                                <pre
                                  style={{
                                    margin: 0,
                                    padding: '16px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    background: '#0a0a0a',
                                    color: '#f4f4f5',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    overflowX: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                  }}
                                >
                                  {curlCommand}
                                </pre>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopy(curlCommand, `${uniqueKey}-curl`)}
                                  sx={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' },
                                  }}
                                >
                                  {copiedId === `${uniqueKey}-curl` ? <CheckIcon sx={{ fontSize: 13, color: '#10b981' }} /> : <CopyIcon sx={{ fontSize: 13 }} />}
                                </IconButton>
                              </Box>
                            )
                          })()}
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Card>
              )
            })
          )}
        </Box>
      </Box>
    </Box>
  )
}