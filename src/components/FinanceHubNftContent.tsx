'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Container,
    Typography,
    useMediaQuery,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    Backdrop,
    Paper,
    Fade,
    Zoom
} from '@mui/material';

import {
    Analytics,
    Wallet,
    PersonSearch,
    Download,
    OpenInBrowser
} from '@mui/icons-material';
import Link from 'next/link';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { getBlockChainContract } from '../services/CoreDataService';
import { useRouter } from 'next/navigation';
import { MetaMaskInpageProvider } from "@metamask/providers";
import web3 from "web3";


declare global {
    interface Window {
        ethereum?: MetaMaskInpageProvider;
    }
}
interface IpGeolocationResponse {
    ip: string;
    continent_code: string;
    continent_name: string;
    country_code2: string;
    country_code3: string;
    country_name: string;
    country_name_official: string;
    country_capital: string;
    state_prov: string;
    state_code: string;
    district: string;
    city: string;
    zipcode: string;
    latitude: string;
    longitude: string;
    is_eu: boolean;
    country_flag: string;
    geoname_id: string;
    country_emoji: string;
    calling_code: string;
    country_tld: string;
    languages: string;
    isp: string;
    connection_type: string;
    organization: string;
    asn: string;
    currency: {
        code: string;
        name: string;
        symbol: string;
    };
    time_zone: {
        name: string;
        offset: number;
        offset_with_dst: number;
        current_time: string;
        current_time_unix: number;
        current_tz_abbreviation: string;
        current_tz_full_name: string;
        standard_tz_abbreviation: string;
        standard_tz_full_name: string;
        is_dst: boolean;
        dst_savings: number;
        dst_exists: boolean;
        dst_tz_abbreviation: string;
        dst_tz_full_name: string;
        dst_start: string;
        dst_end: string;
    };
}

interface RegisterExchangeResponse {
    success: boolean;
    message: string;
    data: {
        otp: number;
        gaOtp: number;
        isUserFollowing: number;
        topN: number;
        useCache: boolean;
        exchangeUserId: number;
        exchangeUserUuid: string;
        exchangeUserCountry: string;
        checkMappingStatus: number;
        exchangeUserBrokerId: string;
    };
    errorCode: string | null;
}

interface InternalNft {
    metadata: string | NormalizedMetadata | null;
    contractAddress: string;
    creator: string;
    owner: string;
    price: number | null;
    tokenURI: string;
    invalidated: boolean;
    id: string;
}
interface OfferResponse {
    0: string;        // offerer (address)
    1: bigint;        // offerAmount
    2: bigint;        // expirationTime
    offerer: string;
    offerAmount: bigint;
    expirationTime: bigint;
}
interface NftListPrice {
    listed: boolean;
    price: string | null;
    price_currency: string | null;
    price_usd: string | null;
    marketplace: string | null;
}

interface NormalizedMetadata {
    name: string;
    description: string;
    image?: string | null;
    animation_url?: string | null;
    external_link?: string | null;
    external_url?: string | null;
    collection?: string | null;
}

interface ExternalNft {
    amount: string;
    block_number: string;
    block_number_minted: string;
    collection_banner_image: string | null;
    collection_category: string | null;
    collection_logo: string | null;
    contract_type: string;
    discord_url: string | null;
    floor_price: string | null;
    floor_price_currency: string | null;
    floor_price_usd: string | null;
    instagram_username: string | null;
    last_metadata_sync: string;
    last_token_uri_sync: string;
    list_price: NftListPrice;
    metadata: string; // raw JSON string
    minter_address: string;
    name: string;
    normalized_metadata: NormalizedMetadata;
    owner_of: string;
    possible_spam: boolean;
    project_url: string | null;
    rarity_label: string | null;
    rarity_percentage: number | null;
    rarity_rank: number | null;
    symbol: string;
    telegram_url: string | null;
    token_address: string;
    token_hash: string;
    token_id: string;
    token_uri: string;
    twitter_username: string | null;
    verified_collection: boolean;
    wiki_url: string | null;
    id: string;
    invalidated: boolean;
    contractAddress: string;
    status: string | null;
    price: number | null;
}
type AllNft = InternalNft | ExternalNft;

interface FloorBid {
    bidder: string;
    bidAmount: string;
    expirationTime: bigint;
    isExpired: boolean;
}
interface Collection {
    id: string;
    name: string;
    description: string;
    backgroundImage: string;
    creator: string;
    volume: string;
    floorBid: FloorBid;
}

interface FloorBidResponse {
    bidder: string;
    bidAmount: string | bigint;
    expirationTime: number | bigint;
}

const FinanceHubNftPage = () => {
    const router = useRouter();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const { metaMask, setMetaMask } = useMetaMask();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [metamaskConnectionError, setMetamaskConnectionError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean | null>(null);

    // Helper function to show snackbar
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    // Check if MetaMask is installed
    const checkMetaMaskInstallation = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        const installed = !!window.ethereum && window.ethereum.isMetaMask;
        setIsMetaMaskInstalled(installed);
        return installed;
    };

    // Method definition for handling user login
    const makeUserLogin = async () => {
        setInitialLoading(true);
        try {
            const userData = localStorage.getItem('finance_hub_user');
            if (!userData) {
                showSnackbar('Failed to retrieve user data', 'error');
                router.push('/finance-hub');
                return;
            }

            const userObj = JSON.parse(userData);
            // You can use user data here if needed
            await checkMetaMaskConnection();
        } catch (error) {
            console.error('Failed to login user', error);
            showSnackbar(error instanceof Error ? error.message : 'An unexpected error occurred', 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    // Load theme preference
    useEffect(() => {
        const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
        if (savedMode) {
            setMode(savedMode);
        } else {
            setMode(prefersDarkMode ? 'dark' : 'light');
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'themeMode' && e.newValue) {
                setMode(e.newValue as 'light' | 'dark');
            }
        };

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

    // Check MetaMask installation on mount
    useEffect(() => {
        checkMetaMaskInstallation();
    }, []);

    // Create theme based on mode
    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: '#2563eb',
                        light: '#3b82f6',
                        dark: '#1d4ed8',
                    },
                    secondary: {
                        main: '#7c3aed',
                        light: '#8b5cf6',
                        dark: '#6d28d9',
                    },
                    background: {
                        default: mode === 'light' ? '#f8fafc' : '#0f0f23',
                        paper: mode === 'light' ? '#ffffff' : '#1a1b3a',
                    },
                    text: {
                        primary: mode === 'light' ? '#0f172a' : '#f1f5f9',
                        secondary: mode === 'light' ? '#475569' : '#94a3b8',
                    },
                    grey: {
                        50: '#f8fafc',
                        100: '#f1f5f9',
                        200: '#e2e8f0',
                        300: '#cbd5e1',
                        400: '#94a3b8',
                        500: '#64748b',
                        600: '#475569',
                        700: '#334155',
                        800: '#1e293b',
                        900: '#0f172a',
                    },
                },
                typography: {
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
                    h4: {
                        fontWeight: 700,
                        fontSize: '2.25rem',
                        lineHeight: 1.2,
                        letterSpacing: '-0.025em',
                    },
                    h6: {
                        fontWeight: 600,
                        fontSize: '1.125rem',
                        lineHeight: 1.4,
                    },
                    body1: {
                        fontSize: '1rem',
                        lineHeight: 1.6,
                    },
                    body2: {
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                    },
                },
                shape: {
                    borderRadius: 12,
                },
            }),
        [mode]
    );

    /* Method definition for checking if metamask is connected or not */
    const checkMetaMaskConnection = async (): Promise<void> => {
        setMetamaskConnectionError(false);

        // First check if MetaMask is installed
        if (!checkMetaMaskInstallation()) {
            setMetamaskConnectionError(true);
            showSnackbar('MetaMask is not installed. Please install MetaMask to continue.', 'error');
            return;
        }

        try {
            // Check if already connected
            if (!window.ethereum) {
                setMetamaskConnectionError(true);
                showSnackbar('MetaMask is not available', 'error');
                return;
            }

            const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[] | undefined;


            if (accounts && accounts.length > 0) {
                const account = accounts[0];
                setMetaMask({ account });
                console.log('✅ MetaMask connected:', account);
                showSnackbar(`Connected to ${account.substring(0, 6)}...${account.substring(account.length - 4)}`, 'success');
                await getAllCollection();
            } else {
                // Request connection
                const requestedAccounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                }) as string[];

                if (requestedAccounts && requestedAccounts.length > 0) {
                    const account = requestedAccounts[0];
                    setMetaMask({ account });
                    console.log('✅ MetaMask connected:', account);
                    showSnackbar(`Connected to ${account.substring(0, 6)}...${account.substring(account.length - 4)}`, 'success');
                    await getAllCollection();
                } else {
                    setMetamaskConnectionError(true);
                    showSnackbar('Please unlock MetaMask and connect your account', 'error');
                }
            }
        } catch (error) {
            console.error('Failed to connect with metamask', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
            setMetamaskConnectionError(true);
        }
    };

    /* Method definition for get all collections */
    const getAllCollection = async () => {
        try {
            setLoading(true);
            const contract = await getBlockChainContract();
            const query = `
                {
                  collections {
                    id
                    name
                    description
                    backgroundImage
                    creator
                    volume
                  }
                }
              `;

            const queryUrl = 'https://api.studio.thegraph.com/query/108358/paybito_nft_marketplace/v0.0.1';

            const response = await fetch(queryUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                throw new Error(`GraphQL request failed with status ${response.status}`);
            }

            const result = await response.json();
            const now = Math.floor(Date.now() / 1000);

            const allCollections = result.data.collections;
            let rank = 1;

            const processedCollections = await Promise.all(
                allCollections.map(async (collection: Collection) => {
                    let floorBidObj = {};

                    if (contract) {
                        try {
                            const floorBidData = (await contract.methods
                                .getFloorBid(collection.id)
                                .call()) as FloorBidResponse;

                            // Create floor bid object
                            floorBidObj = {
                                bidder: floorBidData.bidder,
                                bidAmount: web3.utils.fromWei(floorBidData.bidAmount.toString(), 'ether'),
                                expirationTime: floorBidData.expirationTime,
                                isExpired: floorBidData.expirationTime > 0 && now > floorBidData.expirationTime,
                            };
                        } catch (error) {
                            console.error('Error fetching floor bid:', error);
                        }
                    }

                    return {
                        id: collection.id,
                        rank: rank++,
                        name: collection.name,
                        description: collection.description,
                        backgroundImage: collection.backgroundImage,
                        creator: collection.creator,
                        volume: web3.utils.fromWei(collection.volume.toString(), 'ether'),
                        floorBid: floorBidObj,
                    };
                })
            );

            console.log('All Collections:', processedCollections);
            setCollections(processedCollections);

        } catch (error) {
            console.error('Failed to fetch collections', error);
            showSnackbar(error instanceof Error ? error.message : 'Failed to load collections', 'error');
        } finally {
            setLoading(false);
        }
    }

    /* Method definition to handle navigating to collection details */
    const handleNavigateToCollectionDetails = (collectionId: string) => {
        setLoading(true);
        router.push(`/finance-hub/nft/collection/${collectionId}`);
    }

    useEffect(() => {
        makeUserLogin();
    }, []);

    // Install MetaMask Component
    const InstallMetaMaskComponent = () => (
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
                        background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
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
                    {/* Icon Section */}
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <Zoom in={true} timeout={800}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.mode === 'light'
                                        ? 'rgba(245, 158, 11, 0.1)'
                                        : 'rgba(245, 158, 11, 0.1)',
                                    marginLeft: '9px',
                                    marginTop: '3px',
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            >
                                <Wallet
                                    sx={{
                                        fontSize: 32,
                                        color: theme.palette.warning.main
                                    }}
                                />
                            </Box>
                        </Zoom>
                        <CircularProgress
                            size={80}
                            thickness={3}
                            sx={{
                                color: theme.palette.warning.main,
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
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                color: theme.palette.warning.main,
                                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                mb: 2,
                            }}
                        >
                            MetaMask Required
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                lineHeight: 1.6,
                                mb: 3,
                            }}
                        >
                            MetaMask is not installed in your browser. To access the NFT marketplace and interact with blockchain features, please install MetaMask.
                        </Typography>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => window.open('https://metamask.io/download/', '_blank')}
                                sx={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    borderRadius: 3,
                                    px: 3,
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 35px rgba(245, 158, 11, 0.35)',
                                    },
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                Install MetaMask
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<OpenInBrowser />}
                                onClick={() => window.open('https://metamask.io/', '_blank')}
                                sx={{
                                    borderRadius: 3,
                                    px: 3,
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    borderColor: theme.palette.warning.main,
                                    color: theme.palette.warning.main,
                                    '&:hover': {
                                        borderColor: theme.palette.warning.dark,
                                        backgroundColor: 'rgba(245, 158, 11, 0.04)',
                                    },
                                }}
                            >
                                Visit MetaMask Website
                            </Button>

                            <Button
                                variant="text"
                                onClick={checkMetaMaskInstallation}
                                sx={{
                                    mt: 1,
                                    textTransform: 'none',
                                    color: theme.palette.text.secondary,
                                }}
                            >
                                Already installed? Refresh
                            </Button>
                        </Box>

                        {/* Installation Steps */}
                        <Box sx={{ mt: 4, textAlign: 'left' }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                                Installation Steps:
                            </Typography>
                            <Box component="ul" sx={{ pl: 2, color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                <li>Click &quot;Install MetaMask&quot; button above</li>
                                <li>Follow the instructions on the MetaMask website</li>
                                <li>Create a new wallet or import an existing one</li>
                                <li>Come back here and refresh the page</li>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Fade>
    );

    // Loading Component for connection
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

                    <Box sx={{ maxWidth: 400 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                color: theme.palette.primary.main,
                                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                mb: 2,
                            }}
                        >
                            Connecting to MetaMask
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                lineHeight: 1.6,
                                mb: 3,
                            }}
                        >
                            Please check your MetaMask extension and approve the connection request.
                        </Typography>

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

                        <Box sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<Wallet />}
                                onClick={checkMetaMaskConnection}
                                sx={{
                                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                    borderRadius: 3,
                                    px: 3,
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 35px rgba(37, 99, 235, 0.35)',
                                    },
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                            >
                                Connect MetaMask
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Fade>
    );

    // Show initial loading
    if (initialLoading) {
        return (
            <Box sx={{
                bgcolor: theme.palette.background.default,
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <CircularProgress />
            </Box>
        );
    }

    // Show MetaMask installation component if not installed
    if (isMetaMaskInstalled === false) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box
                    sx={{
                        bgcolor: theme.palette.background.default,
                        minHeight: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        py: { xs: 3, sm: 4, md: 6 },
                        px: { xs: 2, sm: 3, md: 4 },
                    }}
                >
                    <InstallMetaMaskComponent />
                </Box>
            </ThemeProvider>
        );
    }

    // Show connection component if MetaMask is installed but not connected
    if (metamaskConnectionError || !metaMask?.account) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box
                    sx={{
                        bgcolor: theme.palette.background.default,
                        minHeight: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        py: { xs: 3, sm: 4, md: 6 },
                        px: { xs: 2, sm: 3, md: 4 },
                    }}
                >
                    <LoadingMappingComponent />
                </Box>
            </ThemeProvider>
        );
    }

    // Main Content
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            {/* Main Content */}
            <Box
                sx={{
                    py: { xs: 3, sm: 4, md: 6 },
                    minHeight: '100vh',
                    background: mode === 'light'
                        ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 75%, #ffffff 100%)'
                        : 'linear-gradient(135deg, #0f0f23 0%, #1a1b3a 25%, #0f172a 75%, #1e293b 100%)',
                }}
            >
                <Container
                    maxWidth="xl"
                    sx={{
                        px: { xs: 2, sm: 3, md: 4 },
                        maxWidth: { xs: '100%', sm: '100%', md: '1400px' }
                    }}
                >
                    {/* Collections Section */}
                    <Box
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: { xs: 3, sm: 4 },
                            p: { xs: 3, sm: 4, md: 5 },
                            mb: { xs: 3, sm: 4 },
                            boxShadow: mode === 'light'
                                ? '0 10px 40px rgba(0, 0, 0, 0.04), 0 4px 25px rgba(0, 0, 0, 0.06)'
                                : '0 10px 40px rgba(0, 0, 0, 0.2), 0 4px 25px rgba(0, 0, 0, 0.3)',
                            border: mode === 'dark'
                                ? '1px solid rgba(148, 163, 184, 0.1)'
                                : '1px solid rgba(226, 232, 240, 0.8)',
                            backdropFilter: 'blur(20px)',
                            background: mode === 'light'
                                ? 'rgba(255, 255, 255, 0.95)'
                                : 'rgba(26, 27, 58, 0.95)',
                        }}
                    >
                        {/* Header Section */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                mb: { xs: 3, sm: 4, md: 5 },
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 2, sm: 3 },
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: { xs: '1.875rem', sm: '2.25rem', md: '2.5rem' },
                                        background: mode === 'light'
                                            ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)'
                                            : 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #60a5fa 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundSize: '200% 200%',
                                        animation: 'gradient 3s ease infinite',
                                        '@keyframes gradient': {
                                            '0%': { backgroundPosition: '0% 50%' },
                                            '50%': { backgroundPosition: '100% 50%' },
                                            '100%': { backgroundPosition: '0% 50%' },
                                        },
                                        mb: { xs: 0.5, sm: 0 },
                                    }}
                                >
                                    Collections
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        display: { xs: 'block', sm: 'none', md: 'block' },
                                    }}
                                >
                                    Manage your digital collection
                                </Typography>
                            </Box>
                            <Link href="/finance-hub/nft/my-nfts">
                                <Button
                                    variant="contained"
                                    startIcon={<Analytics />}
                                    sx={{
                                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                        borderRadius: { xs: 2.5, sm: 3 },
                                        px: { xs: 2.5, sm: 3, md: 4 },
                                        py: { xs: 1.25, sm: 1.5 },
                                        textTransform: 'none',
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        fontWeight: 600,
                                        boxShadow: '0 8px 25px rgba(37, 99, 235, 0.25)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        minWidth: { xs: '140px', sm: '160px' },
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 12px 35px rgba(37, 99, 235, 0.35)',
                                        },
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    My NFT
                                </Button>
                            </Link>
                        </Box>

                        {/* Collections Container */}
                        {collections.length > 0 ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(2, 1fr)',
                                        lg: 'repeat(3, 1fr)',
                                        xl: 'repeat(auto-fit, minmax(320px, 1fr))',
                                    },
                                    gap: { xs: 2.5, sm: 3, md: 4 },
                                    justifyContent: 'center',
                                }}
                            >
                                {collections.map((collection: Collection) => (
                                    <Card
                                        key={collection.id}
                                        onClick={() => handleNavigateToCollectionDetails(collection.id)}
                                        sx={{
                                            borderRadius: { xs: 3, sm: 4 },
                                            overflow: 'hidden',
                                            background: mode === 'light'
                                                ? 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
                                                : 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                                            border: mode === 'dark'
                                                ? '1px solid rgba(148, 163, 184, 0.1)'
                                                : '1px solid rgba(226, 232, 240, 0.8)',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: mode === 'light'
                                                    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)'
                                                    : 'linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
                                                opacity: 0,
                                                transition: 'opacity 0.3s ease',
                                                zIndex: 1,
                                            },
                                            '&:hover': {
                                                transform: 'translateY(-12px) scale(1.02)',
                                                boxShadow: mode === 'light'
                                                    ? '0 25px 50px rgba(0, 0, 0, 0.1), 0 15px 35px rgba(37, 99, 235, 0.15)'
                                                    : '0 25px 50px rgba(0, 0, 0, 0.4), 0 15px 35px rgba(37, 99, 235, 0.3)',
                                                border: mode === 'dark'
                                                    ? '1px solid rgba(37, 99, 235, 0.3)'
                                                    : '1px solid rgba(37, 99, 235, 0.2)',
                                                '&::before': {
                                                    opacity: 1,
                                                },
                                            },
                                            maxWidth: { xs: '100%', sm: '100%' },
                                            mx: 'auto',
                                        }}
                                    >
                                        {/* NFT Image Placeholder */}
                                        <Box
                                            sx={{
                                                width: '100%',
                                                aspectRatio: '1/1',
                                                background: mode === 'light'
                                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                                                    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: `radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)`,
                                                    animation: 'float 6s ease-in-out infinite',
                                                    '@keyframes float': {
                                                        '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
                                                        '50%': { transform: 'translate(-10px, -10px) rotate(5deg)' },
                                                    },
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    width: { xs: '80%', sm: '85%' },
                                                    aspectRatio: '1/1',
                                                    border: '2px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: { xs: 2, sm: 2.5 },
                                                    position: 'relative',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    backdropFilter: 'blur(20px)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 2,
                                                    overflow: 'hidden',
                                                    '&::before': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: -1,
                                                        left: -1,
                                                        right: -1,
                                                        bottom: -1,
                                                        background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.3), transparent, rgba(255, 255, 255, 0.1))',
                                                        borderRadius: 'inherit',
                                                        zIndex: -1,
                                                    },
                                                }}
                                            >
                                                {collection?.backgroundImage ? (
                                                    <img
                                                        src={collection?.backgroundImage.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                                        alt={collection?.name || 'Collection'}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            borderRadius: 'inherit',
                                                        }}
                                                    />
                                                ) : null}
                                                <Box
                                                    sx={{
                                                        display: collection?.backgroundImage ? 'none' : 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '100%',
                                                        height: '100%',
                                                    }}
                                                >
                                                    <Analytics
                                                        sx={{
                                                            fontSize: { xs: 50, sm: 60 },
                                                            color: 'rgba(255, 255, 255, 0.8)',
                                                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                                                            animation: 'pulse 2s ease-in-out infinite',
                                                            '@keyframes pulse': {
                                                                '0%, 100%': { transform: 'scale(1)' },
                                                                '50%': { transform: 'scale(1.05)' },
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>

                                        <CardContent
                                            sx={{
                                                p: { xs: 2.5, sm: 3 },
                                                position: 'relative',
                                                zIndex: 2,
                                                background: 'inherit',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: { xs: 1.5, sm: 2 },
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.primary,
                                                        fontSize: { xs: '1rem', sm: '1.125rem' },
                                                        lineHeight: 1.3,
                                                        flex: 1,
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {collection?.name}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 0.5,
                                                        px: { xs: 1.5, sm: 2 },
                                                        py: { xs: 0.75, sm: 1 },
                                                        borderRadius: 2,
                                                        background: mode === 'light'
                                                            ? 'rgba(37, 99, 235, 0.05)'
                                                            : 'rgba(96, 165, 250, 0.1)',
                                                        border: mode === 'light'
                                                            ? '1px solid rgba(37, 99, 235, 0.1)'
                                                            : '1px solid rgba(96, 165, 250, 0.2)',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: theme.palette.primary.main,
                                                            fontSize: { xs: '0.9rem', sm: '1rem' },
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {collection?.volume || '0'} ETH
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        ) : (
                            /* Empty State Message */
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    py: { xs: 6, sm: 8, md: 10 },
                                    px: { xs: 2, sm: 4 },
                                }}
                            >
                                <Box
                                    sx={{
                                        mb: 3,
                                        p: 3,
                                        borderRadius: '50%',
                                        background: mode === 'light'
                                            ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)'
                                            : 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        animation: 'bounce 2s ease-in-out infinite',
                                        '@keyframes bounce': {
                                            '0%, 100%': { transform: 'translateY(0)' },
                                            '50%': { transform: 'translateY(-10px)' },
                                        },
                                    }}
                                >
                                    <Analytics
                                        sx={{
                                            fontSize: { xs: 60, sm: 80 },
                                            color: theme.palette.primary.main,
                                            opacity: 0.8,
                                        }}
                                    />
                                </Box>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        color: theme.palette.text.primary,
                                        mb: 2,
                                        fontWeight: 600,
                                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                    }}
                                >
                                    No collections
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        mb: 4,
                                        maxWidth: '400px',
                                        mx: 'auto',
                                        lineHeight: 1.6,
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                    }}
                                >
                                    Start building your NFT collection by purchasing or creating your first digital asset.
                                </Typography>
                                <Link href="/finance-hub/nft/create-nft">
                                    <Button
                                        variant="contained"
                                        startIcon={<Analytics />}
                                        sx={{
                                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                            borderRadius: 3,
                                            px: { xs: 3, sm: 4 },
                                            py: { xs: 1.25, sm: 1.5 },
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: { xs: '0.875rem', sm: '1rem' },
                                            boxShadow: '0 8px 25px rgba(37, 99, 235, 0.25)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 12px 35px rgba(37, 99, 235, 0.35)',
                                            },
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                    >
                                        Create Your First NFT
                                    </Button>
                                </Link>
                            </Box>
                        )}
                    </Box>
                </Container>
            </Box>

            {/* Loading Backdrop */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

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

export default FinanceHubNftPage;