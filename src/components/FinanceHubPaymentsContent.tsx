// pages/terms.tsx or app/terms/page.tsx

'use client';
import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useBroker } from '../contexts/BrokerContext';
import { useRouter } from 'next/navigation';
import BitoDollarConvertContent from './BitoDollarConvertContent';
import ShareContentDialog from '@/components/ShareContentDialog'; // Adjust path as needed
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
    ToggleButton,
    ToggleButtonGroup,
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
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    InputAdornment,
    CircularProgress,
    Fade,
    Zoom,
    Modal,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    Snackbar,
    Alert,
    Backdrop,
    Divider,
    Skeleton,
    useTheme,
    Tooltip,
    Stack,
    alpha
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
    Send as SendIcon,
    AccountBalanceWallet as WalletIcon,
    Info as InfoIcon,
    Security as SecurityIcon,
    Speed as SpeedIcon,
    AccountBalance,
    Business,
    Assignment,
    Visibility,
    VisibilityOff,
    Flag,
    LocationOn,
    PersonSearch,
    CheckCircle,
    AccountBalanceWallet,
    Download,
    Send,
    CallReceived,
    TrendingDown,
    Refresh,
    History,
    Info,
    ArrowBack,
    ArrowForward,
    FilterList,
    ContentCopy as CopyIcon,
    QrCode as QrCodeIcon,
    CheckCircle as CheckIcon,
    CallReceived as ReceiveIcon,
    SwapHoriz as SwapIcon,
    CheckCircle as CheckCircleIcon,
    History as HistoryIcon,
    KeyboardArrowDown as ArrowDownIcon,
    KeyboardArrowUp as ArrowUpIcon,
    Launch as LaunchIcon,
    Schedule as ScheduleIcon,
    Error as ErrorIcon,
    FilterList as FilterIcon,
    Preview as PreviewIcon,
    Code as CodeIcon,
    Share as ShareIcon
} from '@mui/icons-material';
import { getLocationData } from '../services/CoreDataService'
import axios from 'axios';


const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';


interface ApiResponse {
    bill_id: string;
    amount_paid: string;
    blockchain_refund_address: string;
    exchange_rate: string;
    created: string;
    merchant_id: number;
    mapping_status: number;
    blockchain_txn_id: string;
    token_quantity: number;
    payment_confirmed_status: number;
    name: string;
    invoice_id: number;
    amount_to_be_paid: number;
    product_description: string;
    updated: string;
    email: string;
    currency_id: number;
    status: number;
    error_msg: string;
    total_count: number;
    error: string;
    price: string;
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

interface MarketPriceResponse {
    error: string
    error_msg: string
    price: string
}


interface ButtonSize {
    width: number
    height: number
    label: string
}



interface Currency {
    currency_name: string
    balance: string
    logo: string
    is_broker_currency: number
    currency_id: number
    currency_code: string
    network: string[]
}

interface CurrencyBalance {
    currency_name: string;
    balance: string;
    logo: string;
    is_broker_currency: number;
    currency_id: number;
    currency_code: string;
    network: string[];
}

interface BalanceData {
    rolling_reserve_balance: CurrencyBalance[];
    error_msg: string;
    coin_balance: CurrencyBalance[];
    error: string;
}
type BalanceResponse = BalanceData[];


interface PaymentListInterface {
    bill_id: string;
    amount_paid: string;
    blockchain_refund_address: string;
    exchange_rate: string;
    created: string;
    merchant_id: number;
    blockchain_txn_id: string;
    token_quantity: number;
    payment_confirmed_status: number;
    name: string;
    invoice_id: number;
    amount_to_be_paid: number;
    product_description: string;
    updated: string;
    email: string;
    currency_id: number;
    status: number;
    error_msg: string;
    total_count: number;
    error: string;
}

interface FeeResponse {
    CURRENCY: string;
    MIN_FEE: string;
    TDS_RATE: string;
    FROMFEE: string;
    error_msg: string;
    FEE_RATE: string;
    GST_RATE: string;
    CURRENCY_PRECISION: string;
    error: string;
    TOFEE: string;
}

interface ValidateAddressResponse {
    error_msg: string;
    error: string;
}

interface Transaction {
    transaction_id: number;
    name: string;
    description: string;
    transaction_timestamp: string;
    debit_amount: string;
    status: string;
}

interface TransactionResponse {
    error_msg: string;
    trxnList: Transaction[];
    error: string;
    totalCount: number;
}

type TransactionResponseList = TransactionResponse[];



// Constants
const BUTTON_SIZES: ButtonSize[] = [
    { width: 80, height: 43, label: 'Small' },
    { width: 105, height: 56, label: 'Medium' },
    { width: 132, height: 70, label: 'Large' },
]





const FinanceHubPaymentsPage = () => {
    const router = useRouter();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const { brokerDetails } = useBroker()
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('section1');
    const [isLoginSectionEnabled, setIsLoginSectionEnabled] = useState(true);
    const [loginText, setLoginText] = useState('');
    const [brokerId, setBrokerId] = useState<string>('');
    const [merchantCountry, setMerchantCountry] = useState<string>('');
    const [currencies, setCurrencies] = useState<CurrencyBalance[]>([]);
    const [networks, setNetworks] = useState<string[]>([])
    const [showWallet, setShowWallet] = useState<boolean>(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [usdAmount, setUsdAmount] = useState<number>(1);
    const [cryptoPrice, setCryptoPrice] = useState<string>('');
    const [selectedCrypto, setSelectedCrypto] = useState<string>('');
    const [selectedNetwork, setSelectedNetwork] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [selectedButton, setSelectedButton] = useState<ButtonSize | null>(null);
    const [merchantId, setMerchantId] = useState<number>(0);
    const [encodedString, setEncodedString] = useState<string>('');
    const [brokerPaymentBaseUrl, setBrokerPaymentBaseUrl] = useState<string>('')
    const [paymentsList, setPaymentsList] = useState<PaymentListInterface[]>([]);
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unresolved'>('all')
    const [paymentPageNo, setPaymentPageNo] = useState<number>(1);
    const [paymentPageSize, setPaymentPageSize] = useState<number>(20);
    const [paymentTotalCount, setPaymentTotalCount] = useState<number>(0);
    const [openWithdrawModal, setOpenWithdrawModal] = useState<boolean>(false)
    const [selectedCryptoForWalletProcess, setSelectedCryptoForWalletProcess] = useState<CurrencyBalance | null>(null)
    const [selectedCurrencyFees, setSelectedCurrencyFees] = useState<FeeResponse | null>(null);
    const [withdrawAddress, setWithdrawAddress] = useState('')
    const [withdrawAddressValidate, setWithdrawAddressValidate] = useState<'valid' | 'invalid' | 'blank'>('blank')
    const [selectedNetworkForWithdraw, setselectedNetworkForWithdraw] = useState<string>('NATIVE');
    const [withdrawMemo, setWithdrawMemo] = useState<string>('');
    const [amountForWithdraw, setAmountForWithdraw] = useState('')
    const [charges, setCharges] = useState({
        networkFees: '0',
        gstCharges: '0',
        tdsCharges: '0',
    })
    const [txnPageNo, setTxnPageNo] = useState<number>(1);
    const [txnPageSize, setTxnPageSize] = useState<number>(20);
    const [txnTotalCount, setTxnTotalCount] = useState<number>(0);
    const [txnList, setTxnList] = useState<Transaction[] | []>([]);
    const [estimatedNetworkFee, setEstimatedNetworkFee] = useState<string>('0.00');
    const [gstCharges, setGstCharges] = useState<string>('0.00');
    const [tdsCharges, setTdsCharges] = useState<string>('0.00');
    const [openShareDialog, setOpenShareDialog] = useState(false);
    const [shareType, setShareType] = useState<'link' | 'html'>('link');
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

    // Create theme using the external theme function
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
                        '"Apple Color Emoji"',
                        '"Segoe UI Emoji"',
                        '"Segoe UI Symbol"',
                    ].join(','),
                    h1: {
                        fontSize: '2.5rem',
                        fontWeight: 600,
                        lineHeight: 1.2,
                    },
                    h2: {
                        fontSize: '2rem',
                        fontWeight: 600,
                        lineHeight: 1.3,
                    },
                    h3: {
                        fontSize: '1.75rem',
                        fontWeight: 600,
                        lineHeight: 1.4,
                    },
                    h4: {
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        lineHeight: 1.4,
                    },
                    h5: {
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        lineHeight: 1.5,
                    },
                    h6: {
                        fontSize: '1rem',
                        fontWeight: 600,
                        lineHeight: 1.6,
                    },
                    body1: {
                        fontSize: '1rem',
                        lineHeight: 1.6,
                    },
                    body2: {
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                    },
                },
                shape: {
                    borderRadius: 8,
                },
                spacing: 8,
                components: {
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                textTransform: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                padding: '8px 16px',
                            },
                            contained: {
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                '&:hover': {
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                },
                            },
                        },
                    },
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                boxShadow: mode === 'light'
                                    ? '0 2px 8px rgba(0,0,0,0.1)'
                                    : '0 2px 8px rgba(0,0,0,0.3)',
                                borderRadius: 12,
                            },
                        },
                    },
                    MuiAppBar: {
                        styleOverrides: {
                            root: {
                                boxShadow: mode === 'light'
                                    ? '0 2px 4px rgba(0,0,0,0.1)'
                                    : '0 2px 4px rgba(0,0,0,0.3)',
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
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                backgroundImage: 'none',
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


    // Helper function to show snackbar
    const showSnackbar = async (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = async () => {
        setSnackbarOpen(false);
    };

    /* Method defination for handling user login */
    const makeUserLogin = async () => {
        setInitialLoading(true);
        try {
            setIsLoginSectionEnabled(true);
            const response = await getLocationData();
            const ipResponse: IpGeolocationResponse = response.data;
            const latitude = ipResponse.latitude;
            const longitude = ipResponse.longitude;
            setTimeout(async () => {

                const payload = {
                    broker_uuid: localStorage.getItem('uuid'),
                    latitude: latitude,
                    longitude: longitude
                }
                try {
                    const response = await axios.post<ApiResponse[] | ApiResponse>(
                        `${API_BASE_URL}/finance-hub/payments/register`, payload,
                        {
                            headers: {
                                //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                            }
                        }
                    );

                    // response.data can be an array or a single object depending on the API.
                    const responseData = response.data as ApiResponse;
                    const responseLength = Array.isArray(responseData) ? responseData.length : (responseData ? 1 : 0);
                    const error = Array.isArray(responseData) ? responseData[responseLength - 1] : responseData;
                    if (error.error === 1) {
                        showSnackbar(error.error_msg, 'error');
                        return;
                    }
                    const mappingStatus = error.mapping_status;
                    setMerchantCountry(error.country)
                    setInitialLoading(false);
                    setIsLoginSectionEnabled(true);
                    setMerchantId(error.merchant_id);

                    if (mappingStatus === 0) {
                        setLoginText('We are mapping you to the nearest business owner.');
                        setTimeout(() => {
                            setLoginText('We are registering you as a user of the nearest business owner.');
                            setTimeout(() => {
                                setLoginText('We are logging you to the exchange.');
                                setIsLoginSectionEnabled(false);
                            }, 2000);
                        }, 2000);
                    } else {
                        setLoginText('We are logging you to the exchange.');
                        const screen = localStorage.getItem('show_screen') || null;
                        toggleScreen(screen === 'wallet' ? 'wallet' : 'button');
                        setTimeout(() => {
                            setIsLoginSectionEnabled(false);
                        }, 2000);
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

            }, 3000);
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


    /* method defination for toggling screen */
    const toggleScreen = async (screen: string) => {
        setShowWallet(screen === 'wallet' ? true : false);
        if (screen === 'wallet') {
            await getAllCryptosAndBalance();
            await getUserAllTransaction(txnPageNo);
        } else {
            await getAllCryptosAndBalance();
            await getAllPayments(paymentPageNo, paymentFilter);
        }
    }
    /* Method defination to get all crypto details */
    const getAllCryptosAndBalance = async () => {
        try {

            setLoading(false);
            const response = await axios.get<BalanceResponse>(
                `${API_BASE_URL}/finance-hub/payments/FetchUsdBtcLedgerAmount`,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const resp = response.data[0];
            if (resp.error === '1') {
                showSnackbar(resp.error_msg, 'error');
                return;

            }

            setCurrencies(resp.coin_balance || []);
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

    /* Method defination for handling usd amount & generating crypto amount */
    const handleUsdAmount = async (amount: string) => {
        setUsdAmount(parseFloat(amount));
        if (selectedCrypto !== '') {
            const marketPrice: string = (await getMarketPrice(selectedCrypto)) || '0';
            const convertedCryptoPrice = (parseFloat(amount) / parseFloat(marketPrice)).toFixed(6)
            setCryptoPrice(convertedCryptoPrice);
        }
    }

    /* Method defination for selecting crypto */
    const handleCryptoSelection = async (crypto: string) => {
        setSelectedCrypto(crypto);
        // Find the selected currency and determine available networks.
        const found = currencies.find(c => c.currency_code === crypto);
        const tokens: string[] = (found && Array.isArray(found.network) && found.network.length > 0)
            ? found.network
            : ['NATIVE'];
        // Update local networks state so the Network <Select> renders options.
        setNetworks(tokens);

        if (usdAmount >= 1) {
            const amount = usdAmount.toFixed(2)
            const marketPrice: string = (await getMarketPrice(crypto)) || '0';
            const convertedCryptoPrice = (parseFloat(amount) / parseFloat(marketPrice)).toFixed(6)
            setCryptoPrice(convertedCryptoPrice);
        }
    }

    /* Method defination for rendering market price */
    const getMarketPrice = async (counter: string) => {
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

    /* Method defination for generating code */
    const generateCode = useCallback(() => {
        if (!selectedButton || !encodedString) return '';

        const baseUrl = window.location.origin;
        const buttonWidth = selectedButton.width;
        const buttonHeight = selectedButton.height;
        const fontSize = selectedButton.label.toLowerCase() === 'small' ? '14px'
            : selectedButton.label.toLowerCase() === 'medium' ? '16px'
                : '20px';

        return `<form method="GET" action="${baseUrl}/finance-hub/payments/proceed-to-payment" target="_blank">
  <div class="checkout-button-container">
    <input type="hidden" name="data" value="${encodedString}"/>
    <input type="hidden" name="quantity" value="1"/>
    <button 
      type="submit"    
      class="crypto-checkout-btn"
      style="width: ${buttonWidth}px; height: ${buttonHeight}px; font-size: ${fontSize};"
    >
      Pay with ${selectedCrypto.toUpperCase()}
    </button>
  </div>
</form>

<style>
.crypto-checkout-btn {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.crypto-checkout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
}

.crypto-checkout-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>`;
    }, [encodedString, selectedButton, selectedCrypto]);


    /* Method defination for generating Link */
    const generateLink = () => {
        return `${window.location.origin}/finance-hub/payments/proceed-to-payment?data=${encodedString}&quantity=1`;
    }


    // Copy to clipboard
    const copyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(generateLink())
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }, [generateLink])


    /* Method defination for generation button */
    const generateButton = async (button: ButtonSize | null) => {
        if (usdAmount <= 0) {
            showSnackbar('USD amount should be greater than 0', 'error');
            return;
        } else if (selectedCrypto === '') {
            showSnackbar('Please select a crypto', 'error');
            return;
        } else if (description === '') {
            showSnackbar('Please enter a description', 'error');
            return;
        } else if (selectedNetwork === '') {
            showSnackbar('Please select a network', 'error');
            return;
        }
        const obj = {
            merchant_id: merchantId,
            currency_id: currencies.find(c => c.currency_code === selectedCrypto)?.currency_id,
            currency: selectedCrypto,
            amount: cryptoPrice,
            fiat_amount: usdAmount,
            button_size: button?.label.toLowerCase(),
            network: selectedNetwork,
            description: description,
        };
        const jsonString = JSON.stringify(obj);
        const encryptedCodeJson = btoa(jsonString);
        setEncodedString(encryptedCodeJson)
        setSelectedButton(button);
        generateLink();
    }
    useEffect(() => {
        makeUserLogin();
    }, [merchantId]);

    /* Method defination calling APIs after conversion to B$ is done */
    const handleOnConversionSuccess = async () => {
        await getAllCryptosAndBalance();
        await getUserAllTransaction(txnPageNo);
    }

    /* Method defination to get add payment link */
    const getAllPayments = async (page: number, filter: 'all' | 'paid' | 'unresolved') => {
        setPaymentPageNo(page);
        setPaymentFilter(filter);
        const payload = {
            "page_no": page,
            "no_of_items_in_a_page": paymentPageSize
        }
        const apiEndPoint = filter === 'all' ? `get_all_invoices` : filter === 'paid' ? `get_all_paid_resolved_invoice` : `get_all_unresolved_invoice`

        try {
            const response = await axios.post<PaymentListInterface[]>(`${API_BASE_URL}/finance-hub/payments/${apiEndPoint}`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                })
            const error = response?.data?.[response.data.length - 1];
            if (error.error === '1') {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            setPaymentsList(response.data);
            setPaymentTotalCount(error.total_count);
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

    /* Method defination for handling payment filter */
    const handlePaymentFilter = async (filter: 'all' | 'paid' | 'unresolved') => {
        setPaymentFilter(filter);
        await getAllPayments(paymentPageNo, filter);
    }

    /* Method defination of handling payments pagination */
    const handlePaymentPagination = async (pageType: 'prev' | 'next') => {
        let reqPage = pageType === 'prev' ? paymentPageNo - 1 : paymentPageNo + 1;
        const maxPage = Math.ceil(paymentTotalCount / paymentPageSize);
        reqPage = reqPage === 0 ? 1 : reqPage;
        if (reqPage === 0) {
            reqPage = 1;
        } else if (reqPage === maxPage) {
            reqPage = maxPage - 1;
        } else {
            reqPage = reqPage
        }
        await getAllPayments(reqPage, paymentFilter);

    }
    /* Method defination of handling payments pagination */
    const handleTxnPagination = async (pageType: 'prev' | 'next') => {
        let reqPage = pageType === 'prev' ? paymentPageNo - 1 : paymentPageNo + 1;
        const maxPage = Math.ceil(txnTotalCount / txnPageSize);
        reqPage = reqPage === 0 ? 1 : reqPage;
        if (reqPage === 0) {
            reqPage = 1;
        } else if (reqPage === maxPage) {
            reqPage = maxPage - 1;
        } else {
            reqPage = reqPage
        }
        await getUserAllTransaction(reqPage);

    }


    /* method defination for handling crypto to setup withdraw process */
    const handleWithdrawSetup = async (currency: CurrencyBalance) => {
        const fees = await getFeesByCurrency(currency.currency_id);
        setSelectedCryptoForWalletProcess(currency);
        setselectedNetworkForWithdraw(currency.network[0]);
        setSelectedCurrencyFees(fees || null);
        setOpenWithdrawModal(true);

    }

    /* Method defination to get fees of a particular currecny */
    const getFeesByCurrency = async (currencyId: number) => {
        const payload = {
            "currencyId": currencyId,
            "country": merchantCountry
        }
        try {
            setLoading(true);
            const response = await axios.post<FeeResponse[]>(`${API_BASE_URL}/finance-hub/payments/getFeesByCurrencyId`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                })
            const fees = response?.data?.[response.data.length - 1];
            if (fees.error === '1') {
                showSnackbar(fees.error_msg, 'error');
                return;
            }
            return fees;
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

    /* Handle validate withdraw address */
    const handleWithdrawAddress = async (address: string) => {
        setWithdrawAddress(address.trim());
        if (address.trim() === '') {
            setWithdrawAddressValidate('blank');
            return;
        }
        const response = await checkAddress(address.trim(), selectedCryptoForWalletProcess!.currency_id) as ValidateAddressResponse[] | undefined;
        const isValid = response?.[0];
        console.log(isValid);
        setWithdrawAddressValidate(isValid ? isValid.error === '1' ? 'invalid' : 'valid' : 'blank');
    }

    /* Method defination for checking valid address for send */
    const checkAddress = async (address: string, currencyId: number) => {
        const payload =
            { "currencyid": currencyId, "address": address }

        try {
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/payments/addressValidate`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
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

    /* Method defination for validating amount for withdraw  */
    const handleWithdrawAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // ✅ Allow empty value (Backspace to clear)
        if (value === '') {
            setAmountForWithdraw('');
            setEstimatedNetworkFee('0.00');
            setGstCharges('0.00');
            setTdsCharges('0.00');
            return;
        }

        // ✅ Only then clean unwanted characters
        const cleanedValue = value
            .replace(/[^0-9.]/g, '')     // allow only numbers and dot
            .replace(/(\.).*?\./g, '$1'); // ensure only one dot

        event.target.value = cleanedValue;
        setAmountForWithdraw(cleanedValue)

        const balance = parseFloat(cleanedValue);
        const minFee = selectedCurrencyFees?.MIN_FEE
            ? parseFloat(selectedCurrencyFees.MIN_FEE) : 0;
        const feeRate = selectedCurrencyFees?.FEE_RATE
            ? parseFloat(selectedCurrencyFees.FEE_RATE) : 0;
        const precision = selectedCurrencyFees?.CURRENCY_PRECISION ? parseInt(selectedCurrencyFees.CURRENCY_PRECISION) : 2;
        const gstRate = selectedCurrencyFees?.GST_RATE
            ? parseFloat(selectedCurrencyFees.GST_RATE) : 0;
        const tdsRate = selectedCurrencyFees?.TDS_RATE
            ? parseFloat(selectedCurrencyFees.TDS_RATE) : 0;
        if (balance <= minFee) {
            showSnackbar('Insufficient balance', 'error')
            setAmountForWithdraw('');
            setEstimatedNetworkFee('0.00')
            setGstCharges('0.00');
            setTdsCharges('0.00');
            return;
        }

        // Calculate: networkFees = min_fee + (fee_rate % of amount)
        const networkFees = minFee + (balance * (feeRate / 100));
        const gst = (minFee + ((balance * feeRate) / 100)) * (gstRate / 100);
        const tds = balance * (tdsRate / 100);
        setEstimatedNetworkFee(networkFees.toFixed(precision));
        setGstCharges(gst.toFixed(precision));
        setTdsCharges(tds.toFixed(precision));

    }
    /* Method defination click on max button */
    const handleMaxAmount = async () => {
        const balance = selectedCryptoForWalletProcess?.balance
            ? parseFloat(selectedCryptoForWalletProcess.balance)
            : 0;
        const minFee = selectedCurrencyFees?.MIN_FEE
            ? parseFloat(selectedCurrencyFees.MIN_FEE) : 0;
        const feeRate = selectedCurrencyFees?.FEE_RATE
            ? parseFloat(selectedCurrencyFees.FEE_RATE) : 0;
        const precision = selectedCurrencyFees?.CURRENCY_PRECISION ? parseInt(selectedCurrencyFees.CURRENCY_PRECISION) : 2;
        const gstRate = selectedCurrencyFees?.GST_RATE
            ? parseFloat(selectedCurrencyFees.GST_RATE) : 0;
        const tdsRate = selectedCurrencyFees?.TDS_RATE
            ? parseFloat(selectedCurrencyFees.TDS_RATE) : 0;
        if (balance <= minFee) {
            showSnackbar('Insufficient balance', 'error')
            setAmountForWithdraw('');
            setEstimatedNetworkFee('0.00')
            setGstCharges('0.00');
            setTdsCharges('0.00');
            return;
        }
        const maxAmount = (balance - minFee - ((balance - minFee) * feeRate) / 100).toFixed(precision);
        setAmountForWithdraw(maxAmount);
        // Calculate: networkFees = min_fee + (fee_rate % of amount)
        const networkFees = minFee + (balance * (feeRate / 100));
        const gst = (minFee + ((balance * feeRate) / 100)) * (gstRate / 100);
        const tds = balance * (tdsRate / 100);
        setEstimatedNetworkFee(networkFees.toFixed(precision));
        setGstCharges(gst.toFixed(precision));
        setTdsCharges(tds.toFixed(precision));



    }

    /* Method defination for withdraw submit */
    const handleWithdrawSubmit = async () => {
        if (withdrawAddress === '') {
            showSnackbar('Please provide a Recipient Address', 'error');
            return;
        } else if (amountForWithdraw === '') {
            showSnackbar('Please provide an amount', 'error');
            return;
        }
        const addrResponse = await checkAddress(withdrawAddress.trim(), selectedCryptoForWalletProcess!.currency_id) as ValidateAddressResponse[] | undefined;
        const isValid = addrResponse?.[0];
        setWithdrawAddressValidate(isValid ? isValid.error === '1' ? 'invalid' : 'valid' : 'blank');
        if (isValid?.error === '1') {
            showSnackbar('Please provide valid Recipient Address', 'error');
            return;
        }
        const payload = {
            "currencyId": selectedCryptoForWalletProcess?.currency_id,
            "sendAmount": amountForWithdraw,
            "toAdd": withdrawAddress,
            "email": brokerDetails?.email,
            "memo": withdrawMemo,
            "tokenType": selectedNetworkForWithdraw,
        }

        try {
            setLoading(true);
            const response = await axios.post<ApiResponse[]>(
                `${API_BASE_URL}/finance-hub/payments/sendToOther`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response?.data?.[response.data.length - 1];
            if (error.error === '1') {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            showSnackbar('Withdraw successfully', 'success');
            setOpenWithdrawModal(false)
            setLoading(true);
            await getAllCryptosAndBalance();
            //resetting all data;
            setSelectedCryptoForWalletProcess(null);
            setSelectedCurrencyFees(null);
            setWithdrawAddress('');
            setWithdrawAddressValidate('blank');
            setselectedNetworkForWithdraw('NATIVE');
            setWithdrawMemo('');
            setAmountForWithdraw('');
            setEstimatedNetworkFee('0.00');
            setGstCharges('0.00');
            setTdsCharges('0.00');
            setCharges({
                networkFees: '0',
                gstCharges: '0',
                tdsCharges: '0',
            })
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

    /* method defination for get user transaction */
    const getUserAllTransaction = async (pageNo: number) => {
        setTxnPageNo(pageNo);
        const payload = {
            "pageNo": pageNo,
            "noOfItemsPerPage": txnPageSize
        }
        try {
            setLoading(true);
            const response = await axios.post<TransactionResponseList>(`${API_BASE_URL}/finance-hub/payments/getUserTransaction`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                })
            const txn = response?.data?.[response.data.length - 1];
            if (txn.error === '1') {
                showSnackbar(txn.error_msg, 'error');
                return;
            }
            setTxnList(txn.trxnList);
            setTxnTotalCount(txn.totalCount);
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

    /* Function defination for what will happen after sharing */
    const handleShareSuccess = (recipientIds: number[]) => {
        showSnackbar(`Payment ${shareType === 'html' ? 'html' : 'link'} shared with ${recipientIds.length} ${recipientIds.length === 1 ? 'person' : 'people'}!`, 'success');
    };

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
            <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
                {isLoginSectionEnabled && <LoadingMappingComponent />}
                {!isLoginSectionEnabled && <Fragment>
                    {!showWallet ? (
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Button Configuration Section */}
                            <Paper
                                elevation={6}
                                sx={{
                                    width: '100%',
                                    maxWidth: 800,
                                    mx: 'auto',
                                    borderRadius: 3,
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                    overflow: 'hidden',
                                }}
                            >
                                <Fade in={true} timeout={800}>
                                    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 3,
                                                flexWrap: 'wrap',
                                                gap: 2
                                            }}
                                        >
                                            <Typography
                                                variant="h4"
                                                component="h1"
                                                gutterBottom
                                                sx={{
                                                    textAlign: 'center',
                                                    mb: 4,
                                                    fontWeight: 700,
                                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                                    backgroundClip: 'text',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }}
                                            >
                                                Create A Payment Button
                                            </Typography>

                                            <Button
                                                disabled={loading}
                                                onClick={() => toggleScreen('wallet')}
                                                variant="outlined"
                                                startIcon={<AccountBalanceWallet />}
                                                sx={{
                                                    background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    px: 3,
                                                    py: 1,
                                                    border: 'none',
                                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                                                    '&:hover': {
                                                        background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
                                                        transform: 'translateY(-1px)',
                                                    },
                                                    transition: 'all 0.3s ease-in-out'
                                                }}
                                            >
                                                Wallet
                                            </Button>
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'column', lg: 'row' },
                                            gap: 3,
                                            alignItems: 'flex-start'
                                        }}>
                                            {/* Configuration Panel */}
                                            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 58%' } }}>
                                                <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 58%' } }}>
                                                    <Card elevation={2}>
                                                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>

                                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CodeIcon color="primary" />
                                                                Button Configuration
                                                            </Typography>

                                                            <Box sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 3
                                                            }}>
                                                                {/* Price Fields */}
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                                    gap: 2
                                                                }}>
                                                                    <Box sx={{ flex: 1 }}>
                                                                        <TextField
                                                                            fullWidth
                                                                            label="USD Price"
                                                                            type="number"
                                                                            onChange={(e) => { handleUsdAmount(e.target.value) }} defaultValue={usdAmount}
                                                                            InputProps={{
                                                                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                                            }}
                                                                            sx={{ mb: 2 }}
                                                                        />
                                                                    </Box>

                                                                    <Box sx={{ flex: 1 }}>
                                                                        <TextField
                                                                            fullWidth
                                                                            label="Crypto Amount"
                                                                            type="text"

                                                                            value={cryptoPrice}
                                                                            disabled
                                                                            InputProps={selectedCrypto !== '' ? {
                                                                                endAdornment: (
                                                                                    <InputAdornment position="end">
                                                                                        <Chip label={selectedCrypto} size="small" color="primary" />
                                                                                    </InputAdornment>
                                                                                )
                                                                            } : undefined}
                                                                            sx={{ mb: 2 }}
                                                                        />
                                                                    </Box>
                                                                </Box>

                                                                {/* Currency and Network */}
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: { xs: 'column', sm: 'row' },
                                                                    gap: 2
                                                                }}>
                                                                    <Box sx={{ flex: 1 }}>
                                                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                                                            <InputLabel>Currency</InputLabel>
                                                                            <Select

                                                                                label="Currency"
                                                                                defaultValue={selectedCrypto}
                                                                                onChange={(e) => handleCryptoSelection(e.target.value)}

                                                                            >
                                                                                {currencies.map((currency) => (
                                                                                    <MenuItem key={currency.currency_id} value={currency.currency_code}>
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                            <Typography variant="body2" fontWeight="bold">
                                                                                                {currency.currency_code}
                                                                                            </Typography>
                                                                                            <Typography variant="body2" color="text.secondary">
                                                                                                {currency.currency_name}
                                                                                            </Typography>
                                                                                        </Box>
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                    </Box>

                                                                    <Box sx={{ flex: 1 }}>
                                                                        <FormControl fullWidth sx={{ mb: 2 }}>
                                                                            <InputLabel>Network</InputLabel>
                                                                            <Select
                                                                                label="Network"
                                                                                onChange={(e: { target: { value: string } }) => { setSelectedNetwork(e.target.value) }}
                                                                            >
                                                                                {networks.map((network: string) => <MenuItem key={network} value={network}>
                                                                                    {network}
                                                                                </MenuItem>)}

                                                                            </Select>
                                                                        </FormControl>
                                                                    </Box>
                                                                </Box>

                                                                {/* Description */}
                                                                <Box>
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Description"
                                                                        defaultValue={description}
                                                                        onChange={(e) => { setDescription(e.target.value) }}
                                                                        placeholder="Please enter a description"
                                                                        multiline
                                                                        rows={3}
                                                                        sx={{ mb: 3 }}
                                                                    />
                                                                </Box>

                                                                {/* Button Size Selection */}
                                                                <Box>
                                                                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                                                                        Choose Button Size
                                                                    </Typography>
                                                                    <ToggleButtonGroup
                                                                        exclusive
                                                                        sx={{
                                                                            display: 'flex',
                                                                            flexWrap: isMobile ? 'wrap' : 'nowrap',
                                                                            gap: 1,
                                                                            '& .MuiToggleButton-root': {
                                                                                flex: isMobile ? '1 1 100%' : '1 1 0',
                                                                                minWidth: isMobile ? 'auto' : 120,
                                                                            }
                                                                        }}
                                                                    >
                                                                        {BUTTON_SIZES.map((size) => (
                                                                            <ToggleButton
                                                                                key={`${size.width}x${size.height}`}
                                                                                value={size}
                                                                                sx={{
                                                                                    flexDirection: 'column',
                                                                                    py: 2,
                                                                                    border: 1,
                                                                                    borderColor: 'divider',
                                                                                }}
                                                                                onChange={() => { generateButton(size) }}
                                                                            >
                                                                                <Typography variant="body2" fontWeight="bold">
                                                                                    {size.label}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    {size.width}×{size.height}px
                                                                                </Typography>
                                                                            </ToggleButton>
                                                                        ))}
                                                                    </ToggleButtonGroup>
                                                                </Box>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                </Box>
                                            </Box>

                                            {/* Preview and Code Panel */}
                                            <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 42%' } }}>
                                                <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 42%' } }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                        {/* Preview */}
                                                        <Card elevation={2}>
                                                            <CardContent>
                                                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <PreviewIcon color="primary" />
                                                                    Preview
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                                    Click and choose a button to see the preview
                                                                </Typography>

                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        justifyContent: 'center',
                                                                        p: 3,
                                                                        bgcolor: 'background.default',
                                                                        borderRadius: 2,
                                                                        border: 1,
                                                                        borderColor: 'divider',
                                                                    }}
                                                                >
                                                                    {selectedButton !== null && (
                                                                        <Fragment>
                                                                            <form method="GET" action={`/finance-hub/payments/proceed-to-payment`} target="_blank">
                                                                                <input type="hidden" name="data" value={encodedString} />
                                                                                <input type="hidden" name="quantity" value="1" />
                                                                                <Button
                                                                                    type="submit"
                                                                                    variant="contained"
                                                                                    sx={{
                                                                                        width: `${selectedButton?.width}`,
                                                                                        height: `${selectedButton?.height}`,
                                                                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                                                                        fontWeight: 600,
                                                                                        fontSize: `${selectedButton?.label.toLowerCase() === 'small' ? '14px' : selectedButton?.label.toLowerCase() === 'medium' ? '16px' : '20px'}`,
                                                                                        '&:hover': {
                                                                                            transform: 'translateY(-1px)',
                                                                                            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                                                                        },
                                                                                    }}
                                                                                >
                                                                                    Pay with {selectedCrypto.toUpperCase()}
                                                                                </Button>
                                                                            </form>
                                                                        </Fragment>
                                                                    )}
                                                                </Box>

                                                                {/* Share Button in Preview Section */}
                                                                {selectedButton !== null && (
                                                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                                                        <Button
                                                                            variant="contained"
                                                                            startIcon={<ShareIcon />}
                                                                            onClick={() => {
                                                                                setShareType('html');
                                                                                setOpenShareDialog(true);
                                                                            }}
                                                                            sx={{
                                                                                background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                                                color: 'white',
                                                                                fontWeight: 600,
                                                                                px: 3,
                                                                                py: 1,
                                                                                '&:hover': {
                                                                                    background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                                                    opacity: 0.9,
                                                                                }
                                                                            }}
                                                                        >
                                                                            Share Button
                                                                        </Button>
                                                                    </Box>
                                                                )}
                                                            </CardContent>
                                                        </Card>

                                                        {/* Generated Link */}
                                                        <Card elevation={2}>
                                                            <CardContent>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <CodeIcon color="primary" />
                                                                        Generated Link
                                                                    </Typography>
                                                                </Box>

                                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                                    Select the link below, then copy and paste it into your webpage.
                                                                </Typography>

                                                                {copySuccess && (
                                                                    <Alert severity="success" sx={{ mb: 2 }}>
                                                                        Link copied to clipboard!
                                                                    </Alert>
                                                                )}

                                                                <Paper
                                                                    variant="outlined"
                                                                    sx={{
                                                                        p: 2,
                                                                        bgcolor: theme.palette.background.default,
                                                                        maxHeight: 300,
                                                                        overflow: 'auto',
                                                                        fontFamily: 'monospace',
                                                                        fontSize: '0.75rem',
                                                                        lineHeight: 1.4,
                                                                        wordBreak: 'break-all',
                                                                        overflowWrap: 'break-word',
                                                                        wordWrap: 'break-word',
                                                                    }}
                                                                >
                                                                    <pre style={{
                                                                        margin: 0,
                                                                        whiteSpace: 'pre-wrap',
                                                                        wordBreak: 'break-all',
                                                                        overflowWrap: 'break-word',
                                                                    }}>
                                                                        {selectedButton !== null && generateLink()}
                                                                    </pre>
                                                                </Paper>

                                                                {selectedButton !== null && (
                                                                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                                        <Button
                                                                            fullWidth
                                                                            variant="outlined"
                                                                            startIcon={<CopyIcon />}
                                                                            onClick={copyToClipboard}
                                                                        >
                                                                            Copy Link
                                                                        </Button>
                                                                        <Button
                                                                            fullWidth
                                                                            variant="contained"
                                                                            startIcon={<ShareIcon />}
                                                                            onClick={() => {
                                                                                setShareType('link');
                                                                                setOpenShareDialog(true);
                                                                            }}
                                                                            sx={{
                                                                                background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                                                '&:hover': {
                                                                                    background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                                                    opacity: 0.9,
                                                                                }
                                                                            }}
                                                                        >
                                                                            Share Link
                                                                        </Button>
                                                                    </Box>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Fade>
                            </Paper>

                            {/* Payments Section - Now properly separated */}
                            <Paper
                                elevation={6}
                                sx={{
                                    width: '100%',
                                    maxWidth: 800,
                                    mx: 'auto',
                                    borderRadius: 3,
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                    overflow: 'hidden',
                                }}
                            >
                                <Fade in={true} timeout={800}>
                                    <Box>
                                        {/* Payments Header */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 3,
                                                borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                flexWrap: 'wrap',
                                                gap: 2
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant="h5"
                                                    sx={{
                                                        color: theme.palette.text.primary,
                                                        fontWeight: 700,
                                                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                                                    }}
                                                >
                                                    Payments
                                                </Typography>
                                                <Payments sx={{ color: theme.palette.primary.main, ml: 1 }} />
                                            </Box>

                                            {/* Filter Buttons */}
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <ToggleButtonGroup
                                                    exclusive
                                                    size="small"
                                                    sx={{
                                                        '& .MuiToggleButton-root': {
                                                            px: 2,
                                                            py: 0.5,
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600,
                                                            textTransform: 'none',
                                                            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                                                            '&.Mui-selected': {
                                                                backgroundColor: theme.palette.primary.main,
                                                                color: 'white',
                                                                '&:hover': {
                                                                    backgroundColor: theme.palette.primary.dark,
                                                                }
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <ToggleButton
                                                        value="all"
                                                        selected={paymentFilter === "all"}
                                                        onClick={() => handlePaymentFilter('all')}
                                                    >
                                                        All
                                                    </ToggleButton>
                                                    <ToggleButton
                                                        value="paid"
                                                        selected={paymentFilter === "paid"}
                                                        onClick={() => handlePaymentFilter('paid')}
                                                    >
                                                        Paid
                                                    </ToggleButton>
                                                    <ToggleButton
                                                        value="unresolved"
                                                        selected={paymentFilter === "unresolved"}
                                                        onClick={() => handlePaymentFilter('unresolved')}
                                                    >
                                                        Unresolved
                                                    </ToggleButton>
                                                </ToggleButtonGroup>
                                            </Box>
                                        </Box>

                                        {/* Payments Table */}
                                        {/* Payments Table */}
                                        <Box sx={{ p: 3 }}>
                                            {/* Desktop Table Header */}
                                            <Box
                                                sx={{
                                                    display: { xs: 'none', lg: 'grid' },
                                                    gridTemplateColumns: '0.8fr 1.2fr 2fr 1fr 0.8fr 1.5fr 1fr',
                                                    gap: 2,
                                                    p: 2,
                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                                    borderRadius: 2,
                                                    mb: 2,
                                                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Invoice ID
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Name
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Email
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Amount
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Currency
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Description
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.875rem',
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    Date
                                                </Typography>
                                            </Box>

                                            {/* Empty State */}
                                            {paymentsList.length === 0 && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        py: 8,
                                                        px: 3,
                                                        textAlign: 'center',
                                                        minHeight: 300,
                                                        border: `2px dashed ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <AttachMoney
                                                        sx={{
                                                            fontSize: 64,
                                                            color: theme.palette.text.secondary,
                                                            mb: 2,
                                                            opacity: 0.5
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 600,
                                                            mb: 1,
                                                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                                        }}
                                                    >
                                                        No Payments Yet
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            maxWidth: 400,
                                                            lineHeight: 1.6,
                                                            mb: 3,
                                                            fontSize: { xs: '0.875rem', sm: '1rem' }
                                                        }}
                                                    >
                                                        Your payment transactions will appear here once customers start using your payment buttons.
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Payments Table Rows */}
                                            {paymentsList.length > 0 && paymentsList.filter((item: PaymentListInterface) => !item.hasOwnProperty('error')).map((payment, index) => (
                                                <Box
                                                    key={payment.invoice_id || index}
                                                    sx={{
                                                        p: 2,
                                                        mb: 1,
                                                        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
                                                        borderRadius: 2,
                                                        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                        '&:hover': {
                                                            backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                                        },
                                                    }}
                                                >
                                                    {/* Desktop View */}
                                                    <Box
                                                        sx={{
                                                            display: { xs: 'none', lg: 'grid' },
                                                            gridTemplateColumns: '0.8fr 1.2fr 2fr 1fr 0.8fr 1.5fr 1fr',
                                                            gap: 2,
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        {/* Invoice ID */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 500,
                                                                color: theme.palette.primary.main
                                                            }}
                                                        >
                                                            #{payment.invoice_id}
                                                        </Typography>

                                                        {/* Name */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 500,
                                                                color: theme.palette.text.primary
                                                            }}
                                                        >
                                                            {payment.name || 'N/A'}
                                                        </Typography>

                                                        {/* Email */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.875rem'
                                                            }}
                                                        >
                                                            {payment.email
                                                                ? (payment.email.length > 20
                                                                    ? payment.email.slice(0, 20) + '...'
                                                                    : payment.email)
                                                                : 'N/A'}

                                                        </Typography>

                                                        {/* Amount */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: theme.palette.text.primary
                                                            }}
                                                        >
                                                            {payment.amount_to_be_paid ? Number(payment.amount_to_be_paid).toFixed(6) : '0.00'}
                                                        </Typography>

                                                        {/* Currency */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                textTransform: 'uppercase'
                                                            }}
                                                        >
                                                            {currencies.find(c => c.currency_id === payment.currency_id)?.currency_code}

                                                        </Typography>

                                                        {/* Description */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.875rem',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {payment.product_description || 'N/A'}
                                                        </Typography>

                                                        {/* Date */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.875rem',
                                                                textAlign: 'right'
                                                            }}
                                                        >
                                                            {payment.created ? new Date(payment.created).toLocaleDateString() : 'N/A'}
                                                        </Typography>
                                                    </Box>

                                                    {/* Mobile View */}
                                                    <Box sx={{ display: { xs: 'block', lg: 'none' }, width: '100%' }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                                                Invoice #{payment.invoice_id}
                                                            </Typography>
                                                            <Chip
                                                                label={payment.payment_confirmed_status === 1 ? 'Confirmed' : 'Pending'}
                                                                size="small"
                                                                color={payment.payment_confirmed_status === 1 ? 'success' : 'warning'}
                                                                sx={{ fontSize: '0.75rem' }}
                                                            />
                                                        </Box>

                                                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                                            {payment.name}
                                                        </Typography>

                                                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem', mb: 1 }}>
                                                            {payment.email}
                                                        </Typography>

                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {payment.amount_to_be_paid ? Number(payment.amount_to_be_paid).toFixed(6) : '0.00'}  {currencies.find(c => c.currency_id === payment.currency_id)?.currency_code}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                                                {payment.created ? new Date(payment.created).toLocaleDateString() : 'N/A'}
                                                            </Typography>
                                                        </Box>

                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.875rem',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {payment.product_description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))}

                                            {/* Pagination Footer */}
                                            {paymentsList.length > 0 && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        pt: 3,
                                                        mt: 3,
                                                        borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                        flexWrap: 'wrap',
                                                        gap: 2
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        Showing {paymentsList.filter(item => !item.hasOwnProperty('error')).length} of {paymentsList.find(item => item.total_count)?.total_count || paymentsList.filter(item => !item.hasOwnProperty('error')).length} payments
                                                    </Typography>
                                                    {paymentTotalCount > paymentPageSize && (
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => { handlePaymentPagination('prev') }}
                                                                sx={{
                                                                    color: theme.palette.text.secondary,
                                                                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                                                                    borderRadius: 1,
                                                                    '&.Mui-disabled': {
                                                                        opacity: 0.5
                                                                    }
                                                                }}
                                                            >
                                                                <ArrowBack sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => { handlePaymentPagination('next') }}
                                                                sx={{
                                                                    color: theme.palette.text.secondary,
                                                                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                                                                    borderRadius: 1,
                                                                    '&.Mui-disabled': {
                                                                        opacity: 0.5
                                                                    }
                                                                }}
                                                            >
                                                                <ArrowForward sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Fade>
                            </Paper>
                        </Box>
                    ) : (<Fragment>
                        <Paper
                            elevation={6}
                            sx={{
                                width: '100%',
                                maxWidth: 900,
                                mx: 'auto',
                                mt: 3,
                                borderRadius: 3,
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                overflow: 'hidden',
                            }}
                        >
                            <Fade in={true} timeout={800}>
                                <Box>
                                    {/* Wallet Header */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 3,
                                            borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="h5"
                                                sx={{
                                                    color: theme.palette.text.primary,
                                                    fontWeight: 700,
                                                    mb: 0.5,
                                                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                                                }}
                                            >
                                                Store Wallet
                                            </Typography>

                                        </Box>

                                        <Button
                                            disabled={loading}
                                            onClick={() => toggleScreen('button')}
                                            variant="outlined"
                                            startIcon={<Payments />}
                                            sx={{
                                                background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                px: 3,
                                                py: 1,
                                                border: 'none',
                                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                                                '&:hover': {
                                                    background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
                                                    transform: 'translateY(-1px)',
                                                },
                                                transition: 'all 0.3s ease-in-out'
                                            }}
                                        >
                                            Create Button
                                        </Button>
                                    </Box>

                                    {/* Wallet Assets */}
                                    <Box sx={{ p: 3 }}>
                                        {/* Asset Cards */}
                                        {currencies.map((currency, index) => (
                                            <Card
                                                key={currency.currency_id}
                                                elevation={0}
                                                sx={{
                                                    mb: 2,
                                                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                    borderRadius: 2,
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        borderColor: theme.palette.primary.main,
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 4px 12px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)'}`,
                                                    }
                                                }}
                                            >
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: { xs: 'column', sm: 'row' },
                                                            justifyContent: 'space-between',
                                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                                            gap: 2
                                                        }}
                                                    >
                                                        {/* Left Side - Asset Info */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <img
                                                                src={`${currency.logo}`}
                                                                alt="BitoCircle"
                                                                style={{
                                                                    width: 40,
                                                                    height: 40,
                                                                    cursor: 'pointer',
                                                                    display: 'block'
                                                                }}
                                                            />
                                                            <Box>
                                                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', color: theme.palette.text.primary }}>
                                                                    {currency.currency_code}
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.825rem' }}>
                                                                    {currency.currency_name}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        {/* Right Side - Balance and Buttons */}
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: { xs: 'column', sm: 'row' },
                                                                alignItems: { xs: 'stretch', sm: 'center' },
                                                                gap: 2,
                                                                width: { xs: '100%', sm: 'auto' }
                                                            }}
                                                        >
                                                            {/* Balance */}
                                                            <Box sx={{
                                                                textAlign: { xs: 'left', sm: 'right' },
                                                                minWidth: { sm: 120 }
                                                            }}>
                                                                <Typography variant="body2" sx={{
                                                                    color: theme.palette.text.secondary,
                                                                    fontSize: '0.75rem',
                                                                    mb: 0.5
                                                                }}>
                                                                    Balance
                                                                </Typography>
                                                                <Typography variant="body1" sx={{
                                                                    fontWeight: 600,
                                                                    color: theme.palette.text.primary,
                                                                    fontSize: '0.95rem'
                                                                }}>
                                                                    {currency.balance} {currency.currency_code}
                                                                </Typography>
                                                            </Box>

                                                            {/* Buttons Container */}
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 1,
                                                                    minWidth: { xs: '100%', sm: 200 },
                                                                    maxWidth: { xs: '100%', sm: 200 }
                                                                }}
                                                            >
                                                                {/* Withdraw Button */}
                                                                <Button
                                                                    disabled={loading}
                                                                    onClick={() => { handleWithdrawSetup(currency) }}
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    startIcon={<Download sx={{ fontSize: 16 }} />}
                                                                    sx={{
                                                                        color: '#1e3fad',
                                                                        borderColor: '#1e3fad',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 500,
                                                                        py: 0.75,
                                                                        px: 2,
                                                                        borderRadius: 2,
                                                                        borderWidth: 1.5,
                                                                        textTransform: 'none',
                                                                        transition: 'all 0.2s ease-in-out',
                                                                        '&:hover': {
                                                                            backgroundColor: theme.palette.mode === 'light'
                                                                                ? 'rgba(30, 64, 175, 0.08)'
                                                                                : 'rgba(66, 165, 245, 0.08)',
                                                                            borderColor: '#1e3fad',
                                                                            borderWidth: 1.5,
                                                                        },
                                                                        '&:disabled': {
                                                                            opacity: 0.5,
                                                                        }
                                                                    }}
                                                                >
                                                                    Withdraw
                                                                </Button>

                                                                {/* Convert to Bito Dollar Button */}
                                                                {currency.currency_code !== 'USDB' &&
                                                                    <BitoDollarConvertContent
                                                                        assetId={currency.currency_id.toString()}
                                                                        assetCode={currency.currency_code}
                                                                        balance={currency.balance.toString()}
                                                                        themeMode={mode}
                                                                        onConversionSuccess={handleOnConversionSuccess}
                                                                    />
                                                                }
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}


                                    </Box>
                                    {/* Integrated Transaction History Section */}
                                    <Box sx={{ borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}` }}>
                                        {/* Transaction History Header */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 3,
                                                borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                flexWrap: 'wrap',
                                                gap: 2
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: theme.palette.text.primary,
                                                        fontWeight: 600,
                                                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                                    }}
                                                >
                                                    Transactions History
                                                </Typography>

                                            </Box>


                                        </Box>

                                        {/* Transaction Content */}
                                        <Box sx={{ minHeight: 300 }}>
                                            {/* Desktop Table Header */}
                                            <Box
                                                sx={{
                                                    display: { xs: 'none', lg: 'flex' },
                                                    p: 2,
                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                }}
                                            >
                                                {['Txn Id', 'TimeStamp', 'Description', 'Asset', 'Amount', 'Status'].map((header, index) => (
                                                    <Typography
                                                        key={header}
                                                        variant="body2"
                                                        sx={{
                                                            flex: index === 1 ? 2 : 1,
                                                            fontWeight: 600,
                                                            color: theme.palette.text.secondary,
                                                            fontSize: '0.875rem',
                                                            textAlign: index === 3 ? 'right' : 'left',
                                                            px: 1
                                                        }}
                                                    >
                                                        {header}
                                                    </Typography>
                                                ))}
                                            </Box>
                                            {/* For no transaction exist */}
                                            {txnList.length === 0 && <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    py: 6,
                                                    px: 3,
                                                    textAlign: 'center',
                                                    minHeight: 200
                                                }}
                                            >
                                                <History
                                                    sx={{
                                                        fontSize: 64,
                                                        color: theme.palette.text.secondary,
                                                        mb: 2,
                                                        opacity: 0.5
                                                    }}
                                                />
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: theme.palette.text.primary,
                                                        fontWeight: 600,
                                                        mb: 1,
                                                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                                    }}
                                                >
                                                    No Transaction Data
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: theme.palette.text.secondary,
                                                        maxWidth: 400,
                                                        lineHeight: 1.6,
                                                        mb: 3,
                                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                                    }}
                                                >
                                                    Your transaction history will appear here once you start withdraw.
                                                </Typography>

                                            </Box>}

                                            {/* For existing transation */}
                                            {txnList.length > 0 && txnList.map((txn: Transaction, index) =>
                                                <Box
                                                    key={txn.transaction_id || index}
                                                    sx={{
                                                        display: 'flex',
                                                        p: 2,
                                                        mb: 1,
                                                        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
                                                        borderRadius: 2,
                                                        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                        '&:hover': {
                                                            backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                                        },
                                                        flexDirection: { xs: 'column', lg: 'row' },
                                                        gap: { xs: 1, lg: 0 }
                                                    }}
                                                >
                                                    {/* Desktop View */}
                                                    <Box sx={{ display: { xs: 'none', lg: 'flex' }, width: '100%' }}>
                                                        {/* Txn ID */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                flex: 1,
                                                                px: 1,
                                                                fontWeight: 500,
                                                                color: theme.palette.primary.main
                                                            }}
                                                        >
                                                            #{txn.transaction_id}
                                                        </Typography>

                                                        {/* Date */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                flex: 1,
                                                                px: 1,
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.875rem',
                                                                textAlign: 'right'
                                                            }}
                                                        >
                                                            {txn.transaction_timestamp ? new Date(txn.transaction_timestamp).toLocaleDateString() : 'N/A'}
                                                        </Typography>

                                                        {/* Description */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                flex: 1,
                                                                px: 1,
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.875rem'
                                                            }}
                                                        >
                                                            {txn.description || 'N/A'}
                                                        </Typography>

                                                        {/* Asset */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                flex: 1.5,
                                                                px: 1,
                                                                fontWeight: 500,
                                                                color: theme.palette.text.primary
                                                            }}
                                                        >
                                                            {txn.name || 'N/A'}
                                                        </Typography>

                                                        {/* Amount */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                flex: 1,
                                                                px: 1,
                                                                fontWeight: 600,
                                                                color: theme.palette.text.primary
                                                            }}
                                                        >
                                                            {txn.debit_amount ? Number(txn.debit_amount).toFixed(6) : '0.00'}
                                                        </Typography>

                                                        {/* Status */}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                flex: 1,
                                                                px: 1,
                                                                fontWeight: 600,
                                                                color: txn.status.toLowerCase() === 'pending' ? '#1e40af' : txn.status.toLowerCase() === 'confirmed' ? '#13ef43' : '#ef1c13',
                                                            }}
                                                        >
                                                            {txn.status}
                                                        </Typography>


                                                    </Box>

                                                    {/* Mobile View */}
                                                    <Box sx={{ display: { xs: 'block', lg: 'none' }, width: '100%' }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                                                Invoice #{txn.transaction_id}
                                                            </Typography>
                                                            <Chip
                                                                label={txn.status}
                                                                size="small"
                                                                color={txn.status.toLowerCase() === 'pending' ? 'warning' : txn.status.toLowerCase() === 'confirmed' ? 'success' : 'error'}
                                                                sx={{ fontSize: '0.75rem' }}
                                                            />
                                                        </Box>



                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {txn.debit_amount ? Number(txn.debit_amount).toFixed(6) : '0.00'} {txn.name}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                                                                {txn.transaction_timestamp ? new Date(txn.transaction_timestamp).toLocaleDateString() : 'N/A'}
                                                            </Typography>
                                                        </Box>

                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                fontSize: '0.875rem',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {txn.description}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )

                                            }

                                            {/* Pagination Footer */}
                                            {txnList.length > 0 && <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    p: 2,
                                                    borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                    flexWrap: 'wrap',
                                                    gap: 2
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: theme.palette.text.secondary,
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    Showing {txnList.length} of {txnTotalCount} transactions
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => { handleTxnPagination('prev') }}
                                                        disabled
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                                                            borderRadius: 1,
                                                            '&.Mui-disabled': {
                                                                opacity: 0.5
                                                            }
                                                        }}
                                                    >
                                                        <ArrowBack sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => { handleTxnPagination('next') }}
                                                        disabled
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                                                            borderRadius: 1,
                                                            '&.Mui-disabled': {
                                                                opacity: 0.5
                                                            }
                                                        }}
                                                    >
                                                        <ArrowForward sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>}
                                        </Box>
                                    </Box>
                                </Box>
                            </Fade>
                        </Paper>

                    </Fragment>)}
                </Fragment>}
            </Container>

            {/* Modal for send */}
            <Dialog
                open={openWithdrawModal}
                onClose={() => setOpenWithdrawModal(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        m: 2
                    }
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    textAlign: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #494a4bff',
                    pb: 2
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Withdraw {selectedCryptoForWalletProcess?.currency_code}
                    </Typography>
                    <IconButton
                        onClick={() => setOpenWithdrawModal(false)}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ px: 3, py: 0, backgroundColor: 'background.paper' }}>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        {/* Balance Display */}
                        <Box sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            color: 'primary.main',
                            p: 2,
                            borderRadius: theme.shape.borderRadius,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WalletIcon sx={{ color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                    Available Balance
                                </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {selectedCryptoForWalletProcess?.balance || 0}   {selectedCryptoForWalletProcess?.currency_code}
                            </Typography>
                        </Box>

                        {/* Receiver's Address */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                Recipient Address
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="0x..."
                                value={withdrawAddress}
                                onChange={(e) => handleWithdrawAddress(e.target.value)}
                                /*  error={!!errors.receiverAddress}
                                 helperText={errors.receiverAddress} */
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <WalletIcon color="action" />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            boxShadow: theme.palette.mode === 'light'
                                                ? '0 4px 12px rgba(0,0,0,0.1)'
                                                : '0 4px 12px rgba(0,0,0,0.3)'
                                        },
                                        '&.Mui-focused': {
                                            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`
                                        }
                                    }
                                }}
                            />
                            {withdrawAddressValidate !== 'blank' && <Typography variant="h6" sx={{ mt: '2px', mb: '2px', fontWeight: 300, textAlign: 'center', color: withdrawAddressValidate === 'valid' ? 'green' : 'red' }}>
                                {withdrawAddressValidate === 'valid' ? `Address is valid` : `Address not valid`}
                            </Typography>}
                        </Box>
                        {/* Token type */}
                        {selectedCryptoForWalletProcess?.network && selectedCryptoForWalletProcess.network.length > 1 && <Box sx={{ flex: 1, width: '100%' }}>
                            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                Token
                            </Typography>
                            <FormControl fullWidth>
                                <Select
                                    displayEmpty
                                    value={selectedNetworkForWithdraw}
                                    onChange={(e) => setselectedNetworkForWithdraw(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                boxShadow: theme.palette.mode === 'light'
                                                    ? '0 4px 12px rgba(0,0,0,0.1)'
                                                    : '0 4px 12px rgba(0,0,0,0.3)'
                                            },
                                            '&.Mui-focused': {
                                                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        <Typography sx={{ color: theme.palette.text.secondary }}>
                                            Select Network
                                        </Typography>
                                    </MenuItem>
                                    {selectedCryptoForWalletProcess?.network.map((token: string) => (
                                        <MenuItem value={token} key={token}>{token}</MenuItem>
                                    ))}

                                </Select>
                            </FormControl>
                        </Box>}

                        {/*  Tag */}
                        {selectedCryptoForWalletProcess?.is_broker_currency === 1 || selectedCryptoForWalletProcess?.currency_code === 'HCX' || selectedCryptoForWalletProcess?.currency_code === 'XRP' && <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    {selectedCryptoForWalletProcess?.currency_code} Tag
                                </Typography>
                                <Tooltip title="Optional identifier for tracking transactions">
                                    <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                </Tooltip>
                            </Box>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Optional transaction memo"
                                value={withdrawMemo}
                                onChange={(e) => setWithdrawMemo(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            boxShadow: theme.palette.mode === 'light'
                                                ? '0 4px 12px rgba(0,0,0,0.1)'
                                                : '0 4px 12px rgba(0,0,0,0.3)'
                                        }
                                    }
                                }}
                            />
                        </Box>}

                        {/* Amount */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                Amount
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                type="number"
                                placeholder="0.00"
                                defaultValue={amountForWithdraw}
                                onChange={(e) => handleWithdrawAmount(e as React.ChangeEvent<HTMLInputElement>)}
                                /*  error={!!errors.amount}
                                 helperText={errors.amount} */
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleMaxAmount}
                                                sx={{
                                                    minWidth: 'auto',
                                                    px: 2,
                                                    fontWeight: 600
                                                }}
                                            >
                                                MAX
                                            </Button>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            boxShadow: theme.palette.mode === 'light'
                                                ? '0 4px 12px rgba(0,0,0,0.1)'
                                                : '0 4px 12px rgba(0,0,0,0.3)'
                                        },
                                        '&.Mui-focused': {
                                            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`
                                        }
                                    }
                                }}
                            />
                        </Box>

                        {/* Submit Button */}
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading}
                            onClick={handleWithdrawSubmit}
                            startIcon={loading ? null : <SendIcon />}
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                fontWeight: 600,
                                fontSize: '1rem',
                                textTransform: 'none',
                                boxShadow: theme.palette.mode === 'light'
                                    ? '0 8px 25px rgba(30, 64, 175, 0.35)'
                                    : '0 8px 25px rgba(66, 165, 245, 0.35)'
                                ,
                                '&:hover': {
                                    boxShadow: theme.palette.mode === 'light'
                                        ? '0 12px 35px rgba(30, 64, 175, 0.45)'
                                        : '0 12px 35px rgba(66, 165, 245, 0.45)'
                                    ,

                                },
                                transition: 'all 0.3s ease-in-out'
                            }}
                        >
                            {loading ? 'Processing Transaction...' : 'Send Transaction'}
                        </Button>

                        <Divider sx={{ my: 1 }} />

                        {/* Network Fee Estimation */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <SpeedIcon sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    Network Fee Estimation : {estimatedNetworkFee}
                                </Typography>
                            </Box>
                            {parseFloat(gstCharges) > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Info sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    GST : {gstCharges}
                                </Typography>
                            </Box>}
                            {parseFloat(tdsCharges) > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Info sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    TDS : {tdsCharges}
                                </Typography>
                            </Box>}


                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Range:
                                </Typography>
                                <Chip
                                    label={`${selectedCurrencyFees?.FROMFEE || 0} ${selectedCryptoForWalletProcess?.currency_code}`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                />
                                <Typography variant="body2" color="text.secondary">
                                    to
                                </Typography>
                                <Chip
                                    label={`${selectedCurrencyFees?.TOFEE || 0} ${selectedCryptoForWalletProcess?.currency_code}`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                />
                            </Box>

                        </Box>

                        {/* Security Notice */}
                        <Alert
                            severity="warning"
                            icon={<SecurityIcon />}
                            sx={{
                                '& .MuiAlert-message': {
                                    fontSize: '0.875rem'
                                }
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Security Notice
                            </Typography>
                            Ensure the transfer network is ERC-20 compatible. Incompatible networks may result in permanent asset loss.
                        </Alert>


                    </Stack>
                </DialogContent>
            </Dialog>
            {/* Share Content Dialog */}
            <ShareContentDialog
                open={openShareDialog}
                onClose={() => setOpenShareDialog(false)}
                contentId={merchantId}
                contentType={shareType === 'html' ? 'CODE' : 'TEXT'}
                message={shareType === 'html'
                    ? `${generateCode()}`
                    : `${generateLink()}`
                }
                userId={merchantId}
                onShareSuccess={handleShareSuccess}
            />

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

export default FinanceHubPaymentsPage;