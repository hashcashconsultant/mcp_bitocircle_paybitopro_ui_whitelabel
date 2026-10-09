'use client';
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import {
    Box,
    Container,
    Typography,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    Button,
    Chip,
    Paper,
    Fade,
    CircularProgress,
    Snackbar,
    Alert,
    Backdrop,
    createTheme,
    Divider,
    Avatar,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Tooltip
} from '@mui/material';

import {
    ArrowBack,
    Share,
    Favorite,
    FavoriteBorder,
    MoreVert,
    Launch,
    ContentCopy,
    Timer,
    Person,
    AccountBalanceWallet,
    LocalOffer,
    Gavel,
    Update,
    ShoppingCart,
    SwapHoriz,
    TrendingUp,
    Visibility
} from '@mui/icons-material';
import Link from 'next/link';
import { MetaMaskContext, useMetaMask } from '../contexts/MetaMaskContext';
import { CRYPTOIMAGEURL, getLocationData, getBlockChainContract, fetchCommissionRate } from '../services/CoreDataService';
import axios from 'axios';
import { MetaMaskInpageProvider } from "@metamask/providers";
import web3 from "web3";
import { useRouter } from 'next/navigation';
import { ethers } from "ethers";

// Interfaces
interface NFTDetailProps {
    nftId?: string;
}

declare global {
    interface Window {
        ethereum?: MetaMaskInpageProvider;
    }
}
interface EthereumError extends Error {
    code?: number | string;
}
interface NFTData {
    id: string;
    name: string;
    description: string;
    image: string;
    owner: string;
    creator: string;
    price: string | null;
    currency: string;
    contractAddress: string;
    tokenId: string;
    tokenURI: string;
    isForSale: boolean;
    saleExpiry?: string;
    isExpired?: boolean;
    expirationTime?: number;
    attributes: Array<{
        trait_type: string;
        value: string | number;
    }>;
    collection: {
        name: string;
        floorPrice: string;
        id: string;
        volume: string;
        description: string;
    };
    metadata: {
        name: string;
        description: string;
        image?: string | null;
        animation_url?: string | null;
        external_link?: string | null;
        external_url?: string | null;
        collection?: string | null;
    }
}

interface Offer {
    id: string;
    offerer: string;
    amount: string | bigint;
    currency: string;
    expiresAt: string | bigint;
    //status: 'active' | 'expired' | 'accepted';
    isExpired: boolean;
}

interface OfferResponse {
    0: string;        // offerer (address)
    1: bigint;        // offerAmount
    2: bigint;        // expirationTime
    offerer: string;
    offerAmount: bigint;
    expirationTime: bigint;
}

interface FloorBid {
    id: string;
    bidder: string;
    amount: string;
    currency: string;
    expiresAt: string;
}

const FinanceHubNftDetailPage: React.FC<NFTDetailProps> = ({ nftId }) => {
    const router = useRouter();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');

    // State management
    const { metaMask, setMetaMask } = useMetaMask();
    const [nft, setNft] = useState<NFTData | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [commission, setCommission] = useState<string>('0');
    const [floorBids, setFloorBids] = useState<FloorBid[]>([]);
    const [liked, setLiked] = useState(false);
    const [copied, setCopied] = useState(false);


    // Dialog states
    const [makeOfferOpen, setMakeOfferOpen] = useState(false);
    const [listForSaleOpen, setListForSaleOpen] = useState(false);
    const [updateSalePriceOpen, setUpdateSalePriceOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);

    // Form states
    const [offerAmount, setOfferAmount] = useState('');
    const [offerExpiresOn, setOfferExpiresOn] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [saleExpiresOn, setSaleExpiresOn] = useState('');
    const [transferAddress, setTransferAddress] = useState('');
    const [salePriceForUpdate, setSalePriceForUpdate] = useState('');

    // Notification states
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');

    // Mock data loading
    useEffect(() => {

        setInitialLoading(true)
        if (!nftId) {
            showSnackbar('NFT ID is missing in the URL', 'error');
            return;
        }
        getNftDetails(nftId);
        checkMetaMaskConnection();
    }, [nftId]);

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

            } else {
                console.warn('⚠️ No MetaMask accounts found.');
                showSnackbar('No MetaMask accounts found', 'error');
            }
        } catch (error) {
            console.error('🛑 MetaMask connection failed:', error);
            showSnackbar('MetaMask connection failed', 'error');
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

    /* Method definition for going back to previous page */
    const handleGoBack = () => {
        router.back();
    };

    // Helper functions
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    const handleCopyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        showSnackbar('Address copied to clipboard', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    /* Method defination for buy now functionality */
    const handleBuyNow = async () => {
        const contract = await getBlockChainContract();
        if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (metaMask?.account === null || metaMask?.account === undefined) {
            showSnackbar('Please login to metamask first', 'error');
            return;
        }
        try {
            setLoading(true);
            const estimatedGas = await contract.methods
                .buyNFT(nft?.id, nft?.contractAddress)
                .estimateGas({ from: metaMask?.account, value: nft?.price?.toString() });
            await new Promise((resolve, reject) => {
                console.log('in promise')
                contract.methods
                    .buyNFT(nft?.id, nft?.contractAddress)
                    .send({ from: metaMask?.account, value: nft?.price?.toString(), gas: estimatedGas.toString(), })
                    .on('transactionHash', (hash) => {
                        setLoading(false);
                        console.log('Transaction Hash:', hash);
                    })
                    .on('receipt', (receipt) => {
                        console.log(receipt)

                        showSnackbar('NFT purchased successfully', 'success');
                        getNftDetails(nft!.id);
                        setLoading(false);

                    }).on('error', (error) => {
                        console.error('Blockchain Error:', error);

                        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else if (error instanceof Error) {
                            showSnackbar(`Error creating NFT: ${error.message}`, 'error');
                        } else {
                            showSnackbar('An unexpected error occurred', 'error');
                        }
                        reject(error);
                    }).catch((error) => {
                        console.error('Blockchain Error:', error);

                        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else if (error instanceof Error) {
                            showSnackbar(`Error creating NFT: ${error.message}`, 'error');
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

    const handleMakeOffer = async () => {
        const contract = await getBlockChainContract();
        if (!offerAmount) {
            showSnackbar('Please enter an offer amount', 'error');
            return;
        } else if (!offerExpiresOn) {
            showSnackbar('Please enter an offer expiry date', 'error');
            return;
        } else if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (!nft?.contractAddress || !nft?.id || !await checkTokenOwnership(nft.contractAddress, nft.id)) {
            showSnackbar('You are currently not holding the NFT', 'error');
            return;
        } else if (metaMask?.account === null || metaMask?.account === undefined) {
            showSnackbar('Please login to metamask first', 'error');
            return;
        }

        try {
            setLoading(true);
            const amount = web3.utils.toWei(offerAmount, 'ether');
            const expirationTime = Math.floor(new Date(offerExpiresOn).getTime() / 1000);
            const estimatedGas = await contract.methods.makeOffer(nft?.id, offerExpiresOn, nft?.contractAddress).estimateGas({ from: metaMask?.account, value: amount });
            await new Promise((resolve, reject) => {
                contract.methods.makeOffer(nftId, expirationTime, nft.contractAddress).send({
                    from: metaMask?.account,
                    value: amount,
                    gas: estimatedGas.toString(),
                })
                    .on('transactionHash', (hash) => {
                        console.log('Transaction Hash:', hash);
                    })
                    .on('receipt', (receipt) => {
                        console.log('Receipt:', receipt);
                        setLoading(false)
                        showSnackbar(`Offer of ${offerAmount} ETH submitted successfully`, 'success');
                        setMakeOfferOpen(false);
                        setOfferAmount('');
                        getNftDetails(nft?.id)
                        resolve(receipt);
                    })
                    .on('error', (error) => {
                        setLoading(false)
                        if (error.code === 4001) {
                            console.log('Transaction rejected by user.');
                            showSnackbar("Transaction rejected by the user.", 'error');
                        } else {
                            showSnackbar('Error listing NFT for sale:' + error, 'error');
                            showSnackbar(`Unexpected error: ${error.message}`, 'error');
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

    /* Method defination for handling list for sale */
    const handleListForSale = async () => {
        if (!salePrice) {
            showSnackbar('Please enter a sale price', 'error');
            return;
        } else if (!saleExpiresOn) {
            showSnackbar('Please enter a sale expiry date', 'error');
        }
        const contract = await getBlockChainContract();
        if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        }
        if (!nft?.contractAddress || !nft?.id || !await checkTokenOwnership(nft.contractAddress, nft.id)) {
            showSnackbar('You are currently not holding the NFT', 'error');
            return;
        }
        const price = web3.utils.toWei(salePrice, 'ether');
        if (metaMask?.account === null || metaMask?.account === undefined) {
            showSnackbar('Please login to metamask first', 'error');
            return;
        }
        try {
            setLoading(true);
            const expirationTime = Math.floor(new Date(saleExpiresOn).getTime() / 1000);
            const estimatedGas = await contract.methods
                .listItemForSale(nft.id, price, expirationTime, nft.contractAddress)
                .estimateGas({ from: metaMask.account });

            await new Promise((resolve, reject) => {
                contract.methods.listItemForSale(nft.id, price, expirationTime, nft.contractAddress).send({
                    from: metaMask.account,
                    gas: estimatedGas.toString(),
                })
                    .on('transactionHash', (hash) => {
                        console.log('Transaction Hash:', hash);
                    })
                    .on('receipt', (receipt) => {
                        console.log('Receipt:', receipt);
                        showSnackbar(`NFT listed for sale at ${salePrice} ETH`, 'success');
                        setListForSaleOpen(false);
                        setSalePrice('');
                        setSaleExpiresOn('');
                        getNftDetails(nft.id);
                    })
                    .on('error', (error) => {
                        setLoading(false)
                        if (error.code === 4001) {
                            console.log('Transaction rejected by user.');
                            showSnackbar("Transaction rejected by the user.", 'error');
                        } else {
                            showSnackbar('Error listing NFT for sale:' + error, 'error');
                            showSnackbar(`Unexpected error: ${error.message}`, 'error');
                        }
                        reject(error);
                    })
                    .catch((error) => {
                        console.error('Blockchain Error:', error);

                        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else if (error instanceof Error) {
                            showSnackbar(`Error creating NFT: ${error.message}`, 'error');
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

    /* Method defination for handling delising from sa;le */
    const handleDeleteSaleListing = async () => {
        const contract = await getBlockChainContract();
        if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (!nft?.contractAddress || !nft?.id || !await checkTokenOwnership(nft.contractAddress, nft.id)) {
            showSnackbar('You are currently not holding the NFT', 'error');
            return;
        } else if (metaMask?.account === null || metaMask?.account === undefined) {
            showSnackbar('Please login to metamask first', 'error');
            return;
        }
        try {
            await contract.methods.delistItem(nft.id, nft.contractAddress).send({ from: metaMask?.account });
            showSnackbar(`NFT delisted successfully`, 'success');
            getNftDetails(nft.id);
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
    }

    /* method defination for handling transferring the NFT to a address */
    const handleTransfer = async () => {
        const contract = await getBlockChainContract();
        if (!transferAddress) {
            showSnackbar('Please enter a transfer address', 'error');
            return;
        } else if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (!nft?.contractAddress || !nft?.id || !await checkTokenOwnership(nft.contractAddress, nft.id)) {
            showSnackbar('You are currently not holding the NFT', 'error');
            return;
        } else if (metaMask?.account === null || metaMask?.account === undefined) {
            showSnackbar('Please login to metamask first', 'error');
            return;
        } else if (!ethers.isAddress(transferAddress)) {
            showSnackbar('Please provide a valid address', 'error');
            return
        }
        try {
            setLoading(true);
            await contract.methods.transferNFT(transferAddress, nft.id, nft.contractAddress).send({ from: metaMask?.account });
            showSnackbar(`Transfer initiated to ${formatAddress(transferAddress)}`, 'success');
            setTransferOpen(false);
            setTransferAddress('');
            getNftDetails(nft.id);

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

    /* Method defination for accepting offers */
    const handleAcceptOffer = async (offerAmount: string) => {
        const contract = await getBlockChainContract();
        if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (metaMask?.account === null || metaMask?.account === undefined) {
            showSnackbar('Please login to metamask first', 'error');
            return;
        }
        try {
            setLoading(true);

            const estimatedGas = await contract.methods
                .acceptOffer(nft?.id, nft?.contractAddress)
                .estimateGas({ from: metaMask.account });
            await new Promise((resolve, reject) => {
                console.log('in promise')
                contract.methods.acceptOffer(nft?.id, nft?.contractAddress)
                    .send({ from: metaMask?.account, gas: estimatedGas.toString() })
                    .on('transactionHash', (hash) => {

                        console.log('Transaction Hash:', hash);
                    })
                    .on('receipt', (receipt) => {
                        console.log(receipt)
                        showSnackbar('Offer accepted successfully', 'success');
                        getNftDetails(nft!.id);
                        resolve(receipt);
                    })
                    .on('error', (error) => {
                        setLoading(false)
                        console.error('Blockchain Error:', error);

                        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else if (error instanceof Error) {
                            showSnackbar(`Error creating NFT: ${error.message}`, 'error');
                        } else {
                            showSnackbar('An unexpected error occurred', 'error');
                        }
                        reject(error);
                    })
                    .catch((error) => {
                        setLoading(false)
                        console.error('Blockchain Error:', error);

                        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else if (error instanceof Error) {
                            showSnackbar(`Error creating NFT: ${error.message}`, 'error');
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

    /* Method defination for declined or deleting offers */
    const handleDeleteOffer = async (offerId: string) => {
        showSnackbar('Offer deleted successfully', 'success');
    };

    /* Method defination for accepting floor bid */
    const handleAcceptBid = async () => {
        const contract = await getBlockChainContract();
        if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (metaMask?.account === null || metaMask?.account === undefined) {
            showSnackbar('Please login to metamask first', 'error');
            return;
        }
        try {
            setLoading(true);
            const estimatedGas = await contract.methods
                .acceptFloorBid(nft?.id, nft?.collection?.id, nft?.contractAddress)
                .estimateGas({ from: metaMask?.account });
            await new Promise((resolve, reject) => {
                contract.methods.acceptFloorBid(nft?.id, nft?.collection?.id, nft?.contractAddress).send({
                    from: metaMask?.account,
                    gas: estimatedGas.toString(),
                })
                    .on('transactionHash', (hash) => {
                        console.log('Transaction Hash:', hash);
                        setLoading(false)
                    })
                    .on('receipt', (receipt) => {
                        console.log('Transaction Receipt:', receipt);
                        setLoading(false)
                        showSnackbar("Your floor bid has been successfully accepted", 'success');
                        getNftDetails(nft!.id) // Refresh UI data
                        resolve(receipt);
                    })
                    .on('error', (error) => {
                        setLoading(false)
                        console.error('Blockchain Error:', error);

                        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else if (error instanceof Error) {
                            showSnackbar(`Error creating NFT: ${error.message}`, 'error');
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
    }

    /* method defination for updating NFT price */
    const handleUpdateSalePrice = async () => {
        const contract = await getBlockChainContract();
        if (!salePriceForUpdate) {
            showSnackbar('Please enter a sale price', 'error');
            return;
        } else if (!contract) {
            showSnackbar('Contract is not initialized', 'error');
            return;
        } else if (metaMask?.account === null || metaMask?.account === undefined) {
            showSnackbar('Please login to metamask first', 'error');
            return;
        } else if (nft?.owner?.toLowerCase() !== metaMask?.account?.toLowerCase()) {
            showSnackbar('Only the owner can update the sale price', 'error');
            return;
        }
        const price = web3.utils.toWei(salePriceForUpdate, 'ether');
        const estimatedGas = await contract.methods.updateSalePrice(nft?.id, price, nft?.contractAddress).estimateGas({
            from: metaMask.account,
        });
        try {
            setLoading(true);
            await new Promise((resolve, reject) => {
                contract.methods.updateSalePrice(nft?.id, price, nft?.contractAddress).send({
                    from: metaMask.account,
                    gas: estimatedGas.toString(),
                })
                    .on('transactionHash', (hash) => {
                        console.log('Transaction Hash:', hash);
                    })
                    .on('receipt', (receipt) => {
                        console.log('Receipt:', receipt);
                        setLoading(false)
                        showSnackbar("Sale price updated successfully!", 'success');
                        getNftDetails(nft!.id);
                        resolve(receipt);
                    })
                    .on('error', (error) => {
                        setLoading(false)
                        console.error('Blockchain Error:', error);
                        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else if (error instanceof Error) {
                            showSnackbar(`Error creating NFT: ${error.message}`, 'error');
                        } else {
                            showSnackbar('An unexpected error occurred', 'error');
                        }
                        reject(error);
                    })
                    .catch((error) => {
                        setLoading(false)
                        console.error('Blockchain Error:', error);

                        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 4001) {
                            showSnackbar('Transaction rejected by the user', 'error');
                        } else if (error instanceof Error) {
                            showSnackbar(`Error creating NFT: ${error.message}`, 'error');
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
    }

    /* Method defination for get NFT details */
    const getNftDetails = async (nftId: string) => {
        const contract = await getBlockChainContract();
        const query = `
            {
                nft(id: "${nftId}") {
                    id
                    tokenURI
                    price
                    owner
                    creator
                    contractAddress
                    collection {
                        id
                        name
                        description
                        backgroundImage
                        creator
                        volume
                    }
                }
            }
          `;
        try {
            setLoading(true);
            const response = await fetch('https://api.studio.thegraph.com/query/108358/paybito_nft_marketplace/v0.0.1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const { data } = await response.json();
            const nftInfo = data?.nft;
            const now = BigInt(Math.floor(Date.now() / 1000));
            if (contract) {
                const floorBidData: { bidder: string; bidAmount: string; expirationTime: string } = await contract.methods.getFloorBid(nftInfo?.collection?.id).call();
                console.log('floorBidData', floorBidData);
                const isFloorBidExpired = Number(floorBidData?.expirationTime) > 0 && now > BigInt(floorBidData?.expirationTime || '0');
                let expirationTime: number = await contract.methods.getListingExpiration(nftId).call();
                expirationTime = parseInt(expirationTime.toString());

                const isListingExpired = expirationTime > 0 && now > BigInt(expirationTime);


                nftInfo.isExpired = isListingExpired;
                nftInfo.expirationTime = expirationTime;
                if (floorBidData.bidder !== '0x0000000000000000000000000000000000000000' && !isFloorBidExpired) {
                    const floorBidObj: FloorBid = {
                        id: '1', // You might want to generate or get a proper ID
                        bidder: floorBidData.bidder,
                        amount: web3.utils.fromWei(floorBidData.bidAmount.toString(), 'ether'),
                        currency: 'ETH',
                        expiresAt: floorBidData.expirationTime
                    };

                    setFloorBids([floorBidObj]);

                }
                try {
                    const metadataUrl = nftInfo.tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                    const response = await fetch(metadataUrl);
                    const metadata = await response.json();
                    nftInfo.metadata = metadata

                    // Fetch price, owner, and offer
                    if (contract) {
                        const offer = await contract.methods.getOffer(nftInfo.id).call() as OfferResponse;
                        //console.log('offer', offer)
                        const isOfferExpired = offer[2] > BigInt(0) && now > offer[2]; // Check expiration
                        const expirationTime = await contract.methods.getListingExpiration(nftInfo.id).call() as bigint;

                        const isExpired = expirationTime > BigInt(0) && now > expirationTime;
                        if (offer[0] !== '0x0000000000000000000000000000000000000000') {
                            offers.push({
                                id: '1',
                                offerer: offer[0],
                                amount: offer[1],
                                currency: 'ETH',
                                expiresAt: offer[2],
                                isExpired: isOfferExpired,
                            })
                        }
                        console.log(offers)
                    } else {
                        const offers = []
                    }
                    console.log('nftInfo', nftInfo);
                    setNft(nftInfo)
                    setOffers(offers)


                    if (nftInfo.price > 0 && nftInfo.price != null) {
                        const price = web3.utils.fromWei(nftInfo.price.toString(), 'ether');
                        const commissionRate = await fetchCommissionRate();
                        calculateCommission(price, commissionRate)
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
            setInitialLoading(false);
        }

    }

    /* Calculate commission rate */

    const calculateCommission = async (price: string, commissionRate: string | bigint) => {
        // Ensure salePrice is a number and commissionRate is properly formatted
        console.log('Price..' + price);
        const salePriceInETH = parseFloat(price); // Assuming the input is in ETH
        const commissionRateNumber = typeof commissionRate === 'string' ? parseFloat(commissionRate) : Number(commissionRate);
        const commission = (salePriceInETH * commissionRateNumber) / 100; // Calculate commission
        console.log('commission...' + commission);
        setCommission(commission.toFixed(12)); // Return commission with 12 decimal places for clarity 
    };

    /* method defination tyo check the ownership of the token */
    const checkTokenOwnership = async (contractAddress: string, tokenId: string) => {

        //let contractAddress='0x850a7C982a8A70927F9D497696a0E63eAcDf6b56';

        const graphqlQuery = `
              {
                nfts(where: { id: "${tokenId}" }) {
                  owner
                }
              }
            `
        const graphqlResponse = await fetch('https://api.studio.thegraph.com/query/108358/paybito_nft_marketplace/v0.0.1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: graphqlQuery }),
        });
        const graphqlData = await graphqlResponse.json();
        const graphOwner = graphqlData.data.nfts[0]?.owner.toLowerCase();
        console.log('Graphql Owner..', graphOwner);
        const response = await fetch(
            `https://deep-index.moralis.io/api/v2/nft/${contractAddress}/${tokenId}/owners?chain=eth`,
            {
                headers: { 'X-API-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjVlOGU2NDcyLTUyZDItNGQ0YS1hYmM3LTRkODc3OGU3MTY0OSIsIm9yZ0lkIjoiNDM5NDcxIiwidXNlcklkIjoiNDUyMTI4IiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiIzZDhjMmUwNC01YmM2LTQyMDQtYmNmOS1iOTkxZDFkYjcxYmIiLCJpYXQiOjE3NDM2Nzk1NjQsImV4cCI6NDg5OTQzOTU2NH0.mH9Y6oarw1ZQ8oq_bWCNOCYZsYaUnNk9h5IRvLDrGPM' }
            }
        );
        const data = await response.json();
        console.log(data);
        const isOwner = data.result.length > 0 && data.result[0].owner_of.toLowerCase() === graphOwner;

        if (isOwner) {
            console.log("Ownership Verified: The wallet owns this NFT.");
            return true;
        } else {
            showSnackbar("Ownership Invalid: The wallet does not own this NFT.", 'error');
            return false;
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
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (!nft) {
        return (
            <Box sx={{
                bgcolor: theme.palette.background.default,
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Typography variant="h6" color="text.secondary">
                    Trying to fetch NFT details...
                </Typography>
            </Box>
        );
    }

    return (
        <Fragment>
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.palette.background.default,
                    py: { xs: 2, sm: 4 }
                }}
            >
                <Container maxWidth="xl">
                    {/* Back Button */}
                    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                        <IconButton
                            onClick={handleGoBack}
                            sx={{
                                backgroundColor: theme.palette.mode === 'light'
                                    ? 'rgba(37, 99, 235, 0.1)'
                                    : 'rgba(96, 165, 250, 0.15)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${theme.palette.mode === 'light'
                                    ? 'rgba(37, 99, 235, 0.2)'
                                    : 'rgba(96, 165, 250, 0.2)'}`,
                                color: theme.palette.primary.main,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'light'
                                        ? 'rgba(37, 99, 235, 0.15)'
                                        : 'rgba(96, 165, 250, 0.25)',
                                    transform: 'translateX(-4px)',
                                    boxShadow: theme.palette.mode === 'light'
                                        ? '0 8px 16px rgba(37, 99, 235, 0.2)'
                                        : '0 8px 16px rgba(0, 0, 0, 0.3)',
                                },
                            }}
                        >
                            <ArrowBack />
                        </IconButton>
                    </Box>

                    {/* Main Content */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', lg: 'row' },
                            gap: { xs: 3, lg: 4 },
                        }}
                    >
                        {/* Left Column - NFT Image */}
                        <Box sx={{ flex: { xs: '1', lg: '1 1 50%' } }}>
                            <Paper
                                elevation={8}
                                sx={{
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    background: theme.palette.background.paper,
                                    p: { xs: 2, sm: 3 },
                                    height: { xs: 'auto', lg: '600px' }, // Fixed height for desktop
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: '100%',
                                        flex: 1, // Take remaining space in the flex container
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        background: theme.palette.mode === 'light'
                                            ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #42a5f5 100%)'
                                            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        minHeight: '400px', // Minimum height for the image container
                                    }}
                                >
                                    {nft?.metadata?.image ? (
                                        <img
                                            src={nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                            alt={nft.metadata.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                width: '80%',
                                                aspectRatio: '1/1',
                                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: 2,
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                backdropFilter: 'blur(20px)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <TrendingUp
                                                sx={{
                                                    fontSize: 80,
                                                    color: 'rgba(255, 255, 255, 0.8)',
                                                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {/* Action Icons */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 16,
                                            right: 16,
                                            display: 'flex',
                                            gap: 1,
                                        }}
                                    >

                                    </Box>
                                </Box>
                            </Paper>
                        </Box>

                        {/* Right Column - NFT Details */}
                        <Box sx={{ flex: { xs: '1', lg: '1 1 50%' } }}>
                            <Paper
                                elevation={8}
                                sx={{
                                    borderRadius: 4,
                                    background: theme.palette.background.paper,
                                    p: { xs: 3, sm: 4 },
                                    height: { xs: 'auto', lg: '600px' }, // Fixed height for desktop
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'auto', // Allow scrolling if content overflows
                                }}
                            >
                                {/* Header */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 700,
                                            color: theme.palette.text.primary,
                                            mb: 2,
                                            fontSize: { xs: '1.75rem', sm: '2.25rem' }
                                        }}
                                    >
                                        {nft.metadata.name}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                        <Chip
                                            icon={<Person />}
                                            label={`Owner: ${formatAddress(nft.owner)}`}
                                            variant="outlined"
                                            onClick={() => handleCopyAddress(nft.owner)}
                                            sx={{ cursor: 'pointer' }}
                                        />
                                        <Chip
                                            icon={<ContentCopy />}
                                            label={`Contract: ${formatAddress(nft.contractAddress)}`}
                                            variant="outlined"
                                            onClick={() => handleCopyAddress(nft.contractAddress)}
                                            sx={{ cursor: 'pointer' }}
                                        />
                                        <Chip
                                            icon={<Launch />}
                                            label="View on IPFS"
                                            variant="outlined"
                                            component="a"
                                            href={nft.tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                            target="_blank"
                                            clickable
                                            sx={{ cursor: 'pointer', textDecoration: 'none' }}
                                        />
                                    </Box>

                                    {/* Price Section */}
                                    {nft.price && (
                                        <Box
                                            sx={{
                                                p: 3,
                                                borderRadius: 3,
                                                background: theme.palette.mode === 'light'
                                                    ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
                                                    : 'linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                                                border: `1px solid ${theme.palette.primary.main}20`,
                                                mb: 3,
                                            }}
                                        >
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                Current Price
                                            </Typography>
                                            <Typography
                                                variant="h3"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: theme.palette.primary.main,
                                                    mb: 1,
                                                    fontSize: { xs: '2rem', sm: '2.5rem' }
                                                }}
                                            >
                                                {web3.utils.fromWei(nft.price.toString(), 'ether')} ETH
                                            </Typography>
                                            {!nft?.isExpired && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Timer fontSize="small" color="action" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Expires on {nft?.expirationTime ? new Date(nft.expirationTime * 1000).toLocaleDateString() : 'N/A'}

                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AccountBalanceWallet fontSize="small" color="action" />
                                                ️<Typography variant="body2" color="text.secondary">
                                                    {commission} ETH commission goes to MarketPlace owner
                                                </Typography>
                                            </Box>
                                            {metaMask?.account !== null && nft?.owner === metaMask?.account && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Update />}
                                                    onClick={() => setUpdateSalePriceOpen(true)}
                                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                                                >
                                                    Update Sale Price
                                                </Button>
                                            </Box>}
                                        </Box>
                                    )}

                                    {/* Description */}
                                    <Typography
                                        variant="body1"
                                        color="text.secondary"
                                        sx={{ lineHeight: 1.7, mb: 3 }}
                                    >
                                        {nft.metadata.description}
                                    </Typography>
                                </Box>

                                {/* Action Buttons */}
                                <Box sx={{ mb: 4 }}>
                                    {metaMask?.account !== null && nft?.owner !== metaMask?.account && nft?.price !== null && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>

                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<ShoppingCart />}
                                            onClick={handleBuyNow}
                                            sx={{
                                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderRadius: 2,
                                                py: 1.5,
                                            }}
                                        >
                                            Buy Now
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            size="large"
                                            startIcon={<LocalOffer />}
                                            onClick={() => setMakeOfferOpen(true)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderRadius: 2,
                                                py: 1.5,
                                            }}
                                        >
                                            Make an Offer
                                        </Button>
                                    </Stack>}

                                    {nft?.owner === metaMask?.account && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        {
                                            (nft?.price === '0' || nft?.price === null) && !nft?.isExpired ? <Button
                                                variant="outlined"
                                                startIcon={<Gavel />}
                                                onClick={() => setListForSaleOpen(true)}
                                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                                            >
                                                List for Sale
                                            </Button> : <Button
                                                variant="outlined"
                                                startIcon={<Gavel />}
                                                onClick={handleDeleteSaleListing}
                                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                                            >
                                                Delist
                                            </Button>
                                        }
                                        <Button
                                            variant="outlined"
                                            startIcon={<SwapHoriz />}
                                            onClick={() => setTransferOpen(true)}
                                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                                        >
                                            Transfer
                                        </Button>
                                    </Stack>}
                                </Box>

                            </Paper>
                        </Box>
                    </Box>

                    {/* Offers and Floor Bids Section */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', lg: 'row' },
                            gap: { xs: 3, lg: 4 },
                            mt: { xs: 2, sm: 4 },
                        }}
                    >
                        {/* Offers */}
                        <Box sx={{ flex: { xs: '1', lg: '1 1 50%' } }}>
                            <Paper
                                elevation={8}
                                sx={{
                                    borderRadius: 4,
                                    background: theme.palette.background.paper,
                                    p: { xs: 3, sm: 4 },
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Offers ({offers.length})
                                </Typography>

                                {offers.length > 0 ? (
                                    <Stack spacing={2}>
                                        {offers.map((offer) => (
                                            <Card
                                                key={offer.id}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 2,
                                                    p: 2,
                                                    background: theme.palette.background.default,
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                            Offer Price: {offer.amount} {offer.currency}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Expires on: {new Date(Number(offer.expiresAt)).toLocaleDateString()}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Offered By: {formatAddress(offer.offerer)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={offer.isExpired ? 'Expired' : 'Active'}
                                                        size="small"
                                                        color={offer.isExpired ? 'default' : 'success'}
                                                    />
                                                </Box>
                                                {metaMask?.account && nft?.owner === metaMask?.account && <Stack direction="row" spacing={1}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleAcceptOffer(web3.utils.fromWei(offer.amount.toString(), 'ether'))}
                                                        sx={{ textTransform: 'none' }}
                                                    >
                                                        Accept
                                                    </Button>
                                                    {/* <Button
                                                        variant="outlined"
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteOffer(offer.id)}
                                                        sx={{ textTransform: 'none' }}
                                                    >
                                                        Delete
                                                    </Button> */}
                                                </Stack>}
                                            </Card>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            No offers yet
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>

                        {/* Floor Bids */}
                        <Box sx={{ flex: { xs: '1', lg: '1 1 50%' } }}>
                            <Paper
                                elevation={8}
                                sx={{
                                    borderRadius: 4,
                                    background: theme.palette.background.paper,
                                    p: { xs: 3, sm: 4 },
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Floor Bids ({floorBids.length})
                                </Typography>

                                {floorBids.length > 0 ? (
                                    <Stack spacing={2}>
                                        {floorBids.map((bid) => (
                                            <Card
                                                key={bid.id}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 2,
                                                    p: 2,
                                                    background: theme.palette.background.default,
                                                }}
                                            >
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        Bid Amount: {bid.amount} {bid.currency}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Expiration: {bid.expiresAt
                                                            ? new Date(Number(bid.expiresAt) * 1000).toLocaleDateString()
                                                            : 'N/A'}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Bid From: {formatAddress(bid.bidder)}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    sx={{ textTransform: 'none' }}
                                                    onClick={handleAcceptBid}
                                                >
                                                    Accept Bid
                                                </Button>
                                            </Card>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            No floor bids available
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Make Offer Dialog */}
            <Dialog
                open={makeOfferOpen}
                onClose={() => setMakeOfferOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle>Make an Offer</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Offer Amount (ETH)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Expires on"
                        type="date"
                        fullWidth
                        variant="outlined"
                        value={offerExpiresOn}
                        onChange={(e) => setOfferExpiresOn(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setMakeOfferOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleMakeOffer} variant="contained">
                        Submit Offer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Update sale price Dialog */}
            <Dialog
                open={updateSalePriceOpen}
                onClose={() => setUpdateSalePriceOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle>Update Sale Price</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Sale Price (ETH)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={salePriceForUpdate}
                        onChange={(e) => setSalePriceForUpdate(e.target.value)}
                        sx={{ mt: 2 }}
                    />

                </DialogContent>


                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setUpdateSalePriceOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateSalePrice} variant="contained">
                        Update Price
                    </Button>
                </DialogActions>
            </Dialog>
            {/* List for Sale Dialog */}
            <Dialog
                open={listForSaleOpen}
                onClose={() => setListForSaleOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle>List for Sale</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Sale Price (ETH)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Expires on"
                        type="date"
                        fullWidth
                        variant="outlined"
                        value={saleExpiresOn}
                        onChange={(e) => setSaleExpiresOn(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>


                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setListForSaleOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleListForSale} variant="contained">
                        List NFT
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Transfer Dialog */}
            <Dialog
                open={transferOpen}
                onClose={() => setTransferOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle>Transfer NFT</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Recipient Address"
                        fullWidth
                        variant="outlined"
                        value={transferAddress}
                        onChange={(e) => setTransferAddress(e.target.value)}
                        sx={{ mt: 2 }}
                        placeholder="0x..."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setTransferOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleTransfer} variant="contained">
                        Transfer
                    </Button>
                </DialogActions>
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
        </Fragment>
    );
};

export default FinanceHubNftDetailPage;