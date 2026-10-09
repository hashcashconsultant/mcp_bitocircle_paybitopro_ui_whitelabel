'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Webcam from 'react-webcam'
import axios from 'axios'
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    CircularProgress,
    useMediaQuery,
    alpha,
    createTheme,
    ThemeProvider,
    Snackbar,
    Card,
} from '@mui/material'
import {
    CameraAlt as CameraAltIcon,
    Refresh as RefreshIcon,
    CloudUpload as CloudUploadIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
} from '@mui/icons-material'

// API Base URL
const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi'

// Interfaces
interface FaceDetection {
    box: {
        x: number
        y: number
        width: number
        height: number
    }
    score: number
}

interface FaceLandmarks {
    positions: Array<{ x: number; y: number }>
    shift: { x: number; y: number }
}

interface FaceDetectionWithLandmarks {
    detection: FaceDetection
    landmarks: FaceLandmarks
}

interface TinyFaceDetectorOptions {
    inputSize?: number
    scoreThreshold?: number
}

interface DisplaySize {
    width: number
    height: number
}

interface FaceApiNets {
    tinyFaceDetector: {
        loadFromUri: (uri: string) => Promise<void>
    }
    faceLandmark68Net: {
        loadFromUri: (uri: string) => Promise<void>
    }
}

interface FaceApiDraw {
    drawDetections: (canvas: HTMLCanvasElement, detections: FaceDetectionWithLandmarks[]) => void
    drawFaceLandmarks: (canvas: HTMLCanvasElement, detections: FaceDetectionWithLandmarks[]) => void
}

interface FaceApi {
    nets: FaceApiNets
    detectAllFaces: (
        input: HTMLVideoElement,
        options: TinyFaceDetectorOptions
    ) => {
        withFaceLandmarks: () => Promise<FaceDetectionWithLandmarks[]>
    }
    TinyFaceDetectorOptions: new (options?: TinyFaceDetectorOptions) => TinyFaceDetectorOptions
    matchDimensions: (canvas: HTMLCanvasElement, displaySize: DisplaySize) => void
    resizeResults: (
        detections: FaceDetectionWithLandmarks[],
        displaySize: DisplaySize
    ) => FaceDetectionWithLandmarks[]
    draw: FaceApiDraw
}

interface UploadPhotoResponse {
    error?: {
        error_data?: number
        error_msg?: string
    }
}

// Extend Window interface
declare global {
    interface Window {
        faceapi: FaceApi
    }
}

interface KycCapturePhotoContentProps {
    uuid?: string
    token?: string
}

// Helper function to safely decode base64
const safeBase64Decode = (str: string): string | null => {
    if (!str) return null
    
    try {
        // First, try to URL decode in case it was URL encoded
        let decodedStr = str
        try {
            decodedStr = decodeURIComponent(str)
        } catch {
            // If URL decoding fails, use original string
            decodedStr = str
        }
        
        // Replace URL-safe base64 characters back to standard base64
        const base64 = decodedStr
            .replace(/-/g, '+')
            .replace(/_/g, '/')
        
        // Add padding if necessary
        const paddedBase64 = base64.padEnd(
            base64.length + (4 - (base64.length % 4)) % 4,
            '='
        )
        
        // Decode base64
        return atob(paddedBase64)
    } catch (error) {
        console.error('Base64 decode error:', error, 'Input:', str)
        return null
    }
}

const KycCapturePhotoContent: React.FC<KycCapturePhotoContentProps> = ({ uuid, token }) => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
    const [mode, setMode] = useState<'light' | 'dark'>('light')
    const [userUuid, setUserUuid] = useState<string | null>(null)
    const [userToken, setUserToken] = useState<string | null>(null)
    const [paramsError, setParamsError] = useState<string | null>(null)

    useEffect(() => {
        console.log('Raw params => uuid:', uuid, 'token:', token)
        
        if (!uuid || !token) {
            setParamsError('URL parameters not found. Please scan the QR code again.')
            return
        }

        const decodedUuid = safeBase64Decode(uuid)
        const decodedToken = safeBase64Decode(token)

        console.log('Decoded params => uuid:', decodedUuid, 'token:', decodedToken)

        if (!decodedUuid || !decodedToken) {
            setParamsError('Invalid URL parameters. Please scan the QR code again.')
            return
        }

        setUserUuid(decodedUuid)
        setUserToken(decodedToken)
        setParamsError(null)

    }, [uuid, token])

    // Refs
    const webcamRef = useRef<Webcam>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // States
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [isCaptured, setIsCaptured] = useState(false)
    const [successMsg, setSuccessMsg] = useState(false)
    const [failMsg, setFailMsg] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [faceDetected, setFaceDetected] = useState(true)
    const [lastDetectedTime, setLastDetectedTime] = useState(Date.now())
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success')

    // Theme setup
    useEffect(() => {
        const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null
        setMode(savedMode || (prefersDarkMode ? 'dark' : 'light'))
    }, [prefersDarkMode])

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: '#1e40af',
                light: '#42a5f5',
                dark: '#1e40af',
                contrastText: '#ffffff'
            },
            secondary: {
                main: '#dc004e'
            },
            background: {
                default: mode === 'light' ? '#f5f5f5' : '#121212',
                paper: mode === 'light' ? '#ffffff' : '#1e1e1e'
            },
            text: {
                primary: mode === 'light' ? '#212121' : '#ffffff',
                secondary: mode === 'light' ? '#757575' : '#b0b0b0'
            }
        },
        typography: {
            fontFamily: [
                '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
                '"Helvetica Neue"', 'Arial', 'sans-serif'
            ].join(',')
        },
        shape: { borderRadius: 8 },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 8,
                        fontWeight: 600
                    }
                }
            }
        }
    }), [mode])

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // Snackbar helper
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        setSnackbarMessage(message)
        setSnackbarSeverity(severity)
        setSnackbarOpen(true)
    }

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false)
    }

    // Load face detection models
    const loadModels = async (): Promise<void> => {
        try {
            const MODEL_URL = '/models'
            if (window.faceapi) {
                await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
                await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
                setModelsLoaded(true)
            } else {
                console.error('face-api.js not loaded')
            }
        } catch (err) {
            console.error('Error loading face detection models:', err)
        }
    }

    // Face detection function
    const detectFace = useCallback(async (): Promise<void> => {
        if (
            webcamRef.current?.video &&
            webcamRef.current.video.readyState === 4 &&
            modelsLoaded &&
            window.faceapi &&
            !isCaptured
        ) {
            try {
                const video = webcamRef.current.video
                const detectionResult = await window.faceapi
                    .detectAllFaces(
                        video,
                        new window.faceapi.TinyFaceDetectorOptions()
                    )
                    .withFaceLandmarks()

                const detections: FaceDetectionWithLandmarks[] = detectionResult

                const canvas = canvasRef.current
                if (canvas) {
                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight
                    const displaySize: DisplaySize = {
                        width: video.videoWidth,
                        height: video.videoHeight,
                    }
                    window.faceapi.matchDimensions(canvas, displaySize)
                    const resizedDetections = window.faceapi.resizeResults(
                        detections,
                        displaySize
                    )
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height)
                    }
                    window.faceapi.draw.drawDetections(canvas, resizedDetections)
                    window.faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
                }

                if (detections.length > 0) {
                    setFaceDetected(true)
                    setLastDetectedTime(Date.now())
                } else {
                    const timeSinceLastDetection = Date.now() - lastDetectedTime
                    if (timeSinceLastDetection > 2000) {
                        setFaceDetected(false)
                    }
                }
            } catch (err) {
                console.error('Error detecting face:', err)
            }
        }
    }, [lastDetectedTime, modelsLoaded, isCaptured])

    // Load models on mount
    useEffect(() => {
        loadModels()
    }, [])

    // Start face detection interval
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined
        if (modelsLoaded && !isCaptured) {
            interval = setInterval(detectFace, 300)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [detectFace, modelsLoaded, isCaptured])

    // Capture photo
    const capture = (): void => {
        if (webcamRef.current) {
            const screenshot = webcamRef.current.getScreenshot()
            if (screenshot) {
                setCapturedImage(screenshot)
                setIsCaptured(true)
            }
        }
    }

    // Remove captured photo
    const removeCurrent = (): void => {
        setIsCaptured(false)
        setCapturedImage(null)
        setError(null)
        setFailMsg(false)
    }

    // Convert data URI to Blob
    const dataURItoBlob = (dataURI: string): Blob => {
        const byteString = atob(dataURI.split(',')[1])
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        const ia = new Uint8Array(byteString.length)
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
        }

        return new Blob([ia], { type: mimeString })
    }

    // Submit photo
    const submitPhoto = async (): Promise<void> => {
        if (!capturedImage) return
        if (!userUuid || !userToken) {
            showSnackbar('Cannot identify the user', 'error')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const userPhotoBlob = dataURItoBlob(capturedImage)
            const formData = new FormData()
            formData.append('token', userToken)
            formData.append('uuid', userUuid)
            formData.append('userPhoto', userPhotoBlob, 'userPhoto.png')

            const response = await axios.post<UploadPhotoResponse>(
                `${API_BASE_URL}/finance-hub/uploadUserPhoto`,
                formData,
                {
                    headers: {
                        Authorization: `BEARER ${localStorage.getItem('access_token')}`
                    }
                }
            )

            if (response.data.error?.error_data !== 0) {
                showSnackbar(response.data.error?.error_msg || 'Upload failed', 'error')
                setFailMsg(true)
                setSuccessMsg(false)
            } else {
                setSuccessMsg(true)
                setFailMsg(false)
                showSnackbar('Photo uploaded successfully!', 'success')
            }
        } catch (err) {
            setFailMsg(true)
            setSuccessMsg(false)
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            setError(errorMessage)
            showSnackbar(errorMessage, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 2, sm: 4 },
                    px: { xs: 2, sm: 3 },
                    background: mode === 'light'
                        ? 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
                        : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
                }}
            >
                <Box sx={{ maxWidth: 600, width: '100%' }}>
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2
                            }}
                        >
                            <CameraAltIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                        </Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                                mb: 1
                            }}
                        >
                            Capture Photo
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Take a clear photo for identity verification
                        </Typography>
                    </Box>

                    {/* Error State for Invalid Params */}
                    {paramsError ? (
                        <Card
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                borderRadius: 3,
                                border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
                                backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.background.paper
                            }}
                        >
                            <Box
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.2)} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <ErrorIcon sx={{ fontSize: 60, color: theme.palette.error.main }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.error.main, mb: 2 }}>
                                Invalid Link
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {paramsError}
                            </Typography>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => window.location.reload()}
                                startIcon={<RefreshIcon />}
                            >
                                Try Again
                            </Button>
                        </Card>
                    ) : successMsg ? (
                        /* Success State */
                        <Card
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                borderRadius: 3,
                                border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.background.paper
                            }}
                        >
                            <Box
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.2)} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <CheckCircleIcon sx={{ fontSize: 60, color: theme.palette.success.main }} />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 2 }}>
                                Photo Uploaded Successfully!
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Your photo has been uploaded. You can now close this window and continue with your KYC verification.
                            </Typography>
                        </Card>
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 3 },
                                borderRadius: 3,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.background.paper,
                                boxShadow: mode === 'light'
                                    ? '0 4px 20px rgba(0,0,0,0.08)'
                                    : '0 4px 20px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Webcam/Captured Image Container */}
                            <Box
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    backgroundColor: mode === 'dark' ? '#000' : '#f5f5f5',
                                    mb: 3
                                }}
                            >
                                {!isCaptured ? (
                                    <Box sx={{ position: 'relative' }}>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/png"
                                            videoConstraints={{ facingMode: 'user' }}
                                            style={{
                                                width: '100%',
                                                display: 'block',
                                                borderRadius: 8
                                            }}
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                pointerEvents: 'none'
                                            }}
                                        />

                                        {/* Face Detection Warning */}
                                        {!faceDetected && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 16,
                                                    left: 16,
                                                    right: 16,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    backgroundColor: alpha(theme.palette.error.main, 0.9),
                                                    color: '#fff',
                                                    backdropFilter: 'blur(8px)'
                                                }}
                                            >
                                                <WarningIcon sx={{ fontSize: 20 }} />
                                                <Typography variant="body2" fontWeight={600}>
                                                    No face detected. Please adjust your position.
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Face Detected Indicator */}
                                        {faceDetected && modelsLoaded && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 16,
                                                    left: 16,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 1,
                                                    px: 1.5,
                                                    borderRadius: 2,
                                                    backgroundColor: alpha(theme.palette.success.main, 0.9),
                                                    color: '#fff',
                                                    backdropFilter: 'blur(8px)'
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: '#fff',
                                                        animation: 'pulse 1.5s ease-in-out infinite',
                                                        '@keyframes pulse': {
                                                            '0%, 100%': { opacity: 1 },
                                                            '50%': { opacity: 0.5 }
                                                        }
                                                    }}
                                                />
                                                <Typography variant="caption" fontWeight={600}>
                                                    Face Detected
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <Box sx={{ position: 'relative' }}>
                                        <img
                                            src={capturedImage || ''}
                                            alt="Captured"
                                            style={{
                                                width: '100%',
                                                display: 'block',
                                                borderRadius: 8
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 16,
                                                right: 16,
                                                p: 1,
                                                borderRadius: '50%',
                                                backgroundColor: theme.palette.success.main,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <CheckCircleIcon sx={{ color: '#fff', fontSize: 24 }} />
                                        </Box>
                                    </Box>
                                )}
                            </Box>

                            {/* Error Message */}
                            {(failMsg || error) && (
                                <Alert
                                    severity="error"
                                    sx={{ mb: 3, borderRadius: 2 }}
                                    icon={<ErrorIcon />}
                                >
                                    {error || 'Oops! Your photo was not uploaded. Please try again.'}
                                </Alert>
                            )}

                            {/* Action Buttons */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    justifyContent: 'center'
                                }}
                            >
                                {!isCaptured && faceDetected && (
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={capture}
                                        startIcon={<CameraAltIcon />}
                                        fullWidth={isMobile}
                                        sx={{
                                            py: 1.5,
                                            px: 4,
                                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        Snap Photo
                                    </Button>
                                )}

                                {!isCaptured && !faceDetected && (
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        disabled
                                        startIcon={<WarningIcon />}
                                        fullWidth={isMobile}
                                        sx={{ py: 1.5, px: 4 }}
                                    >
                                        Position Your Face
                                    </Button>
                                )}

                                {isCaptured && (
                                    <>
                                        <Button
                                            variant="outlined"
                                            size="large"
                                            onClick={removeCurrent}
                                            startIcon={<RefreshIcon />}
                                            fullWidth={isMobile}
                                            disabled={loading}
                                            sx={{
                                                py: 1.5,
                                                px: 3,
                                                borderColor: theme.palette.error.main,
                                                color: theme.palette.error.main,
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                                    borderColor: theme.palette.error.main
                                                }
                                            }}
                                        >
                                            Take Another
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={submitPhoto}
                                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                                            fullWidth={isMobile}
                                            disabled={loading}
                                            sx={{
                                                py: 1.5,
                                                px: 4,
                                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {loading ? 'Uploading...' : 'Submit Photo'}
                                        </Button>
                                    </>
                                )}
                            </Box>

                            {/* Instructions */}
                            <Box
                                sx={{
                                    mt: 3,
                                    p: 2,
                                    borderRadius: 2,
                                    background: mode === 'dark'
                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                        : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.04) 100%)',
                                    border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                    📸 Photo Tips
                                </Typography>
                                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Ensure good lighting on your face
                                    </Typography>
                                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Remove hats, glasses, or masks
                                    </Typography>
                                    <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                        Hold your ID document clearly visible
                                    </Typography>
                                    <Typography component="li" variant="body2" color="text.secondary">
                                        Keep a neutral background
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    )}
                </Box>

                {/* Snackbar */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={4000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbarSeverity}
                        sx={{ width: '100%' }}
                        variant="filled"
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </ThemeProvider>
    )
}

export default KycCapturePhotoContent