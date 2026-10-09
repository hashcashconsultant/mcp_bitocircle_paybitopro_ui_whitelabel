'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Divider,
    Paper,
    Chip,
    IconButton,
    useTheme,
    useMediaQuery,
    alpha,
    Snackbar,
    Alert,
    Backdrop,
    CircularProgress
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    AccountBalanceWallet as WalletIcon,
    ArrowForward,
    ContentCopy,
    Security as SecurityIcon,
    Verified as VerifiedIcon,
    Preview as PreviewIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';

import axios from 'axios';


const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';


interface ApiResponse {
    bill_id?: string;
    amount_paid?: string;
    blockchain_refund_address?: string;
    exchange_rate?: string;
    created?: string;
    merchant_id?: number;
    blockchain_txn_id?: string;
    token_quantity?: number;
    payment_confirmed_status?: number;
    name?: string;
    invoice_id?: number;
    amount_to_be_paid?: number;
    product_description?: string;
    updated?: string;
    email?: string;
    currency_id?: number;
    status?: number;
    error_msg?: string;
    total_count?: number;
    error?: string;
    price?: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    organization_name: string;
}

interface MarketPriceResponse {
    error: string
    error_msg: string
    price: string
}
interface ValidateAddressResponse {
    error_msg: string;
    error: string;
}

interface OrderData {
    merchant_id: string;
    currency_id: number;
    currency: string;
    amount: string;
    fiat_amount: string;
    description: string;
    button_size: string;
    network: string;
}

interface MerchantDetails {
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    organization_name: string;
}

const FinanceHubPaymentsProceedToPaymentContent = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        email: '',
        name: '',
        cryptoRefundAddress: '',
    });

    const [merchantId, setMerchantId] = useState<string>('');
    const [currencyId, setCurrencyId] = useState<number>(0);
    const [currency, setCurrency] = useState<string>('');
    const [cryptoAmount, setCryptoAmount] = useState<string>('0');
    const [fiatAmount, setFiatAmount] = useState<string>('0');
    const [description, setDescription] = useState<string>('');
    const [buttonSize, setButtonSize] = useState<string>('');
    const [network, setNetwork] = useState<string>('');
    const [totalAmount, setTotalAmount] = useState<string>('0');
    const [quantity, setQuantity] = useState(1);
    const [encodedString, setEncodedString] = useState<string>('');

    const [addressState, setAddressState] = useState<'valid' | 'invalid' | 'blank'>('blank')


    const [merchant, setMerchant] = useState<MerchantDetails>({
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country: '',
        zip: '',
        organization_name: '',
    })

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

    useEffect(() => {
        // Parse URL parameters
        const dataParam = searchParams.get('data');
        const quantityParam = searchParams.get('quantity');

        if (dataParam) {
            try {
                // Decode base64 data
                setEncodedString(dataParam);
                const decodedData = atob(dataParam);
                const parsedData: OrderData = JSON.parse(decodedData);
                //console.log(parsedData)
                setupInvoice(parsedData)

            } catch (error) {
                console.error('Error parsing data parameter:', error);
            }
        }

        if (quantityParam) {
            setQuantity(parseInt(quantityParam, 10) || 1);
        }
    }, [searchParams]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };


    /* method defination for setting up invoice */
    const setupInvoice = async (data: OrderData) => {
        console.log(data);
        const marketPrice: string = (await getMarketPrice(data.currency)) || '0';
        const convertedCryptoPrice = (parseFloat(data.fiat_amount) / parseFloat(marketPrice)).toFixed(6)
        const totalAmount = parseFloat(convertedCryptoPrice) * quantity;
        setMerchantId(data.merchant_id);
        setCurrencyId(data.currency_id);
        setCurrency(data.currency);
        setCryptoAmount(marketPrice || '0');
        setFiatAmount(data.fiat_amount);
        setDescription(data.description);
        setButtonSize(data.button_size);
        setNetwork(data.network);
        setTotalAmount(totalAmount.toFixed(6));
        await getMerchant(data.merchant_id);
    }

    /* method defination to retrieve merchant data */
    const getMerchant = async (merchantId: string) => {
        const payload = { merchant_id: merchantId }
        try {
            setLoading(true)
            const response = await axios.post<ApiResponse[] | ApiResponse>(
                `${API_BASE_URL}/finance-hub/payments/get_merchant_address`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );

            // response.data can be an array or a single object depending on the API.
            const responseData = Array.isArray(response.data) ? response.data[0] : response.data;
            console.log(responseData);
            setMerchant(responseData as MerchantDetails);
            const marketPrice: string = (await getMarketPrice(currency)) || '0';
            const convertedCryptoPrice = (parseFloat(cryptoAmount) * parseFloat(marketPrice)).toFixed(6)

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

    /* Method defination for rendering market price */
    const getMarketPrice = async (counter: string) => {
        if (counter === '') {
            return;
        }
        try {

            const response = await axios.get<MarketPriceResponse>(`${API_BASE_URL}/finance-hub/payments/getMarketPrice?counter=${counter.toLowerCase()}`,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                })
            if (response.data.error === '1') {
                showSnackbar(response.data.error_msg, 'error');
                return;
            }
            return response.data.price;
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

    /* Method defination for handle proceed to payment click */
    const handleProceedToPayment = async () => {
        if (formData?.email === '' || formData?.name === '') {
            showSnackbar('Please provide a valid email & name', 'error');
            return;
        } else if (formData?.cryptoRefundAddress !== '') {
            const response = await checkAddress(formData?.cryptoRefundAddress.trim()) as ValidateAddressResponse[] | undefined;
            const isValid = response?.[0];
            if(isValid?.error === '1'){
                 showSnackbar('Please provide a valid crypto refund address', 'error');
                return;
            }
        }
        try {
            setLoading(true);
            const data = new URLSearchParams();
            data.append('hosted_catalog_id', '');
            data.append('merchant_id', merchantId);
            data.append('bill_id', '');
            data.append('brokerId', '');
            data.append('planId', '');
            data.append('email', formData.email);
            data.append('customer_name', formData.name);
            data.append('refund_address', formData.cryptoRefundAddress);
            data.append('data', encodedString);
            data.append('quantity', quantity.toString());
            data.append('asset_id', '0');

            const response = await axios.post(`${API_BASE_URL}/finance-hub/payments/PayNowCheckout?hosted_catalog_id=&merchant_id=${merchantId}&brokerId=&planId=&bill_id=&email=${formData.email}&customer_name=${formData.name} &refund_address=${formData.cryptoRefundAddress}&data=${encodedString}&quantity=${quantity}&asset_id=0`, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
            );
            const result = response.data as string;
            const splitArr = result.split('window.location=');
            if (splitArr.length > 1) {
                const redirectedUrl = splitArr[1].slice(0, -9);
                //console.log(redirectedUrl);
                const dataSplit = redirectedUrl.split('?data=')
                //console.log(dataSplit);
                const finalRedirectUrl = `${window.location.origin}/finance-hub/payments/invoice?data=${dataSplit[1].slice(0, -1)}`
                console.log(finalRedirectUrl);
                window.location.href = finalRedirectUrl;
            }

        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
        }
    }

    /* Method defination for handling crypto address validation */
    const handleCryptoAddress = async (address: string) => {
        handleInputChange('cryptoRefundAddress', address.trim())
        if (address.trim() === '') {
            setAddressState('blank');
            return;
        }
        const response = await checkAddress(address.trim()) as ValidateAddressResponse[] | undefined;
        const isValid = response?.[0];
        console.log(isValid);
        setAddressState(isValid ? isValid.error === '1' ? 'invalid' : 'valid' : 'blank');

    }

    /* Method defination for validating address */
    const checkAddress = async (address: string) => {
        const payload = {
            currencyid: currencyId,
            address
        }
        try {
            const response = await axios.post<ValidateAddressResponse>(`${API_BASE_URL}/finance-hub/payments/addressValidate`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                })

            return response.data;

        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)',
                py: { xs: 2, md: 4 },
                px: { xs: 2, md: 3 },
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.3) 0%, transparent 25%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.3) 0%, transparent 25%)',
                    pointerEvents: 'none',
                },
            }}
        >
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                    sx={{
                        bgcolor: 'white',
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    {/* Modern Header */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 25%, #6366f1 50%, #8b5cf6 75%, #a855f7 100%)',
                            color: 'white',
                            px: { xs: 3, md: 5 },
                            py: { xs: 4, md: 5 },
                            position: 'relative',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                                pointerEvents: 'none',
                            },
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                justifyContent: 'space-between',
                                gap: 3,
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: { xs: '1.75rem', md: '2.5rem' },
                                        mb: 1,
                                        background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        letterSpacing: '-0.025em',
                                    }}
                                >
                                    {merchant?.organization_name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <VerifiedIcon sx={{ fontSize: 18, color: '#10b981' }} />
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            opacity: 0.95,
                                            fontSize: { xs: '0.875rem', md: '1rem' },
                                            fontWeight: 500,
                                        }}
                                    >
                                        Secure Cryptocurrency Payment
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        opacity: 0.8,
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}
                                >
                                    <SecurityIcon sx={{ fontSize: 14 }} />
                                    SSL Secured • 256-bit Encryption
                                </Typography>
                            </Box>
                            <Chip
                                icon={<ReceiptIcon />}
                                label="Order"
                                sx={{
                                    bgcolor: alpha('#ffffff', 0.15),
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    px: 2,
                                    py: 0.5,
                                    height: 40,
                                    borderRadius: 3,
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    '& .MuiChip-icon': {
                                        color: 'white',
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Main Content */}
                    <Box sx={{ px: { xs: 3, md: 5 }, py: { xs: 4, md: 5 } }}>

                        {/* Modern Order Summary Section */}
                        <Box sx={{ mb: 5 }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    mb: 3,
                                    color: '#0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <ReceiptIcon />
                                </Box>
                                Order Summary
                            </Typography>

                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: '2px solid #f1f5f9',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                }}
                            >
                                {/* Table Header */}
                                <Box
                                    sx={{
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                        px: 4,
                                        py: 3,
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: 2,
                                        borderBottom: '1px solid #e2e8f0',
                                    }}
                                >
                                    <Box sx={{ flex: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                                            ITEM
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'right' } }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                                            PRICE
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' } }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                                            QUANTITY
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'right' } }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
                                            AMOUNT
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Table Content - White Background */}
                                <Box sx={{ px: 4, py: 4, bgcolor: 'white' }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            gap: 2,
                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                        }}
                                    >
                                        <Box sx={{ flex: 2 }}>
                                            <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
                                                {description}
                                            </Typography>
                                            {/*  <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.5 }}>
                                                Digital Product
                                            </Typography> */}
                                        </Box>
                                        <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'right' } }}>
                                            <Typography sx={{ color: '#475569', fontWeight: 500 }}>
                                                {parseFloat(fiatAmount).toFixed(2)} {`USD`}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' } }}>
                                            <Chip
                                                label={quantity}
                                                size="small"
                                                sx={{
                                                    bgcolor: '#f1f5f9',
                                                    color: '#475569',
                                                    fontWeight: 600,
                                                    minWidth: 40,
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'right' } }}>
                                            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                                                {parseFloat(totalAmount).toFixed(6)} {currency}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Divider sx={{ borderColor: '#e2e8f0' }} />

                                {/* Total - Updated to single line */}
                                <Box
                                    sx={{
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                        px: 4,
                                        py: 3,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        Total
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 800,
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            display: 'flex',
                                            alignItems: 'baseline',
                                            gap: 1,
                                        }}
                                    >
                                        {parseFloat(totalAmount).toFixed(6)} {currency}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>

                        {/* Layout Container for Forms and Order Total */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', lg: 'row' },
                                gap: 5,
                            }}
                        >
                            {/* Buyer Information */}
                            <Box sx={{ flex: 2 }}>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        fontWeight: 700,
                                        mb: 4,
                                        color: '#0f172a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        fontSize: { xs: '1.25rem', md: '1.5rem' },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 1,
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <PersonIcon />
                                    </Box>
                                    Buyer Information
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                    <EmailIcon sx={{ color: '#6366f1', fontSize: 22 }} />
                                                </Box>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                bgcolor: 'white',
                                                fontSize: '1rem',
                                                minHeight: '56px',
                                                '& input': {
                                                    color: '#0f172a',
                                                    padding: '16px 14px',
                                                    '&::placeholder': {
                                                        color: '#64748b',
                                                        opacity: 1,
                                                    },
                                                },
                                                '& input:-webkit-autofill': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                    transition: 'background-color 5000s ease-in-out 0s',
                                                },
                                                '& input:-webkit-autofill:hover': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                },
                                                '& input:-webkit-autofill:focus': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6366f1',
                                                    borderWidth: 2,
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6366f1',
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: '#64748b',
                                                '&.Mui-focused': {
                                                    color: '#6366f1',
                                                },
                                            },
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                    <PersonIcon sx={{ color: '#6366f1', fontSize: 22 }} />
                                                </Box>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                bgcolor: 'white',
                                                fontSize: '1rem',
                                                minHeight: '56px',
                                                '& input': {
                                                    color: '#0f172a',
                                                    padding: '16px 14px',
                                                    '&::placeholder': {
                                                        color: '#64748b',
                                                        opacity: 1,
                                                    },
                                                },
                                                '& input:-webkit-autofill': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                    transition: 'background-color 5000s ease-in-out 0s',
                                                },
                                                '& input:-webkit-autofill:hover': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                },
                                                '& input:-webkit-autofill:focus': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6366f1',
                                                    borderWidth: 2,
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6366f1',
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: '#64748b',
                                                '&.Mui-focused': {
                                                    color: '#6366f1',
                                                },
                                            },
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Network"
                                        type="text"
                                        required
                                        value={network}
                                        disabled
                                        InputProps={{
                                            startAdornment: (
                                                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                                                    <PreviewIcon sx={{ color: '#6366f1', fontSize: 22 }} />
                                                </Box>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                bgcolor: 'white',
                                                fontSize: '1rem',
                                                minHeight: '56px',
                                                '& input': {
                                                    color: '#0f172a',
                                                    padding: '16px 14px',
                                                    '&::placeholder': {
                                                        color: '#64748b',
                                                        opacity: 1,
                                                    },
                                                },

                                                // 👇 Make disabled input look same as normal
                                                '&.Mui-disabled': {
                                                    backgroundColor: 'white',
                                                    color: '#0f172a',
                                                    '& fieldset': {
                                                        borderColor: '#cbd5e1', // optional: softer border for disabled
                                                    },
                                                    '& input': {
                                                        color: '#0f172a',
                                                        WebkitTextFillColor: '#0f172a', // Fix for Chrome autofill
                                                    },
                                                },

                                                '& input:-webkit-autofill': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                    transition: 'background-color 5000s ease-in-out 0s',
                                                },
                                                '& input:-webkit-autofill:disabled': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                    transition: 'background-color 5000s ease-in-out 0s',
                                                },
                                                '& input:-webkit-autofill:hover': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                },
                                                '& input:-webkit-autofill:focus': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6366f1',
                                                    borderWidth: 2,
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6366f1',
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: '#64748b',
                                                '&.Mui-focused': {
                                                    color: '#6366f1',
                                                },
                                            },
                                        }}

                                    />

                                    <TextField
                                        fullWidth
                                        label="Crypto Refund Address (Optional)"
                                        value={formData.cryptoRefundAddress}
                                        onChange={(e) => handleCryptoAddress(e.target.value)}
                                        multiline
                                        rows={3}
                                        InputProps={{
                                            startAdornment: (
                                                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center', alignSelf: 'flex-start', mt: 1 }}>
                                                    <WalletIcon sx={{ color: '#6366f1', fontSize: 22 }} />
                                                </Box>
                                            ),
                                            endAdornment: formData.cryptoRefundAddress && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigator.clipboard.writeText(formData.cryptoRefundAddress)}
                                                    sx={{
                                                        alignSelf: 'flex-start',
                                                        mt: 1,
                                                        color: '#6366f1',
                                                        '&:hover': {
                                                            bgcolor: alpha('#6366f1', 0.1),
                                                        },
                                                    }}
                                                >
                                                    <ContentCopy fontSize="small" />
                                                </IconButton>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 3,
                                                bgcolor: 'white',
                                                fontSize: '1rem',
                                                minHeight: '80px',
                                                '& textarea': {
                                                    color: '#0f172a',
                                                    padding: '16px 14px',
                                                    '&::placeholder': {
                                                        color: '#64748b',
                                                        opacity: 1,
                                                    },
                                                },
                                                '& textarea:-webkit-autofill': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                    transition: 'background-color 5000s ease-in-out 0s',
                                                },
                                                '& textarea:-webkit-autofill:hover': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                },
                                                '& textarea:-webkit-autofill:focus': {
                                                    WebkitBoxShadow: '0 0 0 1000px white inset',
                                                    WebkitTextFillColor: '#0f172a',
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6366f1',
                                                    borderWidth: 2,
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: '#6366f1',
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: '#64748b',
                                                '&.Mui-focused': {
                                                    color: '#6366f1',
                                                },
                                            },
                                        }}
                                    />
                                    {addressState !== 'blank' && <Chip
                                        icon={addressState === 'valid' ? <VerifiedIcon /> : <CancelIcon />}
                                        label={addressState === 'valid' ? 'Valid Address' : 'Not a valid address'}
                                        color={addressState === 'valid' ? 'success' : 'error'}
                                        variant="outlined"
                                        size="small"
                                    />}
                                </Box>
                            </Box>

                            {/* Order Total Sidebar */}
                            <Box sx={{ flex: 1 }}>
                                <Paper
                                    sx={{
                                        p: 4,
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: 3,
                                        position: 'sticky',
                                        top: 20,
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    }}
                                >
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 700,
                                            mb: 4,
                                            color: '#0f172a',
                                            textAlign: 'center',
                                            fontSize: '1.5rem',
                                        }}
                                    >
                                        Order Total
                                    </Typography>

                                    <Box
                                        sx={{
                                            bgcolor: 'white',
                                            borderRadius: 3,
                                            p: 4,
                                            mb: 4,
                                            border: '2px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                color: '#64748b',
                                                mb: 2,
                                                textAlign: 'center',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Total Amount:
                                        </Typography>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: 800,
                                                textAlign: 'center',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                                                backgroundClip: 'text',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                letterSpacing: '-0.025em',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 0.5,
                                            }}
                                        >
                                            {parseFloat(totalAmount).toFixed(6)} {currency}
                                        </Typography>
                                        {fiatAmount !== '' && (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#64748b',
                                                    textAlign: 'center',
                                                    mt: 1,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                ≈ ${fiatAmount} USD
                                            </Typography>
                                        )}
                                    </Box>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleProceedToPayment}
                                        size="large"
                                        endIcon={<ArrowForward />}
                                        sx={{
                                            py: 2,
                                            borderRadius: 3,
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                                            fontWeight: 700,
                                            fontSize: '1.1rem',
                                            textTransform: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.3)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)',
                                                boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.3)',
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        Proceed to Payment
                                    </Button>

                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            textAlign: 'center',
                                            color: '#64748b',
                                            mt: 3,
                                            lineHeight: 1.6,
                                            fontWeight: 500,
                                        }}
                                    >
                                        🔒 Secure payment powered by blockchain technology
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    </Box>

                    {/* Modern Footer */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            px: { xs: 3, md: 5 },
                            py: 4,
                            borderTop: '2px solid #e2e8f0',
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#64748b',
                                textAlign: 'center',
                                lineHeight: 1.6,
                                fontWeight: 500,
                            }}
                        >
                            By proceeding with this payment, you agree to our{' '}
                            <Box component="span" sx={{ color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>
                                Terms of Service
                            </Box>{' '}
                            and{' '}
                            <Box component="span" sx={{ color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>
                                Privacy Policy
                            </Box>
                            .
                            <br />
                            All transactions are secured with industry-standard encryption and blockchain technology.
                        </Typography>
                    </Box>
                </Box>
            </Container>
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
        </Box>
    );
};

export default FinanceHubPaymentsProceedToPaymentContent;