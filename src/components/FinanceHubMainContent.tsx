// content of page /finance-hub
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Container,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    IconButton,
    useMediaQuery,
    Link as MuiLink,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Card,
    CardContent,
    Grid,
    Avatar,
    Button,
    Chip,
    Fade,
    Paper,
    CircularProgress,
    Zoom,
    Snackbar,
    Alert,
} from '@mui/material';

import {
    Menu as MenuIcon,
    Close as CloseIcon,
    LightMode as LightModeIcon,
    DarkMode as DarkModeIcon,
    TrendingUp,
    People,
    AttachMoney,
    Analytics,
    Payments,
    Store,
    AccountBalance,
    Business,
    Assignment,
    PersonSearch,

} from '@mui/icons-material';
import Image from 'next/image';
import bitoHubTextLogo from '../app/Assets/img/bitoHubTextLogo.png';
import { redirect } from 'next/dist/server/api-utils';
import Link from 'next/link';
import axios from 'axios';
import { getBitoHubUserInfo } from '../services/CoreDataService';




export interface UserExchangeResponse {
    success: boolean;
    message: string;
    data: {
        userId: number;
        uuid: string;
        brokerId: string;
        country: string;
        userTierType: number;
        bankDetailsStatus: number;
        otp: number;
        gaOtp: number;
        isUserFollowing: number;
        topN: number;
        useCache: boolean;
        checkMappingStatus: number;
    };
    errorCode: string | null;
    totalRecords: number;
}

const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';

const FinanceHubMainPage = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('section1');
    const [isLoginSectionEnabled, setIsLoginSectionEnabled] = useState(true);
    const [loginText, setLoginText] = useState('');

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');


    // Load theme preference from localStorage on mount and listen for changes
    useEffect(() => {
        const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
        if (savedMode) {
            setMode(savedMode);
        } else {
            setMode(prefersDarkMode ? 'dark' : 'light');
        }

        // Listen for storage changes (works across tabs/windows)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'themeMode' && e.newValue) {
                setMode(e.newValue as 'light' | 'dark');
            }
        };

        // Listen for custom event for same-tab changes
        const handleThemeChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                setMode(customEvent.detail as 'light' | 'dark');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('themeChange', handleThemeChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('themeChange', handleThemeChange);
        };
    }, [prefersDarkMode]);

    useEffect(() => {
        getUserInfo();
    }, []);

    // Create theme based on mode
    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: '#1e40af',
                    },
                    secondary: {
                        main: '#dc2626',
                    },
                    background: {
                        default: mode === 'light' ? '#f8f9fa' : '#0a0a0a',
                        paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
                    },
                    text: {
                        primary: mode === 'light' ? '#2c3e50' : '#e5e5e5',
                        secondary: mode === 'light' ? '#555555' : '#b0b0b0',
                    },
                },
            }),
        [mode]
    );

    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const toggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);

        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode }));
    };

    const financeOptions = [
        {
            id: 1,
            title: 'Buy, Sell, Swap, Send & Receive Crypto Assets',
            description: 'Trade and exchange your favorite cryptocurrencies instantly',
            icon: AttachMoney,
            redirectTo: '/finance-hub/buy-and-swap-crypto'
        },
        {
            id: 2,
            title: 'Create Tokens',
            description: 'Launch your own custom tokens on popular blockchains',
            icon: TrendingUp,
            redirectTo: '/finance-hub/create-token'
        },
        {
            id: 3,
            title: 'Create NFT',
            description: 'Mint and create unique digital collectibles',
            icon: Analytics,
            redirectTo: '/finance-hub/nft'
        },
        {
            id: 4,
            title: 'Accept Payments',
            description: 'Accept crypto payments for your business',
            icon: Payments,
            redirectTo: '/finance-hub/payments'
        },
    ];

    /* method defination to get bitohub user info */
    const getUserInfo = async () => {
        setLoginText('We are logging you to the exchange.');
        const payload = {
            "adminUser": localStorage.getItem('uuid'),
        }
        try {
            const response = await getBitoHubUserInfo();

            if (!response.data.success) {
                showSnackbar(response.data.message, 'error');
                return;
            }
            const resp = response.data.data;
            const userObj = {
                uuid: resp.uuid,
                userId: resp.userId,
                userTierType: resp.userTierType,
                brokerId: resp.brokerId,
                country: resp.country,
            }
            localStorage.setItem('finance_hub_user', JSON.stringify(userObj));



        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setIsLoginSectionEnabled(false)
        }



    }

    // Helper function to show snackbar
    const showSnackbar = async (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = async () => {
        setSnackbarOpen(false);
    };

    // Memoize the background gradient based on mode to ensure it updates
    const backgroundGradient = useMemo(() => {
        return mode === 'light'
            ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            : 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)';
    }, [mode]);

    // Loading component for business owner mapping
    const LoadingMappingComponent = () => (
        <Fade in={true} timeout={600}>
            <Paper
                elevation={6}
                sx={{
                    width: '100%',
                    maxWidth: 500,
                    mx: 'auto',
                    p: { xs: 3, sm: 4, md: 5 },
                    borderRadius: 3,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    }
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 3,
                    }}
                >
                    {/* Icon and Loader Section */}
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <Zoom in={true} timeout={800}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.mode === 'light'
                                        ? 'rgba(30, 64, 175, 0.1)'
                                        : 'rgba(66, 165, 245, 0.1)',
                                    marginLeft: '9px',
                                    marginTop: '3px',
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            >
                                <PersonSearch
                                    sx={{
                                        fontSize: 32,
                                        color: theme.palette.primary.main
                                    }}
                                />
                            </Box>
                        </Zoom>
                        <CircularProgress
                            size={80}
                            thickness={3}
                            sx={{
                                color: theme.palette.primary.main,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 0,
                                opacity: 0.8,
                            }}
                        />
                    </Box>

                    {/* Text Content */}
                    <Box sx={{ maxWidth: 400 }}>

                        <Typography
                            variant="body1"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                lineHeight: 1.6,
                                mb: 2,
                            }}
                        >
                            {loginText}
                        </Typography>

                        {/* Progress indicator dots */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                            {[0, 1, 2].map((index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: theme.palette.primary.main,
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        animationDelay: `${index * 0.2}s`,
                                        '@keyframes pulse': {
                                            '0%, 80%, 100%': {
                                                opacity: 0.3,
                                                transform: 'scale(1)',
                                            },
                                            '40%': {
                                                opacity: 1,
                                                transform: 'scale(1.2)',
                                            },
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>


                </Box>
            </Paper>
        </Fade>
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            {isLoginSectionEnabled && (
                <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
                    <LoadingMappingComponent />
                </Container>
            )}

            {/* Main Content */}
            {!isLoginSectionEnabled && (
                <Box
                    key={mode} // Force re-render when mode changes
                    sx={{
                        pt: 4,
                        pb: 4,
                        minHeight: '100vh',
                        background: backgroundGradient,
                        transition: 'background 0.3s ease',
                    }}
                >
                    <Container maxWidth="lg">

                        {/* Welcome Section */}
                        <Box sx={{ mb: 6, textAlign: 'center' }}>
                            <Typography
                                variant="h3"
                                sx={{
                                    mb: 2,
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Finance Hub Dashboard
                            </Typography>
                            <Typography variant="h6" color="text.secondary">
                                Manage your crypto portfolio and digital assets
                            </Typography>
                        </Box>

                        {/* Crypto Action Cards - Fixed Horizontal Layout */}
                        <Box
                            sx={{
                                maxWidth: { xs: '100%', sm: '800px', md: '1000px', lg: '1200px' },
                                mx: 'auto',
                                px: { xs: 2, sm: 3 },
                                display: 'flex',
                                flexDirection: 'column',
                                gap: { xs: 2, sm: 3 }
                            }}
                        >
                            {financeOptions.map((action, index) => {
                                const IconComponent = action.icon;
                                return (
                                    <Card
                                        key={action.id}
                                        sx={{
                                            width: '100%',
                                            height: { xs: '120px', sm: '140px', md: '160px' },
                                            cursor: 'pointer',
                                            transition: 'all 0.4s ease',
                                            background: 'linear-gradient(135deg, #311bdc 0%, #ed002d 100%)',
                                            border: 'none',
                                            borderRadius: 3,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'row',
                                            boxShadow: '0 8px 32px rgba(49, 27, 220, 0.3)',
                                            '&:hover': {
                                                transform: 'translateY(-4px) scale(1.01)',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                width: { xs: '60px', sm: '80px', md: '100px' },
                                                height: { xs: '60px', sm: '80px', md: '100px' },
                                                background: 'rgba(255,255,255,0.1)',
                                                borderRadius: '50%',
                                                transform: 'translate(30px, -30px)',
                                            },
                                        }}
                                    >
                                        <CardContent
                                            sx={{
                                                p: { xs: 2, sm: 3, md: 4 },
                                                height: '100%',
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                position: 'relative',
                                                zIndex: 1,
                                                gap: { xs: 1, sm: 2, md: 3 },
                                                minWidth: 0,
                                            }}
                                        >
                                            {/* Icon Section */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    flexShrink: 0,
                                                    width: { xs: '50px', sm: '70px', md: '90px' }
                                                }}
                                            >
                                                <Avatar
                                                    sx={{
                                                        width: { xs: 40, sm: 50, md: 60 },
                                                        height: { xs: 40, sm: 50, md: 60 },
                                                        bgcolor: 'rgba(255,255,255,0.2)',
                                                        border: '2px solid rgba(255,255,255,0.3)',
                                                    }}
                                                >
                                                    <IconComponent
                                                        sx={{
                                                            fontSize: { xs: 20, sm: 24, md: 28 },
                                                            color: 'white'
                                                        }}
                                                    />
                                                </Avatar>
                                            </Box>

                                            {/* Text Content Section */}
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'flex-start',
                                                    textAlign: 'left',
                                                    minWidth: 0,
                                                    maxWidth: { xs: 'calc(100% - 170px)', sm: 'calc(100% - 200px)' },
                                                    pr: 1,
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        mb: { xs: 0, sm: 0.5 },
                                                        fontWeight: 600,
                                                        color: 'white',
                                                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                                                        lineHeight: { xs: 1.2, sm: 1.3 },
                                                        width: '100%',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: { xs: 2, sm: 1 },
                                                        WebkitBoxOrient: 'vertical',
                                                        wordBreak: 'break-word',
                                                    }}
                                                >
                                                    {action.title}
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.8)',
                                                        lineHeight: 1.3,
                                                        fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                                                        display: { xs: 'none', sm: 'block' },
                                                        width: '100%',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {action.description}
                                                </Typography>
                                            </Box>

                                            {/* Button Section */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    flexShrink: 0,
                                                    width: { xs: '100px', sm: '120px', md: '130px' }
                                                }}
                                            >
                                                <Button
                                                    component={Link}
                                                    href={action.redirectTo}
                                                    variant="contained"
                                                    fullWidth
                                                    sx={{
                                                        bgcolor: 'rgba(255,255,255,0.2)',
                                                        color: 'white',
                                                        border: '1px solid rgba(255,255,255,0.3)',
                                                        borderRadius: { xs: 1.5, sm: 2 },
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: { xs: 0.8, sm: 1 },
                                                        fontWeight: 500,
                                                        textTransform: 'none',
                                                        fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                                        minHeight: { xs: '32px', sm: '36px' },
                                                        '&:hover': {
                                                            bgcolor: 'rgba(255,255,255,0.3)',
                                                            transform: 'translateY(-1px)',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                        },
                                                        transition: 'all 0.3s ease',
                                                    }}
                                                >
                                                    Get Started
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>

                    </Container>
                </Box>
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

        </ThemeProvider>
    );
};

export default FinanceHubMainPage;