'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import QrCode from '../components/common/QRCode';
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
    CircularProgress,
    Card,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
    QrCode as QrCodeIcon,
    AccessTime as AccessTimeIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
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

interface DataParam {
    address_line_1: string;
    address_line_2: string;
    amount: string;
    amount_to_be_paid: string;
    button_size: string;
    city: string;
    country: string;
    currency: string;
    currency_id: number;
    description: string;
    display_address_on_bill: string;
    fiat_amount: string;
    inv_address_line_1: string;
    inv_address_line_2: string;
    inv_city: string;
    inv_country: string;
    inv_state: string;
    inv_zip: string;
    invoice_id: number;
    merchant_id: number;
    network: string;
    organization_name: string;
    quantity: number;
    separate_invoice_location: string;
    state: string;
    support_email: string;
    support_phone: string;
    transaction_address: string;
    zip: string;
}

interface PaymentConfirmResponse {
    bill_id: string;
    amount_paid: string;
    blockchain_refund_address: string;
    error_msg: string;
    exchange_rate: string;
    created: string;
    merchant_id: number;
    error: string;
    blockchain_txn_id: string;
    token_quantity: number;
    payment_confirmed_status: number;
    invoice_id: number;
    amount_to_be_paid: number;
    customer_id: string;
    product_description: string;
    updated: string;
    currency_id: number;
    status: number;
}




interface WindowTimeResponse {
    error_msg: string;
    price: string;
    error: string;
}


const FinanceHubPaymentsInvoiceContent = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const searchParams = useSearchParams();


    // State management
    const [timeRemaining, setTimeRemaining] = useState(900); // NOTE: 15 minutes = 900 secs
    const [copied, setCopied] = useState(false);
    const [parsedUrlData, setParsedUrlData] = useState<DataParam | null>(null)
    const [marketPrice, setMarketPrice] = useState<string | null>(null)
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [readablePaymentState, setReadablePaymentState] = useState<string>('Awaiting Payment')
    const [paymentStatusCode, setPaymentStatusCode] = useState<number>(12);//default as 12 always
    const [paymentStatusColorType, setPaymentStatusColorType] = useState<"warning" | "success" | "error" | "info" | "default" | "primary" | "secondary">('warning')

    // Loading and notification states
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');

    // Refs for intervals
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Helper function to show snackbar
    const showSnackbar = async (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = async () => {
        setSnackbarOpen(false);
    };

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
    /* Method defination to setup the page */
    const setupInvoice = async (data: DataParam) => {
        // const derivedMarketPrice : string | null | undefined = await getMarketPrice(data.currency);
        // setMarketPrice(derivedMarketPrice ?? null);
        await getPaymentWindowTime(data?.invoice_id);
    }

    /* Method defination to get payment window time */
    const getPaymentWindowTime = async (invoiceId: number) => {
        const payload = {
            "invoice_id": invoiceId
        }
        try {
            setLoading(true)
            const response = await axios.post<WindowTimeResponse>(`${API_BASE_URL}/finance-hub/payments/GetPaymentWindowTime`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                })
            if (response.data.error === '1') {
                showSnackbar(response.data.error_msg, 'error');
                return;
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

    useEffect(() => {
        // Parse URL parameters
        const dataParam = searchParams.get('data');

        if (dataParam) {
            try {
                // Decode base64 data
                const decodedData = atob(dataParam);
                const parsedData: DataParam[] = JSON.parse(decodedData);
                console.log(parsedData[0])
                setParsedUrlData(parsedData[0]);
                setupInvoice(parsedData[0]);

            } catch (error) {
                console.error('Error parsing data parameter:', error);
            }
        }


    }, [searchParams]);

    // Timer and status check intervals
    useEffect(() => {
        // Don't start intervals if payment is already completed or no data
        if (paymentCompleted || !parsedUrlData) return;

        // Start countdown timer (every 1 second)
        timerIntervalRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev > 0) {
                    return prev - 1;
                } else {
                    // Timer expired, clear intervals
                    if (timerIntervalRef.current) {
                        clearInterval(timerIntervalRef.current);
                        timerIntervalRef.current = null;
                    }
                    if (statusCheckIntervalRef.current) {
                        clearInterval(statusCheckIntervalRef.current);
                        statusCheckIntervalRef.current = null;
                    }
                    showSnackbar('Payment window has expired', 'error');
                    return 0;
                }
            });
        }, 1000);

        // Start status check interval (every 10 seconds)
        statusCheckIntervalRef.current = setInterval(() => {
            checkInvoicePaymentStatus();
        }, 10000);

        // Initial status check
        checkInvoicePaymentStatus();

        // Cleanup function
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            if (statusCheckIntervalRef.current) {
                clearInterval(statusCheckIntervalRef.current);
                statusCheckIntervalRef.current = null;
            }
        };
    }, [parsedUrlData, paymentCompleted]);

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /* Method defination check payment status */
    const checkInvoicePaymentStatus = async () => {
        if (parsedUrlData === null) {
            return;
        }
        const payload = {
            invoice_id: parsedUrlData?.invoice_id,
        }
        try {
            setLoading(true);
            const response = await axios.post<PaymentConfirmResponse>(`${API_BASE_URL}/finance-hub/payments/get_invoice_status_paid_amount`, payload, {
                headers: {
                    //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                }
            });

            const data = response.data;
            const result: PaymentConfirmResponse = Array.isArray(data) ? data[0] : data;

            const paymentStatus: number = result?.status;
            setPaymentStatusCode(paymentStatus);
            if (paymentStatus === 12) {
                //NOTE: invoice is created, no payment has been done
                setReadablePaymentState('Awaiting Payment');
                setPaymentStatusColorType('warning');
            } else if (paymentStatus === 21) {
                //NOTE : payment is being processed, part payment done
                setReadablePaymentState(`${result.amount_paid === '' ? 0 : result.amount_paid} ${parsedUrlData?.currency} Amount paid instead of ${result.amount_to_be_paid} ${parsedUrlData?.currency}`)
                setPaymentStatusColorType('warning');
            } else if (paymentStatus === 13) {
                //NOTE : invoice overpaid. Hide payment widow and show overpayment status.
                setReadablePaymentState(`Over Payment. Payment has been processed. You have paid  ${result.amount_paid} ${parsedUrlData?.currency} instead of ${result.amount_to_be_paid} ${parsedUrlData?.currency}`)
                setPaymentStatusColorType('warning');
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                if (statusCheckIntervalRef.current) {
                    clearInterval(statusCheckIntervalRef.current);
                    statusCheckIntervalRef.current = null;
                }
            } else if (paymentStatus === 14) {
                //NOTE : invoice underpaid. Hide payment window and show underpaid status.
                setReadablePaymentState(`Under Payment. Payment has been processed. You have paid  ${result.amount_paid} ${parsedUrlData?.currency} instead of ${result.amount_to_be_paid} ${parsedUrlData?.currency}`)
                setPaymentStatusColorType('warning');
            } else if (paymentStatus === 16) {
                //NOTE : invoice success. Hide payment window and show success status.
                setReadablePaymentState(`Payment received. Payment has been processed. You have paid  ${result.amount_paid} ${parsedUrlData?.currency}`)
                setPaymentStatusColorType('success');
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                if (statusCheckIntervalRef.current) {
                    clearInterval(statusCheckIntervalRef.current);
                    statusCheckIntervalRef.current = null;
                }
            } else if (paymentStatus === 30) {
                //NOTE : invoice failed. Hide payment window and show failure status.

                setReadablePaymentState(`Payment Failed. You have not paid any coin.The payment appears to have failed. If you have made the payment and still see this message, please wait for sometime, you will receive the confirmation of your payment in your registered email.`)
                setPaymentStatusColorType('error');
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                if (statusCheckIntervalRef.current) {
                    clearInterval(statusCheckIntervalRef.current);
                    statusCheckIntervalRef.current = null;
                }
            } else if (paymentStatus === 19) {
                //NOTE : invoice success. Automatic overpayment accepted. Hide payment window and show success status.
                setReadablePaymentState(`Payment received (Over Payment). Payment has been processed. You have paid  ${result.amount_paid} ${parsedUrlData?.currency} instead of ${result.amount_to_be_paid} ${parsedUrlData?.currency}`)
                setPaymentStatusColorType('success');
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                if (statusCheckIntervalRef.current) {
                    clearInterval(statusCheckIntervalRef.current);
                    statusCheckIntervalRef.current = null;
                }

            } else if (paymentStatus === 20) {
                //NOTE : invoice success. Automatic underpayment accepted. Hide payment window and show success status.
                setReadablePaymentState(`Payment received (Under Payment). Payment has been processed. You have paid  ${result.amount_paid} ${parsedUrlData?.currency} instead of ${result.amount_to_be_paid} ${parsedUrlData?.currency}`)
                setPaymentStatusColorType('success');
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                if (statusCheckIntervalRef.current) {
                    clearInterval(statusCheckIntervalRef.current);
                    statusCheckIntervalRef.current = null;
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
        }
    };

    // Copy address function
    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(parsedUrlData?.transaction_address || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            py: { xs: 2, md: 4 }
        }}>
            <Container maxWidth="lg">
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', lg: 'row' },
                    gap: 3,
                    alignItems: 'flex-start'
                }}>
                    {/* Main Payment Section */}
                    <Box sx={{
                        flex: { lg: '1 1 66.666%' },
                        width: '100%',
                        maxWidth: { lg: '66.666%' }
                    }}>
                        <Card
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Header */}
                            <Box sx={{
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                color: 'white',
                                p: 3
                            }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <WalletIcon sx={{ fontSize: 28 }} />
                                    <Typography variant="h5" fontWeight="600">
                                        Pay with {parsedUrlData?.currency}
                                    </Typography>
                                </Stack>
                            </Box>

                            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                                {/* Payment Instructions */}
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="h6" gutterBottom fontWeight="600">
                                            Payment Instructions
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Please send exactly <strong>{parsedUrlData?.amount_to_be_paid} {parsedUrlData?.currency}</strong>
                                        </Typography>
                                    </Box>

                                    {/* Bitcoin Address */}
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                                            borderColor: alpha(theme.palette.primary.main, 0.2)
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    gutterBottom
                                                >
                                                    {parsedUrlData?.currency} Address
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    fontFamily="monospace"
                                                    sx={{
                                                        wordBreak: 'break-all',
                                                        fontSize: { xs: '0.85rem', md: '1rem' }
                                                    }}
                                                >
                                                    {parsedUrlData?.transaction_address || ''}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                onClick={handleCopyAddress}
                                                color="primary"
                                                size="small"
                                            >
                                                <ContentCopy />
                                            </IconButton>
                                        </Stack>
                                    </Paper>

                                    {/* Payment Options */}
                                    {/* <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Pay through external wallet
                                        </Typography>
                                    </Box> */}

                                    {/* Timer and QR Code Section */}
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: { xs: 'column', md: 'row' },
                                        gap: 3,
                                        alignItems: 'center'
                                    }}>
                                        <Box sx={{
                                            flex: { md: '1 1 50%' },
                                            width: '100%'
                                        }}>
                                            <Stack spacing={2}>
                                                {/* Timer */}
                                                {timerIntervalRef.current !== null && <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: timeRemaining < 300 ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.success.main, 0.05),
                                                        borderColor: timeRemaining < 300 ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.success.main, 0.2)
                                                    }}
                                                >
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <AccessTimeIcon
                                                            color={timeRemaining < 300 ? "error" : "success"}
                                                            fontSize="small"
                                                        />
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            Time remaining:
                                                        </Typography>
                                                        <Typography
                                                            variant="h6"
                                                            fontWeight="600"
                                                            color={timeRemaining < 300 ? "error.main" : "success.main"}
                                                        >
                                                            {formatTime(timeRemaining)}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>}

                                                {/* Status */}
                                                <Box sx={{
                                                    maxWidth: '100%',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    <Chip
                                                        icon={paymentStatusColorType === 'warning' ? <SecurityIcon /> : paymentStatusColorType === 'success' ? <VerifiedIcon /> : <CancelIcon />}
                                                        label={readablePaymentState}
                                                        color={paymentStatusColorType}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{
                                                            maxWidth: '100%',
                                                            height: 'auto',
                                                            paddingLeft : '10px',
                                                            '& .MuiChip-label': {
                                                                whiteSpace: 'normal',
                                                                wordWrap: 'break-word',
                                                                lineHeight: 1.5,
                                                                padding: '10px 10px'
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </Stack>
                                        </Box>

                                        {/* QR Code Placeholder */}
                                        <Box sx={{
                                            flex: { md: '1 1 50%' },
                                            width: '100%'
                                        }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        width: 200,
                                                        height: 200,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: 'background.paper',
                                                        borderStyle: 'dashed',
                                                        borderColor: 'divider'
                                                    }}
                                                >
                                                    <Stack alignItems="center" spacing={1}>
                                                        {parsedUrlData?.transaction_address && <QrCode value={parsedUrlData.transaction_address} size={150} />}
                                                        <Typography variant="caption" color="text.secondary">
                                                            QR Code
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Sidebar */}
                    <Box sx={{
                        flex: { lg: '1 1 33.333%' },
                        width: '100%',
                        maxWidth: { lg: '33.333%' }
                    }}>
                        <Stack spacing={3}>
                            {/* Merchant Details */}
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom fontWeight="600">
                                        Merchant Details
                                    </Typography>

                                    <Stack spacing={2}>
                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                                <PersonIcon fontSize="small" color="primary" />
                                                <Typography variant="body2" fontWeight="500">
                                                    {parsedUrlData?.organization_name}
                                                </Typography>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" alignItems="flex-start" spacing={1}>
                                                <LocationIcon fontSize="small" color="primary" sx={{ mt: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {`${parsedUrlData?.address_line_1 ? `${parsedUrlData?.address_line_1}, ` : ''} ${parsedUrlData?.address_line_2 ? `${parsedUrlData?.address_line_2}, ` : ''} ${parsedUrlData?.city ? `${parsedUrlData?.city}, ` : ''} ${parsedUrlData?.state ? `${parsedUrlData?.state}, ` : ''} ${parsedUrlData?.country ? `${parsedUrlData?.country} ` : ''} ${parsedUrlData?.zip ? `${parsedUrlData?.zip}, ` : ''}`}
                                                </Typography>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <EmailIcon fontSize="small" color="primary" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {parsedUrlData?.support_email}
                                                </Typography>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <PhoneIcon fontSize="small" color="primary" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {parsedUrlData?.support_phone}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Order Summary */}
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    height: '100%', // Make it fill available height
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <CardContent sx={{
                                    p: 3,
                                    flex: 1, // Allow content to expand
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between' // Distribute content evenly
                                }}>
                                    <Box>
                                        <Typography sx={{ marginBottom: '30px' }} variant="h6" gutterBottom fontWeight="600">
                                            Order Summary
                                        </Typography>

                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell><strong>Item</strong></TableCell>
                                                        <TableCell align="center"><strong>Quantity</strong></TableCell>
                                                        <TableCell align="right"><strong>{parsedUrlData?.currency}</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell>{parsedUrlData?.description}</TableCell>
                                                        <TableCell align="center">{parsedUrlData?.quantity}</TableCell>
                                                        <TableCell align="right">{parsedUrlData?.amount_to_be_paid}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>

                                    <Box sx={{ mt: 'auto' }}> {/* Push total to bottom */}


                                        <Box sx={{
                                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                                            p: 2,
                                            borderRadius: 2,
                                            marginTop: '40px'
                                        }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="h6" fontWeight="600">
                                                    TOTAL:
                                                </Typography>
                                                <Typography variant="h6" fontWeight="600" color="primary">
                                                    {parsedUrlData?.amount_to_be_paid} {parsedUrlData?.currency}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Security Notice */}
                            {/* <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    bgcolor: alpha(theme.palette.info.main, 0.02),
                                    borderColor: alpha(theme.palette.info.main, 0.2)
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <VerifiedIcon fontSize="small" color="info" sx={{ mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight="200" color="info.main">
                                            Secure Payment
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Your payment is secured by blockchain technology.
                                            Please double-check the address before sending.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper> */}
                        </Stack>
                    </Box>
                </Box>

                {/* Success Snackbar */}
                <Snackbar
                    open={copied}
                    autoHideDuration={2000}
                    onClose={() => setCopied(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setCopied(false)}
                        severity="success"
                        variant="filled"
                    >
                        Address copied to clipboard!
                    </Alert>
                </Snackbar>

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
            </Container>
        </Box>
    );
};

export default FinanceHubPaymentsInvoiceContent;