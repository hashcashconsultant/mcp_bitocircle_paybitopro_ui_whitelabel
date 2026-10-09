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
    Avatar,
    Button,
    Chip,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    InputAdornment,
    Fade,
    Zoom,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    Snackbar,
    Alert,
    Backdrop,
    Divider
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
    ArrowBack,
} from '@mui/icons-material';
import Image from 'next/image';
import bitoHubTextLogo from '../app/Assets/img/bitoHubTextLogo.png';
import { redirect } from 'next/dist/server/api-utils';
import Link from 'next/link';
import { MetaMaskContext, useMetaMask } from '../contexts/MetaMaskContext';
import { CRYPTOIMAGEURL, getLocationData, getBlockChainContract } from '../services/CoreDataService';
import axios from 'axios';
import { MetaMaskInpageProvider } from "@metamask/providers";
import web3 from "web3";
import { useRouter } from 'next/navigation';



const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';

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



const FinanceHubNftMyNftContent = () => {
    const router = useRouter();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const { metaMask, setMetaMask } = useMetaMask();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('section1');
    const [activeFilter, setActiveFilter] = useState<'Owned' | 'Created' | 'OnSale'>('Owned');
    const [isLoginSectionEnabled, setIsLoginSectionEnabled] = useState(true);
    const [loginText, setLoginText] = useState('');
    const [brokerId, setBrokerId] = useState<string>('');
    const [brokerCountry, setBrokerCountry] = useState<string>('');
    const [userUuid, setUserUuid] = useState<string>('');
    const [userId, setUserId] = useState<number>(0);
    const [ownedNfts, setOwnedNfts] = useState<AllNft[]>([]);
    const [createdNfts, setCreatedNfts] = useState<InternalNft[]>([]);
    const [onSaleNfts, setOnSaleNfts] = useState<InternalNft[]>([]);

    // Loading and notification states
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');


    // Helper function to show snackbar
    const showSnackbar = async (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = async () => {
        setSnackbarOpen(false);
    };

    /* Method definition for going back to previous page */
    const handleGoBack = () => {
        router.back();
    };

    /* Method defination for handling user login */




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

    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const toggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
        window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode }));
    };


    /* Method defination for checking if metamask is connected or not */
    const checkMetaMaskConnection = async (): Promise<void> => {
        if (typeof window === 'undefined' || !window.ethereum) {
            console.error('🦊 MetaMask is not installed');
            showSnackbar('MetaMask is not installed', 'error');
            return;
        }

        try {
            // Explicitly cast the response and provide a fallback
            let accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[] | undefined;

            if (!accounts || accounts.length === 0) {
                accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[] | undefined;
            }

            if (accounts && accounts.length > 0) {
                const account = accounts[0];
                setMetaMask({ account }); // assuming setMetaMask expects { account: string }
                console.log('✅ MetaMask connected:', account);
                //showSnackbar(`MetaMask connected to ${account}`, 'success');
                await getAllExistingNfts(account);
            } else {
                console.warn('⚠️ No MetaMask accounts found.');
                showSnackbar('No MetaMask accounts found', 'error');
            }
        } catch (error) {
            console.error('🛑 MetaMask connection failed:', error);
            showSnackbar('MetaMask connection failed', 'error');
        } finally {
            setLoading(false);
        }
    };


    const getNFTsByFilter = (filter: 'Owned' | 'Created' | 'OnSale') => {
        const nftData = {
            Owned: ownedNfts,
            Created: createdNfts,
            OnSale: onSaleNfts,
        };
        return nftData[filter] || [];
    };

    const currentNFTs = getNFTsByFilter(activeFilter);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Owned': return 'linear-gradient(45deg, #10b981, #059669)';
            case 'Created': return 'linear-gradient(45deg, #3b82f6, #1d4ed8)';
            case 'OnSale': return 'linear-gradient(45deg, #f59e0b, #d97706)';
            default: return 'linear-gradient(45deg, #6b7280, #4b5563)';
        }
    };

    /* Method defination to get all user's nft */
    const getAllExistingNfts = async (account: string) => {

        const contract = await getBlockChainContract();

        if (!contract) return;
        const query = ` {
            nfts(where: { or: [{ owner: "${account}" }, { creator: "${account}" }] }) {
              id
              tokenURI
              price
              owner
              creator
              invalidated
            contractAddress

            }
          }
        `;

        try {
            //setLoading(true)
            // Fetch NFTs owned by the user from the subgraph
            const response = await fetch('https://api.studio.thegraph.com/query/108358/paybito_nft_marketplace/v0.0.1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: { owner: account } }),
            });
            //console.log('Graphql response..', response);
            const { data } = await response.json();
            //console.log(data?.nfts)
            const now = BigInt(Math.floor(Date.now() / 1000));
            // Process each NFT to fetch additional metadata
            const fetchInternalNftMetaData = async (nftList: InternalNft[]) => {
                return Promise.all(
                    nftList.map(async (nft: InternalNft) => {
                        try {
                            // Replace 'ipfs://' with 'https://ipfs.io/ipfs/' for metadata URLs
                            const metadataUrl = nft.tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                            //console.log('Fetching metadata from:', metadataUrl); // Log metadata URL
                            const response = await fetch(metadataUrl);
                            const metadata = await response.json();
                            const offer = await contract.methods.getOffer(nft.id).call() as OfferResponse;
                            //console.log('offer', offer)
                            const isOfferExpired = offer[2] > BigInt(0) && now > offer[2]; // Check expiration
                            const expirationTime = await contract.methods.getListingExpiration(nft.id).call() as bigint;

                            const isExpired = expirationTime > BigInt(0) && now > expirationTime;
                            //  // Map the NFT data with metadata and price
                            //  console.log('My NFTOffer:', {
                            //      offerer: offer[0],
                            //      offerAmount: offer[1],
                            //      offerExpiration: offer[2],
                            //      isExpired: isOfferExpired,
                            //  });

                            return {
                                ...nft,
                                metadata,
                                offer: {
                                    offerer: offer[0],
                                    offerAmount: offer[1],
                                    offerExpiration: offer[2],
                                    isExpired: isOfferExpired,
                                },
                                expirationTime,
                                isExpired,
                            };

                        } catch (error) {
                            showSnackbar('Error fetching metadata:' + error, 'error');
                            return { ...nft, metadata: null };
                        }
                    })
                );
            };
            const internalNfts = await fetchInternalNftMetaData(data?.nfts || []);
            //console.log(`internalNfts`, internalNfts)

            const externalNFTsData = account ? await fetchExternalNFTs(account) : [];
            if (externalNFTsData.length > 0) {
                const externalNFTsRawData = await externalNFTsData.map((nft: ExternalNft) => {

                    // Parse the metadata to extract the image
                    const parsedMetadata = nft.metadata ? JSON.parse(nft.metadata) : null;

                    // Fix IPFS links if they start with 'ipfs://'
                    const imageLink = parsedMetadata ? parsedMetadata.image : null;


                    return {
                        id: nft.token_id,
                        contractAddress: nft.token_address.toLowerCase(),
                        owner: nft.owner_of.toLowerCase(),
                        tokenURI: imageLink,  // Corrected to use the image from metadata
                        metadata: parsedMetadata,
                        price: null,
                        invalidated: false,
                        minterAddress: nft.minter_address,
                        status: "import", // Default status

                    };
                });
                //console.log('externalNFTsRawData', externalNFTsRawData)
                const fetchExternalNftMetaData = async (nftList: ExternalNft[]) => {
                    return Promise.all(
                        nftList.map(async (nft: ExternalNft) => {
                            try {
                                // Fetch offer details from the contract for external NFT
                                const offer = await contract.methods.getOffer(nft.id).call() as OfferResponse;
                                //console.log('offer', offer)
                                const isOfferExpired = offer[2] > BigInt(0) && now > offer[2]; // Check expiration
                                const expirationTime = await contract.methods.getListingExpiration(nft.id).call() as bigint;

                                const isExpired = expirationTime > BigInt(0) && now > expirationTime;



                                // Return enriched NFT object
                                return {
                                    ...nft,

                                    offer: {
                                        offerer: offer[0],
                                        offerAmount: offer[1],
                                        offerExpiration: offer[2],
                                        isExpired: isOfferExpired,
                                    },
                                    expirationTime,
                                    isExpired,
                                    isInvalidated: nft.invalidated,
                                };
                            } catch (error) {
                                console.error(`Error fetching metadata for NFT ${nft.id}:`, error);
                                return nft; // Return original NFT if fetching fails
                            }
                        })
                    );
                };
                const externalNfts = await fetchExternalNftMetaData(externalNFTsRawData || []);
                //console.log('externalNfts', externalNfts)
                const isImportedNFT = (externalNft: ExternalNft) =>
                    externalNfts.some(
                        (nft: ExternalNft) =>
                            nft.contractAddress && externalNft.contractAddress && nft.contractAddress.toLowerCase() === externalNft.contractAddress.toLowerCase() &&
                            nft.id === externalNft.id
                    );

                const updatedExternalNFTs = externalNfts
                    .filter((nft: ExternalNft) => !isImportedNFT(nft))
                    .map((nft: ExternalNft) => {
                        nft.status = "import";
                        return nft;
                    });
                updatedExternalNFTs.map((nft: ExternalNft) => {
                    // console.log(nft.id, isImportedNFT(nft))
                    if (isImportedNFT(nft)) {
                        nft.status = null
                    }
                });
                //console.log('owned External', updatedExternalNFTs);
                setOwnedNfts(updatedExternalNFTs);
            }

            const owned = internalNfts.filter((nft: InternalNft) => nft.owner != undefined && nft.owner.toLowerCase() === account.toString().toLowerCase());
            const created = internalNfts.filter((nft: InternalNft) => nft.creator != undefined && nft.creator.toLowerCase() === account.toString().toLowerCase());
            const onSale = internalNfts.filter(
                (nft) =>
                    nft.price !== null &&
                    nft.price > 0 &&
                    (nft.owner.toLowerCase() === account.toString().toLowerCase())
            );

            //console.log('owned Internal', owned)

            setOwnedNfts((prev) => [...prev, ...owned]);
            setCreatedNfts(created);
            setOnSaleNfts(onSale);

        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
            setInitialLoading(false);
        }




    }

    /* Method defination for fetching external nfts */
    const fetchExternalNFTs = async (walletAddress: string, chain = "eth") => {
        const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjVlOGU2NDcyLTUyZDItNGQ0YS1hYmM3LTRkODc3OGU3MTY0OSIsIm9yZ0lkIjoiNDM5NDcxIiwidXNlcklkIjoiNDUyMTI4IiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiIzZDhjMmUwNC01YmM2LTQyMDQtYmNmOS1iOTkxZDFkYjcxYmIiLCJpYXQiOjE3NDM2Nzk1NjQsImV4cCI6NDg5OTQzOTU2NH0.mH9Y6oarw1ZQ8oq_bWCNOCYZsYaUnNk9h5IRvLDrGPM';
        const url = `https://deep-index.moralis.io/api/v2/${walletAddress}/nft?chain=${chain}&limit=100`;

        try {

            const response = await fetch(url, {
                headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            return data.result; // Array of NFTs


        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
            return [];
        }
    }

    /* Method defination for  traverinsing to nft details page */
    const handleNavigateToNftDetails = async (nftId: string) => {
        setLoading(true);
        router.push(`/finance-hub/nft/${nftId}`);
    }


    useEffect(() => {
        const account = metaMask?.account;
        console.log('ACCOUNT => ', account)
        if (!account) {
            checkMetaMaskConnection();
        } else {
            getAllExistingNfts(account);
        }
    }, []);




    // Show loading spinner while fetching initial data
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
                    {/* Back Button */}
                    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                        <IconButton
                            onClick={handleGoBack}
                            sx={{
                                backgroundColor: mode === 'light'
                                    ? 'rgba(37, 99, 235, 0.1)'
                                    : 'rgba(96, 165, 250, 0.15)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${mode === 'light'
                                    ? 'rgba(37, 99, 235, 0.2)'
                                    : 'rgba(96, 165, 250, 0.2)'}`,
                                color: theme.palette.primary.main,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: mode === 'light'
                                        ? 'rgba(37, 99, 235, 0.15)'
                                        : 'rgba(96, 165, 250, 0.25)',
                                    transform: 'translateX(-4px)',
                                    boxShadow: mode === 'light'
                                        ? '0 8px 16px rgba(37, 99, 235, 0.2)'
                                        : '0 8px 16px rgba(0, 0, 0, 0.3)',
                                },
                            }}
                        >
                            <ArrowBack />
                        </IconButton>
                    </Box>

                    {/* NFT Section */}
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
                                    My NFTs
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
                            <Link href="/finance-hub/nft/create-nft">
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
                                    Create NFT
                                </Button>
                            </Link>
                        </Box>

                        {/* Filter Buttons */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: { xs: 1.5, sm: 2 },
                                mb: { xs: 3, sm: 4, md: 5 },
                                flexWrap: 'wrap',
                                justifyContent: { xs: 'center', sm: 'flex-start' },
                                p: { xs: 1, sm: 1.5 },
                                backgroundColor: mode === 'light'
                                    ? 'rgba(248, 250, 252, 0.8)'
                                    : 'rgba(15, 23, 42, 0.8)',
                                borderRadius: { xs: 2.5, sm: 3 },
                                border: mode === 'light'
                                    ? '1px solid rgba(226, 232, 240, 0.6)'
                                    : '1px solid rgba(148, 163, 184, 0.1)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            {(['Owned', 'Created', 'OnSale'] as const).map((filter) => (
                                <Button
                                    key={filter}
                                    variant={activeFilter === filter ? 'contained' : 'text'}
                                    onClick={() => setActiveFilter(filter)}
                                    sx={{
                                        borderRadius: { xs: 2, sm: 2.5 },
                                        px: { xs: 2, sm: 2.5, md: 3 },
                                        py: { xs: 0.75, sm: 1 },
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        minWidth: { xs: '80px', sm: '100px' },
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        ...(activeFilter === filter ? {
                                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                            color: 'white',
                                            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 6px 25px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                            },
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: '-100%',
                                                width: '100%',
                                                height: '100%',
                                                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                                                transition: 'left 0.5s',
                                            },
                                            '&:hover::before': {
                                                left: '100%',
                                            },
                                        } : {
                                            color: theme.palette.text.primary,
                                            backgroundColor: 'transparent',
                                            '&:hover': {
                                                backgroundColor: mode === 'light'
                                                    ? 'rgba(37, 99, 235, 0.08)'
                                                    : 'rgba(96, 165, 250, 0.15)',
                                                transform: 'translateY(-1px)',
                                                color: theme.palette.primary.main,
                                            },
                                        }),
                                    }}
                                >
                                    {filter === 'OnSale' ? 'On Sale' : filter}
                                </Button>
                            ))}
                        </Box>

                        {/* NFT Container */}
                        {currentNFTs.length > 0 ? (
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
                                {currentNFTs.map((nft) => (
                                    <Card
                                        key={nft.id}
                                        onClick={() => handleNavigateToNftDetails(nft.id)}
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
                                                {typeof nft.metadata === 'object' && nft.metadata?.image ? (
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
                                                        display: typeof nft.metadata === 'object' && nft.metadata?.image ? 'none' : 'flex',
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
                                                    {typeof nft.metadata === 'object' && nft.metadata?.name}
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
                                                        {nft?.price != null && nft?.price > 0 ? web3.utils.fromWei(nft.price.toString(), 'ether') + ' ETH' : 'Not For Sale'}
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
                                    No {activeFilter} NFTs
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
                                    {activeFilter === 'Owned' && 'Start building your NFT collection by purchasing or creating your first digital asset.'}
                                    {activeFilter === 'Created' && 'Unleash your creativity and mint your first unique NFT to showcase your digital art.'}
                                    {activeFilter === 'OnSale' && 'Your NFT transaction history will appear here once you start trading.'}
                                </Typography>
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
                                    {activeFilter === 'Created' ? 'Create Your First NFT' : 'Explore NFTs'}
                                </Button>
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

export default FinanceHubNftMyNftContent;