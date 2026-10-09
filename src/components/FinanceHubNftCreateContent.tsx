'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
    Divider,
    Stack
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
    CloudUpload,
    Image as ImageIcon,
    Collections,
    Add as AddIcon,
    ArrowBack
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

const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';

declare global {
    interface Window {
        ethereum?: MetaMaskInpageProvider;
    }
}
interface EthereumError extends Error {
    code?: number | string;
}

interface Collection {
    id: string;
    name: string;
    description: string;
    creator: string;
}

const FinanceHubNftCreatePage = () => {
    const router = useRouter();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const { metaMask, setMetaMask } = useMetaMask();
    const [mobileOpen, setMobileOpen] = useState(false);

    // NFT Creation Form States
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [nftName, setNftName] = useState<string>('');
    const [nftDescription, setNftDescription] = useState<string>('');
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [collections, setCollections] = useState<Collection[]>([]);
    const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
    const [selectedCollectionImage, setSelectedCollectionImage] = useState<File | null>(null);
    const [collectionImagePreview, setCollectionImagePreview] = useState<string | null>(null);
    const [collectionName, setCollectionName] = useState<string>('');
    const [collectionDescription, setCollectionDescription] = useState<string>('');

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

    // Image upload handler
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (25MB limit)
            if (file.size > 25 * 1024 * 1024) {
                showSnackbar('File size should not exceed 25MB', 'error');
                return;
            }

            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                showSnackbar('Please upload only JPEG, JPG, or PNG files', 'error');
                return;
            }

            setSelectedImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    /* Method defination for uploading NFT file to IPFS */
    const uploadToIPFS = async (file: File) => {
        const data = new FormData();
        data.append("file", file);

        try {
            setLoading(true);
            const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                method: "POST",
                headers: {
                    "pinata_api_key": "6a6acf16ef6baf01fcad",
                    "pinata_secret_api_key": "c1ffa4ee6d439a780a8a9fc7fd7addefe61605d0d76af84e75ef7ffcac917e71",
                },
                body: data,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const ipfsHash = result.IpfsHash;
            return `ipfs://${ipfsHash}`;
        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
            return null;
        } finally {
            setLoading(false)
        }

    };


    /* Method defination NFT creation */
    const handleCreateNft = async () => {

        if (!selectedImage || !nftName || !nftDescription || !selectedCollection) {
            showSnackbar('Please fill in all required fields', 'error');
            return;
        }

        // Validate selected image file type and size
        if (selectedImage) {
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(selectedImage.type)) {
                showSnackbar('Please upload only JPEG, JPG, or PNG files', 'error');
                return;
            }

            // Check file size (25MB limit)
            const maxSizeInBytes = 25 * 1024 * 1024; // 25MB in bytes
            if (selectedImage.size > maxSizeInBytes) {
                showSnackbar('File size should not exceed 25MB', 'error');
                return;
            }
        }

        const contract = await getBlockChainContract();
        const account = metaMask?.account;
        if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (account === undefined || account === null) {
            showSnackbar('Please connect MetaMask first', 'error');
            return;
        }

        setLoading(true);

        // Upload image to IPFS
        const imageIpfsURI = await uploadToIPFS(selectedImage);
        if (!imageIpfsURI) {
            showSnackbar('Failed to upload image to IPFS', 'error');
            return;
        }

        try {


            // Create metadata object
            const metadata = {
                name: nftName,
                description: nftDescription,
                image: imageIpfsURI,
                collection: selectedCollection, // Ensure we're passing the collectionId
            };

            // Upload metadata to IPFS
            const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
            const metadataFile = new File([metadataBlob], 'metadata.json');
            const metadataIpfsURI = await uploadToIPFS(metadataFile);

            if (metadataIpfsURI) {
                // Estimate gas for the transaction
                const estimatedGas = await contract.methods
                    .createNFT(metadataIpfsURI, selectedCollection, '0x850a7C982a8A70927F9D497696a0E63eAcDf6b56')
                    .estimateGas({ from: metaMask?.account });

                // Create NFT on blockchain
                await new Promise((resolve, reject) => {
                    console.log('Creating NFT on blockchain...');
                    contract.methods.createNFT(metadataIpfsURI, selectedCollection, '0x850a7C982a8A70927F9D497696a0E63eAcDf6b56')
                        .send({ from: metaMask?.account, gas: estimatedGas.toString() })
                        .on('transactionHash', (hash) => {
                            //console.log('Transaction Hash:', hash);
                            showSnackbar('Transaction submitted. Please wait...', 'info');
                        })
                        .on('receipt', (receipt) => {
                            const createdNft = receipt;
                            //console.log('NFT Created:', createdNft);
                            showSnackbar('NFT created successfully', 'success');
                            // Reset form
                            setSelectedImage(null);
                            setImagePreview(null);
                            setNftName('');
                            setNftDescription('');
                            setSelectedCollection('');
                            // Navigate to the route after a short delay to let user see the success message
                            setTimeout(() => {
                                router.push('/finance-hub/my-nfts');
                            }, 1500); // 1.5 second delay



                        })
                        .on('error', (error) => {
                            console.error('Blockchain Error:', error);

                            if (error.code === 4001) {
                                showSnackbar('Transaction rejected by the user', 'error');
                            } else {
                                showSnackbar(`Error creating NFT: ${error.message}`, 'error');
                            }
                            reject(error);
                        })
                        .catch((error) => {
                            console.error('Transaction Error:', error);

                            if (error instanceof Error) {
                                if ('code' in error && (error as EthereumError).code === 4001) {
                                    showSnackbar('Transaction rejected by the user', 'error');
                                } else {
                                    showSnackbar(`Unexpected error: ${error.message}`, 'error');
                                }
                            } else {
                                showSnackbar('An unexpected error occurred', 'error');
                            }

                            reject(error);
                        });
                });
            } else {
                throw new Error('Failed to upload metadata to IPFS');
            }


        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // Collection image upload handler
    const handleCollectionImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (25MB limit)
            if (file.size > 25 * 1024 * 1024) {
                showSnackbar('File size should not exceed 25MB', 'error');
                return;
            }

            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                showSnackbar('Please upload only JPEG, JPG, or PNG files', 'error');
                return;
            }

            setSelectedCollectionImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setCollectionImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle collection creation
    const handleCreateCollection = async () => {
        if (!selectedCollectionImage || !collectionName || !collectionDescription) {
            showSnackbar('Please fill in all required fields', 'error');
            return;
        }
        // Validate selected image file type and size
        if (selectedCollectionImage) {
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(selectedCollectionImage.type)) {
                showSnackbar('Please upload only JPEG, JPG, or PNG files', 'error');
                return;
            }

            // Check file size (25MB limit)
            const maxSizeInBytes = 25 * 1024 * 1024; // 25MB in bytes
            if (selectedCollectionImage.size > maxSizeInBytes) {
                showSnackbar('File size should not exceed 25MB', 'error');
                return;
            }
        }

        const contract = await getBlockChainContract();
        const account = metaMask?.account;
        if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (account === undefined || account === null) {
            showSnackbar('Please connect MetaMask first', 'error');
            return;
        }

        setLoading(true);
        const imageIpfsURI = await uploadToIPFS(selectedCollectionImage);
        if (!imageIpfsURI) {
            showSnackbar('Failed to upload image to IPFS', 'error');
            return;
        }

        try {
            const estimatedGas = await contract.methods
                .createCollection(collectionName, collectionDescription, imageIpfsURI)
                .estimateGas({ from: metaMask?.account });
            await new Promise((resolve, reject) => {
                console.log('in promise')
                contract.methods
                    .createCollection(collectionName, collectionDescription, imageIpfsURI)
                    .send({ from: metaMask?.account, gas: estimatedGas.toString(), })
                    .on('transactionHash', (hash) => {
                        console.log('Transaction Hash:', hash);
                    })
                    .on('receipt', (receipt) => {
                        const colRes = receipt;
                        console.log('Collection Response', colRes)
                        setCreateCollectionOpen(false);
                        showSnackbar('Collection created successfully!', 'success');
                        if (metaMask?.account) {
                            getAllCollections(metaMask.account);
                        }

                        // Reset form
                        setSelectedCollectionImage(null);
                        setCollectionImagePreview(null);
                        setCollectionName('');
                        setCollectionDescription('');

                    })
                    .on('error', (error) => {
                        console.log(error)
                        // showToast('error', 'Error Creating collection:' + error);
                        if ('code' in error && (error as EthereumError).code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else {
                            showSnackbar(`Unexpected error: ${error.message}`, 'error');
                        }
                        reject(error);
                    }).catch((error) => {
                        console.error('Failed to render currency by broker', error);
                        if (error instanceof Error) {
                            showSnackbar(error.message, 'error');
                        } else {
                            showSnackbar('An unexpected error occurred', 'error');
                        }
                        reject(error);
                    });
            });


        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

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
                    h5: {
                        fontWeight: 600,
                        fontSize: '1.5rem',
                        lineHeight: 1.3,
                        letterSpacing: '-0.015em',
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
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 8,
                                padding: '10px 24px',
                            },
                        },
                    },
                    MuiTextField: {
                        styleOverrides: {
                            root: {
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 8,
                                },
                            },
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                borderRadius: 16,
                                boxShadow: mode === 'light'
                                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                    : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                            },
                        },
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
        window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode }));
    };

    /* method defination for checking metatmask connection & login to metatmask functionality */
    const checkMetaMaskConnection = async (): Promise<void> => {
        if (typeof window === 'undefined' || !window.ethereum) {
            console.error('🦊 MetaMask is not installed');
            showSnackbar('MetaMask is not installed', 'error');
            setInitialLoading(false);
            return;
        }

        try {
            let accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[] | undefined;

            if (!accounts || accounts.length === 0) {
                accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[] | undefined;
            }

            if (accounts && accounts.length > 0) {
                const account = accounts[0];
                setMetaMask({ account });
                console.log('✅ MetaMask connected:', account);
                // After connecting, fetch collections
                await getAllCollections(account);
            } else {
                console.warn('⚠️ No MetaMask accounts found.');
                showSnackbar('No MetaMask accounts found', 'error');
            }
        } catch (error) {
            console.error('🛑 MetaMask connection failed:', error);
            showSnackbar('MetaMask connection failed', 'error');
        } finally {
            setInitialLoading(false);
        }
    };

    /* method defination for get all collection */
    const getAllCollections = async (account : string) => {
        const contract = await getBlockChainContract();

        if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        }

        if (!account) {
            showSnackbar('Please connect MetaMask first', 'error');
            return;
        }

        try {
            setLoading(true);
            const query = `
            {
              collections {
                id
                name
                description
                backgroundImage
                creator
              }
            }
          `;

            const response = await fetch('https://api.studio.thegraph.com/query/108358/paybito_nft_marketplace/v0.0.1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            const { data } = await response.json();
            const allCollections = data.collections;
            console.log('All Collections => ', allCollections);
            console.log('Account => ', account);

            // Filter collections where creator matches the account
            const myCollections = allCollections.filter(
                (collection: Collection) => collection.creator.toLowerCase() === account.toLowerCase()
            );
            console.log('My Collections => ', myCollections);
            setCollections(myCollections);

        } catch (error) {
            console.error('Failed to fetch collections', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // Check MetaMask connection on mount
    useEffect(() => {
        const initializeApp = async () => {
            const account = metaMask?.account;

            if (!account) {
                // No account in context, check MetaMask
                await checkMetaMaskConnection();
            } else {
                // Account exists in context, fetch collections
                console.log('✅ Using existing MetaMask account:', account);
                await getAllCollections(account);
                setInitialLoading(false);
            }
        };

        initializeApp();
    }, []); // Empty dependency array - only run once on mount

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
                    pt: 10,
                    pb: 6,
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
                    {/* Create NFT Section */}
                    <Card
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: 4,
                            p: { xs: 3, sm: 4, md: 5 },
                            mb: { xs: 3, sm: 4 },
                            boxShadow: mode === 'light'
                                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                : '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                            border: mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
                        }}
                    >
                        {/* Back Button and Title */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                            <IconButton
                                onClick={() => router.back()}
                                sx={{
                                    bgcolor: mode === 'light' ? 'grey.100' : 'grey.800',
                                    '&:hover': {
                                        bgcolor: mode === 'light' ? 'grey.200' : 'grey.700',
                                    },
                                }}
                            >
                                <ArrowBack />
                            </IconButton>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: theme.palette.text.primary
                                }}
                            >
                                Create NFT
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 4,
                                alignItems: 'flex-start'
                            }}
                        >
                            {/* Image Upload Section */}
                            <Box sx={{ flex: { xs: '1', md: '1' }, minWidth: { xs: '100%', md: '45%' } }}>
                                <Box
                                    sx={{
                                        border: `2px dashed ${theme.palette.divider}`,
                                        borderRadius: 3,
                                        p: 4,
                                        textAlign: 'center',
                                        bgcolor: mode === 'light' ? 'grey.50' : 'grey.900',
                                        minHeight: { xs: 200, md: 300 },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderColor: theme.palette.primary.main,
                                            bgcolor: mode === 'light' ? 'grey.100' : 'grey.800',
                                        }
                                    }}
                                >
                                    {imagePreview ? (
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <img
                                                src={imagePreview}
                                                alt="NFT Preview"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                    objectFit: 'contain',
                                                    borderRadius: 8
                                                }}
                                            />
                                            <IconButton
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                    color: 'white',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                                                    }
                                                }}
                                                onClick={() => {
                                                    setSelectedImage(null);
                                                    setImagePreview(null);
                                                }}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <ImageIcon
                                                sx={{
                                                    fontSize: 64,
                                                    color: theme.palette.text.secondary,
                                                    mb: 2
                                                }}
                                            />
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: theme.palette.text.secondary,
                                                    mb: 2,
                                                    fontWeight: 500
                                                }}
                                            >
                                                Upload Image
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: theme.palette.text.secondary,
                                                    mb: 2
                                                }}
                                            >
                                                (File size should not exceed 25MB)
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                component="label"
                                                startIcon={<CloudUpload />}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 2
                                                }}
                                            >
                                                Choose File
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept="image/jpeg,image/jpg,image/png"
                                                    onChange={handleImageUpload}
                                                />
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        mt: 2,
                                        color: theme.palette.text.secondary
                                    }}
                                >
                                    Upload only jpeg, jpg and png file type.
                                </Typography>
                            </Box>

                            {/* Form Section */}
                            <Box sx={{ flex: { xs: '1', md: '1' }, minWidth: { xs: '100%', md: '45%' } }}>
                                <Stack spacing={3}>
                                    {/* Collection Selection */}
                                    <Box>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                mb: 1,
                                                fontWeight: 600,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Collection *
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <FormControl fullWidth>
                                                <Select
                                                    value={selectedCollection}
                                                    onChange={(e) => setSelectedCollection(e.target.value)}
                                                    displayEmpty
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value="">
                                                        <em>Select Collection</em>
                                                    </MenuItem>
                                                    {collections.map((collection) => (
                                                        <MenuItem key={collection.id} value={collection.id}>
                                                            {collection.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={() => setCreateCollectionOpen(true)}
                                                sx={{
                                                    minWidth: 'fit-content',
                                                    whiteSpace: 'nowrap',
                                                    borderRadius: 2
                                                }}
                                            >
                                                Create Collection
                                            </Button>
                                        </Box>
                                    </Box>

                                    {/* Name Field */}
                                    <Box>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                mb: 1,
                                                fontWeight: 600,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Name *
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Name your NFT"
                                            value={nftName}
                                            onChange={(e) => setNftName(e.target.value)}
                                            sx={{ borderRadius: 2 }}
                                        />
                                    </Box>

                                    {/* Description Field */}
                                    <Box>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                mb: 1,
                                                fontWeight: 600,
                                                color: theme.palette.text.primary
                                            }}
                                        >
                                            Description *
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            placeholder="Enter a description"
                                            value={nftDescription}
                                            onChange={(e) => setNftDescription(e.target.value)}
                                            sx={{ borderRadius: 2 }}
                                        />
                                    </Box>

                                    {/* Save Button */}
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleCreateNft}
                                        disabled={loading || !selectedImage || !nftName || !nftDescription || !selectedCollection}
                                        sx={{
                                            mt: 3,
                                            py: 1.5,
                                            borderRadius: 2,
                                            fontWeight: 600,
                                            textTransform: 'none'
                                        }}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Save'}
                                    </Button>
                                </Stack>
                            </Box>
                        </Box>
                    </Card>
                </Container>
            </Box>

            {/* Create Collection Dialog */}
            <Dialog
                open={createCollectionOpen}
                onClose={() => setCreateCollectionOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Create New Collection
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 3,
                            mt: 1
                        }}
                    >
                        {/* Collection Image Upload Section */}
                        <Box sx={{ flex: { xs: '1', sm: '1' }, minWidth: { xs: '100%', sm: '40%' } }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    mb: 2,
                                    fontWeight: 600,
                                    color: theme.palette.text.primary
                                }}
                            >
                                Collection Image *
                            </Typography>
                            <Box
                                sx={{
                                    border: `2px dashed ${theme.palette.divider}`,
                                    borderRadius: 3,
                                    p: 3,
                                    textAlign: 'center',
                                    bgcolor: mode === 'light' ? 'grey.50' : 'grey.900',
                                    minHeight: { xs: 180, sm: 220 },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        bgcolor: mode === 'light' ? 'grey.100' : 'grey.800',
                                    }
                                }}
                            >
                                {collectionImagePreview ? (
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <img
                                            src={collectionImagePreview}
                                            alt="Collection Preview"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain',
                                                borderRadius: 8
                                            }}
                                        />
                                        <IconButton
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                                                }
                                            }}
                                            onClick={() => {
                                                setSelectedCollectionImage(null);
                                                setCollectionImagePreview(null);
                                            }}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Collections
                                            sx={{
                                                fontSize: 48,
                                                color: theme.palette.text.secondary,
                                                mb: 1.5
                                            }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: theme.palette.text.secondary,
                                                mb: 1.5,
                                                fontWeight: 500
                                            }}
                                        >
                                            Upload Collection Image
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<CloudUpload />}
                                            size="small"
                                            sx={{
                                                textTransform: 'none',
                                                borderRadius: 2
                                            }}
                                        >
                                            Choose File
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/jpeg,image/jpg,image/png"
                                                onChange={handleCollectionImageUpload}
                                            />
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    mt: 1,
                                    color: theme.palette.text.secondary,
                                    display: 'block'
                                }}
                            >
                                Recommended: Upload only jpeg, jpg and png file type. (File size should not exceed 25MB)
                            </Typography>
                        </Box>

                        {/* Collection Form Section */}
                        <Box sx={{ flex: { xs: '1', sm: '1' }, minWidth: { xs: '100%', sm: '55%' } }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            mb: 1.5,
                                            fontWeight: 600,
                                            color: theme.palette.text.primary
                                        }}
                                    >
                                        Collection Name *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="Enter collection name"
                                        value={collectionName}
                                        onChange={(e) => setCollectionName(e.target.value)}
                                        sx={{ borderRadius: 2 }}
                                    />
                                </Box>

                                <Box>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            mb: 1.5,
                                            fontWeight: 600,
                                            color: theme.palette.text.primary
                                        }}
                                    >
                                        Description *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        placeholder="Enter collection description"
                                        multiline
                                        rows={4}
                                        value={collectionDescription}
                                        onChange={(e) => setCollectionDescription(e.target.value)}
                                        sx={{ borderRadius: 2 }}
                                    />
                                </Box>

                                {/* Action Buttons */}
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                                    <Button
                                        onClick={() => {
                                            setCreateCollectionOpen(false);
                                            // Reset form
                                            setSelectedCollectionImage(null);
                                            setCollectionImagePreview(null);
                                            setCollectionName('');
                                            setCollectionDescription('');
                                        }}
                                        variant="outlined"
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        disabled={!selectedCollectionImage || !collectionName || !collectionDescription || loading}
                                        onClick={handleCreateCollection}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Create Collection
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

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

export default FinanceHubNftCreatePage;