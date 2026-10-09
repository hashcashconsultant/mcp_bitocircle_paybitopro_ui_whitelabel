'use client'
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { createPortal } from 'react-dom';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    IconButton,
    Alert,
    useTheme,
    useMediaQuery,
    alpha,
    Snackbar,
    CircularProgress,
    createTheme,
} from '@mui/material'
import {
    Close,
    AccountBalanceWallet as WalletIcon,
    SwapHoriz as SwapIcon, // 🔥 Added swap icon for conversion
} from '@mui/icons-material'
import axios from 'axios';
import { getBitoHubUserInfo, getBitoDollarTxnCharge } from '../services/CoreDataService';

interface BitoDollarConvertContentProps {
    assetId: string;
    assetCode: string;
    balance: string;
    themeMode?: 'light' | 'dark';
    onConversionSuccess?: () => void;
}

interface Asset {
    action: string;
    closingBalance: number;
    currencyActivationStatus: number;
    currencyCode: string;
    currencyId: number;
    currencyName: string;
    currencyType: number;
    customerId: number;
    disabledDepositByCountry: number;
    disabledTradeByCountry: number;
    disabledWithdrawByCountry: number;
    holdingInUsd: number;
    isCrossMargin: number;
    isDeposit: number;
    isFund: number;
    isIsoMargin: number;
    isWithdraw: number;
    lastPrice: string;
    marginType: number;
    memoRequired: number;
    parentId: number | null;
    receiveAccess: number;
    roc: number;
    sendAccess: number;
    totalBalance: number;
    totalBuy: number;
    totalSell: number;
    uuid: string | null;
    walletType: string | null;
}

interface BalanceResponse {
    error: {
        error_data: number
        error_msg: string
    },
    userBalanceList: Asset[],
    totalCount: number;
}

interface ConversionResponse {
    message: string,
    success: boolean,
    returnId: number;
}

interface MarketPriceResponse {
    marketPrice: number;
    error: {
        error_data: number;
        error_msg: string;
    };
}

const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';

const BitoDollarConvertContent: React.FC<BitoDollarConvertContentProps> = ({
    assetId,
    assetCode,
    balance,
    themeMode,
    onConversionSuccess
}) => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const mode = themeMode || (prefersDarkMode ? 'dark' : 'light');
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
    const [mounted, setMounted] = useState(false);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: {
                        main: '#1e40af',
                        light: '#42a5f5',
                        dark: '#1e40af',
                        contrastText: '#ffffff',
                    },
                    secondary: {
                        main: '#dc004e',
                        light: '#f5325b',
                        dark: '#9a0036',
                        contrastText: '#ffffff',
                    },
                    background: {
                        default: mode === 'light' ? '#f5f5f5' : '#121212',
                        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
                    },
                    text: {
                        primary: mode === 'light' ? '#212121' : '#ffffff',
                        secondary: mode === 'light' ? '#757575' : '#b0b0b0',
                    },
                },
                typography: {
                    fontFamily: [
                        '-apple-system',
                        'BlinkMacSystemFont',
                        '"Segoe UI"',
                        'Roboto',
                        '"Helvetica Neue"',
                        'Arial',
                        'sans-serif',
                    ].join(','),
                },
                shape: {
                    borderRadius: 8,
                },
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                textTransform: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                            },
                        },
                    },
                },
            }),
        [mode]
    );

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // State management
    const [convertModalOpen, setConvertModalOpen] = useState(false)
    const [cryptoAmount, setCryptoAmount] = useState('')
    const [usdbAmount, setUsdbAmount] = useState('')
    const [marketPrice, setMarketPrice] = useState<number>(0);
    const [userUuid, setUserUuid] = useState<string>('');
    const [assetBalance, setAssetBalance] = useState<number>(0);
    const [txnCharge, setTxnCharge] = useState<number>(0);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const getUserDetails = async () => {
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
            setUserUuid(userObj.uuid);
            await getBitoDollarBalance(resp.uuid);
        } catch (error) {
            console.error('Failed to get user details', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
        }
    }

    const getBitoDollarBalance = async (uuid: string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            userUuid: uuid,
        }
        try {
            setLoading(true);
            const response = await axios.post<BalanceResponse>(
                `${API_BASE_URL}/finance-hub/getUserBalance`,
                payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );
            const error = response.data.error;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            const userBalanceList = response.data.userBalanceList as Asset[];
            const asset = userBalanceList.find((asset: Asset) => asset.currencyCode === assetCode);

            setAssetBalance(asset?.closingBalance || 0);

            if (!asset || asset.closingBalance === 0) {
                showSnackbar(`You do not have sufficient balance to convert`, 'error');
                return;
            }

            const price = await getMarketPrice(assetCode);
            setMarketPrice(price ?? 1);
            setConvertModalOpen(true);
        } catch (error) {
            console.error('Failed to get balance', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false);
        }
    }

    const handleCryptoAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        if (value === '') {
            setCryptoAmount('');
            setUsdbAmount('');
            setTxnCharge(0);
            return;
        }

        const cleanedValue = value
            .replace(/[^0-9.]/g, '')
            .replace(/(\.).*?\./g, '$1');

        setCryptoAmount(cleanedValue);

        if (cleanedValue && parseFloat(cleanedValue) > 0 && marketPrice > 0) {
            const totalPrice = parseFloat(cleanedValue) / marketPrice;
            setUsdbAmount(totalPrice.toFixed(6));

            try {
                const charge = await getBitoDollarTxnCharge(cleanedValue, marketPrice);
                setTxnCharge(charge?.data?.txnCharge || 0);
            } catch (error) {
                console.error('Failed to get charges', error);
            }
        } else {
            setUsdbAmount('');
            setTxnCharge(0);
        }
    }

    const getMarketPrice = async (base: string) => {
        try {
            const payload = {
                "currency": 'USDB',
                "baseCurrency": base.toUpperCase(),
                "action": 2
            }
            const response = await axios.post<MarketPriceResponse>(
                `https://accounts.paybito.com/api/home/marketPrice`,
                payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );
            const error = response.data.error;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return 0;
            }
            return response.data.marketPrice;
        } catch (error) {
            console.error('Failed to get market price', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
            return 0;
        }
    }

    const handleConvertButtonClick = async () => {
        await getUserDetails();
    }

    const processConvertion = async () => {
        try {
            setLoading(true);
            const payload = {
                "adminUser": localStorage.getItem('uuid'),
                "currencyId": assetId,
                "amount": cryptoAmount,
                "walletTag": 'EXCHANGE'
            }

            const response = await axios.post<ConversionResponse>(
                `${API_BASE_URL}/finance-hub/convert/cryptoToBitodollar`,
                payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );

            const success = response.data.success;
            if (!success) {
                showSnackbar(response.data.message, 'error');
                return;
            }

            showSnackbar(`${assetCode} converted to B$ successfully`, 'success');
            setConvertModalOpen(false);
            setCryptoAmount('');
            setUsdbAmount('');
            setTxnCharge(0);

            if (onConversionSuccess) {
                onConversionSuccess();
            }
        } catch (error) {
            console.error('Failed to convert', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
        }
    }

    const showSnackbar = async (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = async () => {
        setSnackbarOpen(false);
    };

    const SnackbarComponent = (
        <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 9999,
            }}
        >
            <Alert
                onClose={handleCloseSnackbar}
                severity={snackbarSeverity}
                sx={{
                    width: '100%',
                    minWidth: { xs: '280px', sm: '320px' },
                    maxWidth: '400px',
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 24px rgba(0,0,0,0.5)'
                        : '0 8px 24px rgba(0,0,0,0.15)',
                    borderRadius: 2,
                }}
                variant="filled"
            >
                {snackbarMessage}
            </Alert>
        </Snackbar>
    );

    return (
        <Fragment>
            <Button
                disabled={parseFloat(balance) === 0 || loading}
                variant="contained"
                fullWidth={isMobile}
                onClick={handleConvertButtonClick}
                startIcon={loading ? null : <SwapIcon />} // 🔥 Added icon
                sx={{
                    background: parseFloat(balance) === 0
                        ? 'linear-gradient(135deg, #93c5fd 0%, #dbeafe 100%)'
                        : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    py: 1,
                    px: 2,
                    borderRadius: 2,
                    whiteSpace: 'nowrap',
                    boxShadow: parseFloat(balance) === 0
                        ? 'none'
                        : `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        background: parseFloat(balance) === 0
                            ? 'linear-gradient(135deg, #93c5fd 0%, #dbeafe 100%)'
                            : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                        transform: parseFloat(balance) === 0 ? 'none' : 'translateY(-2px)',
                        boxShadow: parseFloat(balance) === 0
                            ? 'none'
                            : `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    '&:disabled': {
                        color: 'white',
                        opacity: 0.7,
                        cursor: 'not-allowed',
                    },
                }}
            >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Convert to BitoDollar (B$)'} {/* 🔥 Updated text */}
            </Button>

            {/* Convert Modal */}
            <Dialog
                open={convertModalOpen}
                onClose={() => setConvertModalOpen(false)}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 3,
                        background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)'
                            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    }
                }}
            >
                <DialogTitle sx={{
                    pb: 1,
                    pt: 3,
                    px: { xs: 2, sm: 3 }
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                            }}>
                                <Typography sx={{ color: 'white', fontSize: 24 }}>B$</Typography>
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                    lineHeight: 1.2
                                }}>
                                    Convert to BitoDollar
                                </Typography>
                                <Typography variant="caption" sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                    mt: 0.5
                                }}>
                                    Exchange {assetCode} for B$
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            onClick={() => {
                                setConvertModalOpen(false);
                                setCryptoAmount('');
                                setUsdbAmount('');
                                setTxnCharge(0);
                            }}
                            sx={{
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.error.main, 0.2),
                                }
                            }}
                        >
                            <Close sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{
                    px: { xs: 2, sm: 3 },
                    pb: { xs: 2, sm: 3 },
                    pt: 2
                }}>
                    {/* Available Balance Card */}
                    <Box sx={{
                        background: theme.palette.mode === 'dark'
                            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`
                            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.12)} 100%)`,
                        border: `1.5px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: 2.5,
                        p: { xs: 2, sm: 2.5 },
                        mb: 3,
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <WalletIcon sx={{
                                        color: 'primary.main',
                                        fontSize: { xs: 18, sm: 20 }
                                    }} />
                                    <Typography variant="body2" sx={{
                                        color: 'text.secondary',
                                        fontWeight: 500,
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                    }}>
                                        Available Balance
                                    </Typography>
                                </Box>
                                <Typography variant="h5" sx={{
                                    fontWeight: 700,
                                    color: 'primary.main',
                                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: 1
                                }}>
                                    {assetBalance || 0}
                                    <Typography component="span" variant="body1" sx={{
                                        fontWeight: 600,
                                        color: 'text.secondary',
                                        fontSize: { xs: '0.9rem', sm: '1rem' }
                                    }}>
                                        {assetCode}
                                    </Typography>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* FROM Field */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" sx={{
                            color: 'text.secondary',
                            mb: 1,
                            display: 'block',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.7rem'
                        }}>
                            From
                        </Typography>
                        <TextField
                            fullWidth
                            label={`Enter ${assetCode} Amount`}
                            type="number"
                            value={cryptoAmount}
                            onChange={handleCryptoAmount}
                            placeholder="0.00"
                            InputProps={{
                                startAdornment: (
                                    <Box sx={{
                                        mr: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        ml: -0.5
                                    }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            {assetCode}
                                        </Typography>
                                    </Box>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? alpha(theme.palette.background.paper, 0.5)
                                        : 'background.paper',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderWidth: 2,
                                    }
                                },
                                '& input': {
                                    py: 2,
                                }
                            }}
                        />
                    </Box>

                    {/* Conversion Arrow */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        my: 2,
                        position: 'relative'
                    }}>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.mode === 'dark'
                                ? alpha(theme.palette.background.paper, 0.8)
                                : 'background.paper',
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                            zIndex: 1
                        }}>
                            <Typography sx={{
                                color: 'primary.main',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                transform: 'rotate(90deg)'
                            }}>
                                ⇄
                            </Typography>
                        </Box>
                        <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.primary.main, 0.3)} 50%, transparent 100%)`,
                            transform: 'translateY(-50%)',
                        }} />
                    </Box>

                    {/* TO Field */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" sx={{
                            color: 'text.secondary',
                            mb: 1,
                            display: 'block',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.7rem'
                        }}>
                            To (Estimated)
                        </Typography>
                        <TextField
                            fullWidth
                            label="You'll Receive"
                            type="text"
                            value={usdbAmount}
                            disabled
                            placeholder="0.00"
                            InputProps={{
                                startAdornment: (
                                    <Box sx={{
                                        mr: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        ml: -0.5
                                    }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                            B$
                                        </Typography>
                                    </Box>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? alpha(theme.palette.background.paper, 0.3)
                                        : alpha(theme.palette.background.paper, 0.5),
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    '&.Mui-disabled': {
                                        '& fieldset': {
                                            borderColor: alpha(theme.palette.divider, 0.3),
                                        }
                                    }
                                },
                                '& input': {
                                    py: 2,
                                }
                            }}
                        />
                    </Box>

                    {/* Info Box */}
                    {cryptoAmount && usdbAmount && parseFloat(cryptoAmount) > 0 && (
                        <Box sx={{
                            backgroundColor: alpha(theme.palette.info.main, 0.08),
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            borderRadius: 2,
                            p: { xs: 2, sm: 2.5 },
                            mb: 3,
                        }}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 2.5, sm: 3 },
                                alignItems: { xs: 'stretch', sm: 'center' }
                            }}>
                                {/* Conversion Rate */}
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    minWidth: 0
                                }}>
                                    <Box sx={{
                                        width: { xs: 36, sm: 40 },
                                        height: { xs: 36, sm: 40 },
                                        borderRadius: '50%',
                                        backgroundColor: alpha(theme.palette.info.main, 0.15),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Typography sx={{
                                            color: 'info.main',
                                            fontSize: { xs: '0.9rem', sm: '1rem' }
                                        }}>
                                            ℹ️
                                        </Typography>
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography variant="caption" sx={{
                                            color: 'text.secondary',
                                            display: 'block',
                                            mb: 0.5,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontSize: { xs: '0.65rem', sm: '0.7rem' }
                                        }}>
                                            Conversion Rate
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 700,
                                            color: 'text.primary',
                                            fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                            lineHeight: 1.3,
                                            wordBreak: 'break-all'
                                        }}>
                                            1 {assetCode} = {(1 / marketPrice).toFixed(6)} B$
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Conversion Charges */}
                                {txnCharge > 0 && (
                                    <>
                                        <Box sx={{
                                            display: { xs: 'block', sm: 'flex' },
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Box sx={{
                                                width: { xs: '100%', sm: '1px' },
                                                height: { xs: '1px', sm: '40px' },
                                                backgroundColor: alpha(theme.palette.divider, 0.3),
                                                mx: { xs: 0, sm: 1 },
                                                my: { xs: 1, sm: 0 }
                                            }} />
                                        </Box>
                                        <Box sx={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            minWidth: 0
                                        }}>
                                            <Box sx={{
                                                width: { xs: 36, sm: 40 },
                                                height: { xs: 36, sm: 40 },
                                                borderRadius: '50%',
                                                backgroundColor: alpha(theme.palette.warning.main, 0.15),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Typography sx={{
                                                    color: 'warning.main',
                                                    fontSize: { xs: '0.9rem', sm: '1rem' }
                                                }}>
                                                    💰
                                                </Typography>
                                            </Box>
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="caption" sx={{
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mb: 0.5,
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontSize: { xs: '0.65rem', sm: '0.7rem' }
                                                }}>
                                                    Conversion Fees
                                                </Typography>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 700,
                                                    color: 'warning.main',
                                                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                                    lineHeight: 1.3
                                                }}>
                                                    {txnCharge} {assetCode}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Action Button */}
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={processConvertion}
                        disabled={!cryptoAmount || parseFloat(cryptoAmount) <= 0 || loading}
                        sx={{
                            background: !cryptoAmount || parseFloat(cryptoAmount) <= 0
                                ? theme.palette.action.disabledBackground
                                : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            color: 'white',
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            fontWeight: 700,
                            py: { xs: 1.5, sm: 1.75 },
                            borderRadius: 2,
                            boxShadow: !cryptoAmount || parseFloat(cryptoAmount) <= 0
                                ? 'none'
                                : `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                            transition: 'all 0.3s ease-in-out',
                            textTransform: 'none',
                            '&:hover': {
                                transform: !cryptoAmount || parseFloat(cryptoAmount) <= 0 ? 'none' : 'translateY(-2px)',
                                boxShadow: !cryptoAmount || parseFloat(cryptoAmount) <= 0
                                    ? 'none'
                                    : `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                            },
                            '&:disabled': {
                                color: theme.palette.action.disabled,
                            }
                        }}
                    >
                        {loading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={20} color="inherit" />
                                <span>Converting...</span>
                            </Box>
                        ) : (
                            `Convert ${assetCode} to B$`
                        )}
                    </Button>

                    {/* Disclaimer */}
                    <Typography variant="caption" sx={{
                        display: 'block',
                        textAlign: 'center',
                        color: 'text.secondary',
                        mt: 2,
                        px: 1,
                        lineHeight: 1.5
                    }}>
                        Conversion rates are calculated in real-time and may vary slightly at the time of transaction.
                    </Typography>
                </DialogContent>
            </Dialog>

            {/* Render Snackbar via Portal */}
            {mounted && typeof window !== 'undefined' && createPortal(SnackbarComponent, document.body)}
        </Fragment>
    )
}

export default BitoDollarConvertContent