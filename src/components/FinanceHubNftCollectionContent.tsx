'use client';
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import {
    Box,
    Container,
    Typography,
    useMediaQuery,
    useTheme,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Card,
    CardContent,
    Button,
    Chip,
    Paper,
    Fade,
    Zoom,
    CircularProgress,
    Snackbar,
    Alert,
    Backdrop,
    Divider,
    Avatar,
    IconButton,
    Skeleton
} from '@mui/material';

import {
    TrendingUp,
    Analytics,
    AttachMoney,
    FavoriteBorder,
    Favorite,
    Share,
    MoreVert,
    Visibility,
    ArrowBack,
    FilterList,
    GridView,
    ViewList
} from '@mui/icons-material';
import Link from 'next/link';
import { MetaMaskContext, useMetaMask } from '../contexts/MetaMaskContext';
import { CRYPTOIMAGEURL, getLocationData, getBlockChainContract } from '../services/CoreDataService';
import axios from 'axios';
import { MetaMaskInpageProvider } from "@metamask/providers";
import web3 from "web3";
import { useRouter } from 'next/navigation';



// Mock data interfaces
interface FinanceHubNftCollectionPageProps {
    collectionId?: string; // Made optional to handle undefined case
}




export interface MetaData {
    collection: string;
    name: string;
    description: string;
    image: string;
}


export interface Nft {
    id: string;
    tokenURI: string;
    price: string | null;
    owner: string;
    creator: string;
    metadata: MetaData;
}

export interface Collection {
    id: string;
    name: string;
    description: string;
    backgroundImage: string;
    creator: string;
    volume: string;
    nfts: Nft[];
    floorPrice: string;
}


declare global {
    interface Window {
        ethereum?: MetaMaskInpageProvider;
    }
}

const FinanceHubNftCollectionPage: React.FC<FinanceHubNftCollectionPageProps> = ({ collectionId }) => {
    const router = useRouter();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const { metaMask, setMetaMask } = useMetaMask();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [nfts, setNfts] = useState<Nft[]>([]);
    const [floorPrice, setFloorPrice] = useState<string | null>(null)

    // Loading and notification states
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
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const toggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
        window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode }));
    };

    /* Method defination for  traverinsing to nft details page */
    const handleNavigateToNftDetails = async (nftId: string) => {
        setLoading(true);
        router.push(`/finance-hub/nft/${nftId}`);
    }

    /* Method definition for going back to previous page */
    const handleGoBack = () => {
        router.back();
    };

    useEffect(() => {
        console.log('=== COMPONENT DEBUGGING ===');
        console.log('CollectionId received:', collectionId);
        console.log('Type of collectionId:', typeof collectionId);
        console.log('Is undefined?', collectionId === undefined);
        console.log('Is null?', collectionId === null);
        console.log('Is empty string?', collectionId === '');
        console.log('Truthy check:', !!collectionId);
        console.log('===========================');

        if (!collectionId) {
            console.error('CollectionId is falsy, showing error');
            showSnackbar('Collection details not found', 'error');
            return;
        }
        console.log('Starting to load collection details...');
        setInitialLoading(true);
        getCollectionDetails(collectionId);
    }, [collectionId]);




    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };


    /* Method defination for rendering collection details */
    const getCollectionDetails = async (collectionId: string) => {
        const contract = await getBlockChainContract();
        const query = `
            {
                collection(id: ${collectionId}) {
                        id
                        name
                        description
                        backgroundImage
                        creator
                        volume
                        nfts {
                            id
                            tokenURI
                            price
                            owner
                            creator
                        }
                }
            }

          `;
        try {
            setLoading(true);
            const response = await fetch(
                'https://api.studio.thegraph.com/query/108358/paybito_nft_marketplace/v0.0.1',
                {
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
            console.log(result);
            const collection = result.data?.collection
            setCollection(collection);
            const offers = [];
            const nfts = collection.nfts;
            const detailedNFTs = await Promise.all(

                nfts.map(async (nft: Nft) => {
                    try {
                        setLoading(true);
                        // Fetch metadata for each NFT
                        const metadataUrl = nft.tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');

                        const response = await fetch(metadataUrl);
                        const metadata = await response.json();
                        const data = metadata.data || metadata; // Extract data if it exists, otherwise use full metadata

                        console.log('Data:', data);
                        console.log('Full metadata:', metadata);
                        // Fetch price, owner, and offer
                        const price = nft.price; // Already part of the struct
                        const owner = nft.owner; // Already part of the struct


                        return {
                            ...nft,
                            metadata,
                            price,
                            owner,
                        };
                    } catch (error) {
                        console.log(error);
                        showSnackbar('Error fetching metadata for NFT:' + error, 'error');
                        return null; // Handle errors gracefully
                    } finally {
                        setLoading(false);
                    }

                })
            )
            console.log(detailedNFTs);
            setNfts(detailedNFTs);
            let sortedNft = detailedNFTs.sort((a: Nft, b: Nft) => {
                // Handle null prices: items with prices come first
                if (a?.price == null) return b?.price == null ? 0 : 1;
                if (b?.price == null) return -1;

                // Both have prices, sort numerically
                return parseFloat(a.price) - parseFloat(b.price);
            });

            sortedNft = sortedNft.filter(elem => elem?.price != null && !elem?.isExpired)
            console.log('sortedNft', sortedNft)

            //console.log('LOWEST PRICE', sortedNft[0].price, sortedNft[sortedNft.length - 1].price);
            if (sortedNft.length > 0 && sortedNft[0].price != undefined) {
                setFloorPrice(web3.utils.fromWei(sortedNft[0].price.toString(), 'ether'))
            }


        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setInitialLoading(false);
            setLoading(false);
        }
    }


    if (loading) {
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

    return (
        <Fragment>
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.palette.background.default,
                }}
            >
                {/* Collection Header Section */}
                <Box
                    sx={{
                        position: 'relative',
                        background: theme.palette.mode === 'light'
                            ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        minHeight: { xs: '200px', sm: '300px', md: '350px' },
                        display: 'flex',
                        alignItems: 'flex-end',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
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
                                '50%': { transform: 'translate(-20px, -20px) rotate(5deg)' },
                            },
                        }
                    }}
                >
                    <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
                        {/* Back Button */}
                        <Box sx={{ pt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3 } }}>
                            <IconButton
                                onClick={handleGoBack}
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                        transform: 'translateX(-4px)',
                                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                                    },
                                }}
                            >
                                <ArrowBack />
                            </IconButton>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                alignItems: { xs: 'center', md: 'flex-end' },
                                gap: { xs: 3, md: 4 },
                                pb: { xs: 3, md: 4 },
                                textAlign: { xs: 'center', md: 'left' }
                            }}
                        >
                            {/* Collection Image */}
                            <Box
                                sx={{
                                    width: { xs: 120, sm: 150, md: 180 },
                                    height: { xs: 120, sm: 150, md: 180 },
                                    borderRadius: 3,
                                    border: '3px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(20px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                                }}
                            >
                                {collection?.backgroundImage ? (
                                    <img
                                        src={collection.backgroundImage.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                        alt={collection.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: 'inherit',
                                        }}
                                    />
                                ) : (
                                    <Analytics
                                        sx={{
                                            fontSize: { xs: 50, sm: 60, md: 70 },
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                                        }}
                                    />
                                )}
                            </Box>

                            {/* Collection Info */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                                            textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                                            mb: 1,
                                        }}
                                    >
                                        {collection?.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                        <Chip
                                            label={`Volume: ${collection?.volume ? web3.utils.fromWei(collection?.volume.toString(), 'ether') : 0} ETH`}
                                            sx={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                color: 'white',
                                                fontWeight: 600,
                                                backdropFilter: 'blur(10px)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                            }}
                                        />
                                    </Box>
                                </Box>

                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        lineHeight: 1.6,
                                        maxWidth: { md: '600px' },
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                    }}
                                >
                                    {collection?.description}
                                </Typography>
                            </Box>
                        </Box>
                    </Container>
                </Box>

                {/* Stats Section */}
                <Container maxWidth="xl" sx={{ mt: -3, position: 'relative', zIndex: 3 }}>
                    <Paper
                        elevation={8}
                        sx={{
                            borderRadius: 4,
                            background: theme.palette.background.paper,
                            backdropFilter: 'blur(20px)',
                            border: theme.palette.mode === 'dark'
                                ? '1px solid rgba(148, 163, 184, 0.1)'
                                : '1px solid rgba(226, 232, 240, 0.8)',
                            p: { xs: 3, sm: 4 },
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 3,
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box sx={{
                                textAlign: 'center',
                                flex: { xs: '1 1 calc(50% - 12px)', sm: '1 1 calc(25% - 18px)' },
                                minWidth: '120px'
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                    {nfts.length.toLocaleString()}
                                </Typography>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                    Total Items
                                </Typography>
                            </Box>
                            <Box sx={{
                                textAlign: 'center',
                                flex: { xs: '1 1 calc(50% - 12px)', sm: '1 1 calc(25% - 18px)' },
                                minWidth: '120px'
                            }}>
                                <Typography variant="h5" sx={{
                                    fontWeight: 700,
                                    color: theme.palette.primary.main,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {collection?.creator || 'None'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                    Owner
                                </Typography>
                            </Box>
                            <Box sx={{
                                textAlign: 'center',
                                flex: { xs: '1 1 calc(50% - 12px)', sm: '1 1 calc(25% - 18px)' },
                                minWidth: '120px'
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                    {collection?.volume ? web3.utils.fromWei(collection?.volume.toString(), 'ether') : 0} ETH
                                </Typography>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                    Total Volume
                                </Typography>
                            </Box>
                            <Box sx={{
                                textAlign: 'center',
                                flex: { xs: '1 1 calc(50% - 12px)', sm: '1 1 calc(25% - 18px)' },
                                minWidth: '120px'
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                    {floorPrice === null ? '0' : floorPrice} ETH
                                </Typography>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                    Floor Price
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Container>

                {/* NFT Grid Section */}
                <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
                    {/* Filter and View Controls */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 4,
                            flexWrap: 'wrap',
                            gap: 2,
                        }}
                    >
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                            }}
                        >
                            Collection Items ({nfts.length})
                        </Typography>

                    </Box>

                    {/* NFT Grid */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)',
                            },
                            gap: { xs: 2.5, sm: 3, md: 4 },
                        }}
                    >
                        {nfts.map((nft, index) => (
                            <Fade in={true} timeout={400 + index * 100} key={nft?.id}>
                                <Card
                                    key={nft?.id}
                                    onClick={() => handleNavigateToNftDetails(nft?.id)}
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
                                    {/* NFT Image Placeholder - Made Square */}
                                    <Box
                                        sx={{
                                            width: '100%',
                                            aspectRatio: '1/1', // This ensures the container is always square
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
                                        {/* Animated Background Pattern */}
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
                                        {/* Main Art Container - Made Square */}
                                        <Box
                                            sx={{
                                                width: { xs: '80%', sm: '85%' },
                                                aspectRatio: '1/1', // This ensures the inner container is also square
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
                                            {typeof nft?.metadata === 'object' && nft?.metadata?.image ? (
                                                <img
                                                    src={nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                                    alt={nft.metadata?.name || 'NFT'}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: 'inherit',
                                                    }}
                                                // onError={(e) => {
                                                //     e.target.style.display = 'none';
                                                //     e.target.nextSibling.style.display = 'flex';
                                                // }}
                                                />
                                            ) : null}
                                            <Box
                                                sx={{
                                                    display: typeof nft?.metadata === 'object' && nft?.metadata?.image ? 'none' : 'flex',
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
                                        {/* Name and Price in One Straight Line */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: { xs: 1.5, sm: 2 },
                                                flexWrap: 'wrap', // Allow wrapping on very small screens
                                            }}
                                        >
                                            {/* NFT Name */}
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: theme.palette.text.primary,
                                                    fontSize: { xs: '1rem', sm: '1.125rem' },
                                                    lineHeight: 1.3,
                                                    flex: 1,
                                                    minWidth: 0, // Allow text to shrink
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {typeof nft?.metadata === 'object' && nft?.metadata?.name}
                                            </Typography>

                                            {/* Price */}
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
                                                    flexShrink: 0, // Prevent price container from shrinking
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
                                                    {nft?.price != null && parseFloat(nft?.price) > 0 ? web3.utils.fromWei(nft.price.toString(), 'ether') + ' ETH' : 'Not For Sale'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Fade>
                        ))}
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
        </Fragment>
    );
};

export default FinanceHubNftCollectionPage;