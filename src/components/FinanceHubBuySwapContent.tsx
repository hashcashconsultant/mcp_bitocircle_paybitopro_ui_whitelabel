// content of page /finance-hub/buy-and-swap-crypto
'use client';
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import QrCode from '../components/common/QRCode';
import { AMOUNTREGEX } from '../types/regex';
import ShareContentDialog from '@/components/ShareContentDialog';

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
    alpha,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
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
    Search,
    Close,
    Share as ShareIcon
} from '@mui/icons-material';
import { CRYPTOIMAGEURL, getUserBankDetails, getBitoHubUserInfo, getUserSettings } from '../services/CoreDataService';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import BitoDollarConvertContent from './BitoDollarConvertContent';


const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';

export interface BankDetails {
    bankDetailsResult: {
        bank_details_id: number;
        user_id: number;
        uuid: string | null;
        beneficiary_name: string;
        bank_name: string;
        bankAddress: string;
        accountType: string;
        account_no: string;
        routing_no: string;
        swiftCode: string;
        ifscCode: string;
        verification_amount: number;
        bank_cheque: string;
        adminUser: string | null;
    };
    error: {
        error_data: number;
        error_msg: string;
    };
}

interface Token {
    baseCurrency: string | null;
    currency: string | null;
    currencyId: number;
    currencyName: string | null;
    tokenType: string;
}

interface CustomerLedgerResult {
    customerLedgerId: number;
    customerId: number;
    customerName: string | null;
    privateKey: string | null;
    publicKey: string;
    currencyId: number;
    currentBalance: number;
    createdBy: string | null;
    creationDate: string | null;
    modificationDate: string | null;
    isDeleted: number;
    memo: string | null;
}
interface TransactionLimitResponse {
    error: string,
    value: FiatTierSettings | undefined
}
interface ApiResponse {
    error: {
        error_data: number
        error_msg: string
    },
    statuscode: string,
    adminBankDetails: AdminBankDetails[] | null,
    status: number,
    message: string,
    price: string,
    marketPrice: string,
    buySellFlag: number,
    invoicesListResult: [],
    withdrawalListResult: [],
    currencyList: [],
    baseCurrencyList: [],
    feesListResult: [],
    userBalanceList: Asset[],
    value: string,
    response: [],
    fees: Fees | null
    isValid: number;
    customerLedgerResult: CustomerLedgerResult | null,
    userTransactionsResult: [];
    totalCount: number;
    tierWiseTransactionSettingsList: FiatTierSettings[];
}

export interface FiatTierSettings {
    currencyId: number;
    currency: string;
    tierType: number;
    minLimit: number;
    dailySendLimit: number;
    monthlySendLimit: number;
    dailySellLimit: number;
    dailyBuyLimit: number;
    makerCharge: number;
    takerCharge: number;
    discountMakerCharge: number;
    discountTakerCharge: number;
    txnCharge: number;
    minBalance: number;
}




interface TradingFeesResponse {
    value: Array<{
        id: number;
        volumeFrom: number;
        volumeTo: number;
        makerFee: number;
        takerFee: number;
        discountMakerFee: number;
        discountTakerFee: number;
        totalFees: number | null;
        totalVolume: number | null;
        updatedOn: string | null;
    }>;  // Replace 'any' with specific type if known
    error?: {
        error_data: number;
        error_msg: string;
    }
}

interface UserTradingFeeResponse {
    userTradingFees: Array<{
        totalVolume: string;
        totalFees: string;
        makerFee: string;
        takerFee: string;
    }>;
}

interface ExchangeFee {
    id: number;
    volumeFrom: number;
    volumeTo: number;
    makerFee: number;
    takerFee: number;
    discountMakerFee: number;
    discountTakerFee: number;
    totalFees: number | null;
    totalVolume: number | null;
    updatedOn: string | null;
}

interface Fees {
    feeID: number | null;
    currencyId: number;
    currency: string;
    fromFee: number;
    toFee: number;
    minFee: number;
    feeRate: number;
    totalFees: number;
    currencyPrecision: number;
    gstCharge: number;
    tdsCharge: number;
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
    isBrokerCurrency: number;
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
    tokens: Array<Token>;
    fees: Fees;
}

interface WalletTransaction {
    transactionId: number;
    userId: number;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    email: string;
    description: string;
    action: string;
    status: number | string;
    transactionTimestamp: string; // You can convert to Date if needed
    timestamp: string; // You can convert to Date if needed
    orderId: string;
    tradeId: string;
    offerId: string;
    offerQty: string;
    offerPrice: string;
    requestAmount: string;
    requestPrice: string;
    currency: string;
    baseCurrency: string | null;
    currencyTxnid: string;
    debitAmount: string;
    creditAmount: string;
    miningfees: string;
    txncharge: string;
    networkfees: string;
    openingBalance: string;
    closingBalance: string;
    tradeAssetAmount: string;
    currencyUrl: string;
    copyTradeFlag: string;
    gst: string;
    tds: string;
    tdsInInr: string;
    gstInInr: string;
    isBalanceLocked: number;
    isTravelData: number;
    sendReceiveType: string;
    created: string;
    order_no: string;
    withdrawalId: string;
    amount: number;
    txnCharge: number;
}

interface AllAssets {
    baseCurrencyId: number;
    baseCurrency: string;
    currencyCode: string;
    currencyName: string | null;
    currencyId: number;
    roc: number;
    ltpValue: number;
    ltpConvValue: number;
    volume: number;
    currencyType: 1 | 2 | 3; // if only fixed possible types
    action: 'buy' | 'sell';  // restrict possible values
    assetCode: string;
    amountPrecision: number;
    pricePrecision: number;
    assetPair: string | null;
    assetPairName: string | null;
    contractValue: number | null;
    brokerId: number | null;
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
interface Charges {
    networkFees: string;
    gstCharges: string;
    tdsCharges: string;
}

interface BuySellTransaction {
    transactionId: number;
    userId: number;
    firstName: string;
    middleName: string | null;
    lastName: string | null;
    email: string;
    description: string;
    action: string;
    status: number;
    transactionTimestamp: string;
    orderId: string | null;
    tradeId: string;
    offerId: string;
    offerQty: string;
    offerPrice: string;
    requestAmount: string;
    requestPrice: string;
    currency: string;
    baseCurrency: string;
    currencyTxnid: string | null;
    debitAmount: string;
    creditAmount: string;
    miningfees: string;
    txncharge: string;
    networkfees: string;
    openingBalance: string;
    closingBalance: string;
    tradeAssetAmount: string;
    currencyUrl: string;
    copyTradeFlag: string;
    gst: string | null;
    tds: string;
    tdsInInr: string;
    gstInInr: string;
    isBalanceLocked: number;
    isTravelData: number;
    sendReceiveType: string | null;
}

export interface AdminBankDetails {
    bankId: number;
    bankName: string;
    bankAddress: string;
    accountNo: string;
    accountType: string;
    beneficiaryName: string;
    beneficiaryAddress: string;
    routingNo: string | null;
    swiftCode: string | null;
    ibanNo: string | null;
    ifscCode: string | null;
    currencyId: number | null;
    currencyCode: string | null;
    adminUser: string | null;
    brokerEmail: string | null;
}




const FinanceHubBuySwapPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('')
    const [isLoginSectionEnabled, setIsLoginSectionEnabled] = useState(false);
    const [loginText, setLoginText] = useState('');
    const [purchaseType, setPurchaseType] = useState<'buy' | 'sell'>('buy');
    const [showWallet, setShowWallet] = useState<boolean>(false);
    const [transactionFilter, setTransactionFilter] = useState<'send' | 'received' | 'deposit' | 'withdraw'>('send');
    const [allAssets, setAllAssets] = useState([]);
    const [openFeesModal, setOpenFeesModal] = useState<boolean>(false)
    const [openSendModal, setOpenSendModal] = useState<boolean>(false)
    const [openReceiveModal, setOpenReceiveModal] = useState<boolean>(false)
    const [openDepositModal, setOpenDepositModal] = useState<boolean>(false)
    const [openWithdrawModal, setOpenWithdrawModal] = useState<boolean>(false);
    const [selectedCryptoForWalletProcess, setSelectedCryptoForWalletProcess] = useState<Asset | null>(null)
    const [selectedTokenType, setSelectedTokenType] = useState('');
    const [sendMemo, setSendMemo] = useState('');
    const [receiveMemo, setReceiveMemo] = useState<string | null>(null);
    const [brokerId, setBrokerId] = useState<string>('');
    const [brokerCountry, setBrokerCountry] = useState<string>('');
    const [userUuid, setUserUuid] = useState<string>('');
    const [userId, setUserId] = useState<number>(0);
    const [userKycTierType, setUserKycTierType] = useState<number>(1);
    const [counterAssets, setCounterAssets] = useState([]);
    const [baseAssets, setBaseAssets] = useState([]);
    const [selectedCounterAsset, setSelectedCounterAsset] = useState<string>('')
    const [selectedBaseAsset, setSelectedBaseAsset] = useState<string>('')
    const [copied, setCopied] = useState(false);
    const [addressForReceive, setAddressForReceive] = useState('')
    const [walletTransactions, setWalletTransactions] = useState([])
    const [walletList, setWalletList] = useState<Asset[]>([])
    const [rawWalletList, setRawWalletList] = useState<Asset[]>([])
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [buySellAmount, setBuySellAmount] = useState('')
    const [buySellMarketPrice, setBuySellMarketPrice] = useState('')
    const [buySellTotalPrice, setBuySellTotalPrice] = useState('')
    const [isBuySellEligible, setIsBuySellEligible] = useState(false);
    const [sellingAssetBalance, setSellingAssetBalance] = useState<number>(0);
    const [userExchangeFee, setUserExchangeFee] = useState({
        totalVolume: '0',
        totalFees: '0',
        makerFee: '0',
        takerFee: '0',
    });
    const [charges, setCharges] = useState({
        networkFees: '0',
        gstCharges: '0',
        tdsCharges: '0',
    })
    const [exchangeFees, setExchangeFees] = useState<ExchangeFee[]>([]);
    const [amountForSend, setAmountForSend] = useState('')
    const [amountForDeposit, setAmountForDeposit] = useState('')
    const [amountForWithdraw, setAmountForWithdraw] = useState('')
    const [sendAddress, setSendAddress] = useState('')
    const [sendAddressValidate, setSendAddressValidate] = useState<'valid' | 'invalid' | 'blank'>('blank')
    const [pageNo, setPageNo] = useState<number>(1)
    const [noOfItemsPerPage, setNoOfItemsPerPage] = useState<number>(20)
    const [totalCount, setTotaCount] = useState<number>(0)
    const [buySellTxnHistory, setBuySellTxnHistory] = useState<BuySellTransaction[]>([]);
    const [buySellTxnPageNo, setBuySellTxnPageNo] = useState<number>(1);
    const [buySellTxnTotalCount, setBuySellTxnTotalCount] = useState<number>(0);
    const [selectedAdminBankDetails, setSelectedAdminBankDetails] = useState<AdminBankDetails | null>(null);
    const [twoFactorOTPForWithdraw, setTwoFactorOTPForWithdraw] = useState('');
    const [twoFactorOTPForSend, setTwoFactorOTPForSend] = useState('');
    const [openShareDialog, setOpenShareDialog] = useState(false);
    const [messageForShare, setMessageForShare] = useState('');
    // Loading and notification states
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
    const [tierWiseSettings, setTierWiseSettings] = useState<FiatTierSettings[]>([]);
    const [selectedFiatTier, setSelectedFiatTier] = useState<FiatTierSettings | null>(null);

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

    const toggleTheme = async () => {
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
            const userData = localStorage.getItem('finance_hub_user')
            if (userData === null || userData === undefined) {
                showSnackbar(`Failed to retrive user data`, 'error');
                router.push(`/finance-hub`);
                return;
            }
            const userObj = JSON.parse(userData);
            setBrokerId(userObj.brokerId);
            setBrokerCountry(userObj.country);
            setUserUuid(userObj.uuid);
            setUserId(userObj.userId);
            setUserKycTierType(userObj.userTierType);
            await getWalletDetails(userObj.uuid);
            const screen = localStorage.getItem('show_screen') || null;
            setShowWallet(screen === 'wallet');
            if (screen === 'wallet') {
                await getUserTransaction(pageNo, transactionFilter, userObj.uuid);
                return;
            }
            await getAllCounterAssets(userObj.brokerId);
            await getBuySellTxnHistory(userObj.uuid, buySellTxnPageNo);


        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setInitialLoading(false);
        }



    }


    /* Method defination to show asset ballnace in buy sell section */

    const getSellingAssetBalance = async (currencyCode: string) => {
        if (!currencyCode || currencyCode === '') {
            setSellingAssetBalance(0);
            return;
        }

        // Reuse existing wallet list if available
        if (walletList.length > 0) {
            const asset = walletList.find((item: Asset) =>
                item.currencyCode.toLowerCase() === currencyCode.toLowerCase()
            );

            if (asset) {
                setSellingAssetBalance(asset.closingBalance ?? 0);
                return;
            }
        }

        // If wallet list is empty, fetch user balance
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            userUuid: userUuid,
        }

        try {
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/getUserBalance`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );
            const error = response.data.error;
            if (error.error_data === 1) {
                setSellingAssetBalance(0);
                return;
            }

            const userBalanceList = response.data.userBalanceList;
            const asset = userBalanceList.find((item: Asset) =>
                item.currencyCode.toLowerCase() === currencyCode.toLowerCase()
            );

            setSellingAssetBalance(asset ? asset?.closingBalance : 0);
        } catch (error) {
            console.error('Failed to get selling asset balance', error);
            setSellingAssetBalance(0);
        }
    };


    /* Method defination for checking if user is blocked by admin or not */
    const checkUserBlockStatus = async () => {
        const payload = { uuid: userUuid }
        try {
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/userAccountStatus`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('')}`,
                    }
                }
            );
            if (response.data.error?.error_data !== 0) {
                showSnackbar(response.data.error.error_msg, 'error');
                return false;
            }

            if (response.data?.status !== 1) {
                showSnackbar('Your user has been blocked by Admin', 'error');
                return false;
            }

            return true;
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

    /* Method defination to fetch token type of selected currency */

    const getCurrencyTokens = async (currencyId: number) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            currencyId,
        }
        try {
            setLoading(true)
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/currencyTokenTypeById`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response.data.error;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return false;
            }
            return response.data.response as Token[];
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

    /* Method defination to get all fees by currency */
    const getFeesByCurrency = async (currencyId: number, token: string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            currencyId,
            tokenType: token,
            country: brokerCountry
        }
        try {
            setLoading(true);
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/getFeesByCurrencyId`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response.data.error;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return false;
            }
            return response.data.fees as Fees;

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

    /* Method defination get fees by amount  */
    const getFeesForCharges = async (tokenType: string, amount: string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            currencyId: selectedCryptoForWalletProcess?.currencyId,
            tokenType,
            amount: parseFloat(amount),
            country: brokerCountry,
        }
        try {
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/getFees`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response.data.error;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            const defaultFees: Fees = {
                feeID: null,
                currencyId: 0,
                currency: selectedCryptoForWalletProcess?.currencyId.toString() || '',
                fromFee: 0,
                toFee: 0,
                minFee: 0,
                feeRate: 0,
                totalFees: 0,
                currencyPrecision: 0,
                gstCharge: 0,
                tdsCharge: 0,
            };


            const feesResult = response?.data?.feesListResult;
            if (feesResult && Array.isArray(feesResult) && feesResult.length > 0) {
                return feesResult[feesResult.length - 1] as Fees;
            }
            return defaultFees;

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


    /* Method defination for validating amount and generatings network fees for deposit  */
    const handleDepositAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // ✅ Allow empty value (Backspace to clear)
        if (value === '') {
            setAmountForDeposit('')
            return;
        }

        // ✅ Only then clean unwanted characters
        const cleanedValue = value
            .replace(/[^0-9.]/g, '')     // allow only numbers and dot
            .replace(/(\.).*?\./g, '$1'); // ensure only one dot

        event.target.value = cleanedValue;
        setAmountForDeposit(cleanedValue)

    }
    /* Method defination for validating amount and generatings network fees for withdraw  */
    const handleWithdrawAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // ✅ Allow empty value (Backspace to clear)
        if (value === '') {
            setAmountForWithdraw('')
            return;
        }

        // ✅ Only then clean unwanted characters
        const cleanedValue = value
            .replace(/[^0-9.]/g, '')     // allow only numbers and dot
            .replace(/(\.).*?\./g, '$1'); // ensure only one dot

        event.target.value = cleanedValue;
        setAmountForWithdraw(cleanedValue)

    }

    /* method defination for submitting deposit */
    const handleDepositSubmit = async () => {
        if (amountForDeposit === '' || parseFloat(amountForDeposit) <= 0) {
            showSnackbar('Please enter a valid amount to deposit', 'error');
            return;
        } else if ((parseFloat(amountForDeposit) > (selectedFiatTier?.dailySendLimit || 0) || (parseFloat(amountForDeposit) < (selectedFiatTier?.minLimit || 0)))) {
            showSnackbar(`Deposit amount must be within the limit of ${selectedFiatTier?.minLimit} and ${selectedFiatTier?.dailySendLimit}`, 'error');
            return;
        }

        const payload = {
            adminUser: localStorage.getItem('uuid'),
            userUuid: userUuid,
            currencyId: selectedCryptoForWalletProcess?.currencyId,
            amount: amountForDeposit,
            bankId: selectedAdminBankDetails?.bankId,
            paymentMethod: '',
            referenceNo: ''
        }

        try {
            setLoading(true);
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/createPaymentOrder`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response.data.error;
            if (error?.error_data !== 0) {
                showSnackbar(error.error_msg, 'error');
                return false;
            }
            setOpenDepositModal(false);
            setAmountForDeposit('');
            showSnackbar('Deposit request submitted successfully', 'success');
            await getWalletDetails(userUuid);
            await getUserTransaction(pageNo, transactionFilter, userUuid);
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
    /* method defination for submitting withdraw */
    const handleWithdrawSubmit = async () => {
        if (twoFactorOTPForWithdraw === '' ) {
            showSnackbar('Please enter valid 2FA OTP', 'error');
            return;
        }
        else if (amountForWithdraw === '' || parseFloat(amountForWithdraw) <= 0) {
            showSnackbar('Please enter a valid amount to withdraw', 'error');
            return;
        } else if (parseFloat(amountForWithdraw) > (selectedCryptoForWalletProcess?.closingBalance || 0)) {
            showSnackbar('Withdraw amount must be greater than or equal to current balance', 'error');
            return;
        } else if ((parseFloat(amountForWithdraw) > (selectedFiatTier?.dailySendLimit || 0) || (parseFloat(amountForWithdraw) < (selectedFiatTier?.minLimit || 0)))) {
            showSnackbar(`Withdraw amount must be within the limit of ${selectedFiatTier?.minLimit} and ${selectedFiatTier?.dailySendLimit}`, 'error');
            return;
        }

        try {
            const responseBankDetails = await getUserBankDetails({ uuid: userUuid });
            const bankDetails = (responseBankDetails && responseBankDetails.data) as BankDetails;
            const error = bankDetails.error;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            const payload = {
                adminUser: localStorage.getItem('uuid'),
                userUuid: userUuid,
                currencyId: selectedCryptoForWalletProcess?.currencyId,
                amount: amountForWithdraw,
                bankId: bankDetails?.bankDetailsResult?.bank_details_id,
                securityCode: twoFactorOTPForWithdraw
            }
            try {
                setLoading(true);
                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/createWithdrawalOrder`, payload,
                    {
                        headers: {
                            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                        }
                    }
                );
                const error = response.data.error;
                if (error?.error_data !== 0) {
                    showSnackbar(error.error_msg, 'error');
                    return false;
                }
                setOpenWithdrawModal(false);
                setAmountForWithdraw('');
                showSnackbar('Withdraw request submitted successfully', 'success');
                await getWalletDetails(userUuid);
                await getUserTransaction(pageNo, transactionFilter, userUuid);
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

    /* Method defination for validating amount and generatings network fees for send  */
    const handleSendAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // ✅ Allow empty value (Backspace to clear)
        if (value === '') {
            setAmountForSend('')
            return;
        }

        // ✅ Only then clean unwanted characters
        const cleanedValue = value
            .replace(/[^0-9.]/g, '')     // allow only numbers and dot
            .replace(/(\.).*?\./g, '$1'); // ensure only one dot

        event.target.value = cleanedValue;
        setAmountForSend(cleanedValue)
        if (parseFloat(cleanedValue) > 0) {
            const rates = await getFeesForCharges(selectedTokenType, cleanedValue);
            const precision = selectedCryptoForWalletProcess?.fees?.currencyPrecision || 3;
            const networkFees = rates && rates.totalFees ? rates.totalFees : 0;
            const gst = rates && rates.gstCharge !== 0
                ? parseFloat(cleanedValue) * (rates.gstCharge / 100)
                : 0;
            const tds = rates && rates.tdsCharge !== 0
                ? parseFloat(cleanedValue) * (rates.tdsCharge / 100)
                : 0;
            setCharges({
                networkFees: networkFees.toFixed(precision),
                gstCharges: gst.toFixed(precision),
                tdsCharges: tds.toFixed(precision),
            })
        }
    }

    /* Method defination click on max button */
    const handleMaxAmount = async () => {
        const balance = selectedCryptoForWalletProcess?.closingBalance || 0;
        if (balance === 0) {
            showSnackbar('Insufficient Balance', 'error');
            return;
        }
        const minFee = selectedCryptoForWalletProcess?.fees?.minFee || 0;
        const feeRate = selectedCryptoForWalletProcess?.fees?.feeRate || 0;
        const precision = selectedCryptoForWalletProcess?.fees?.currencyPrecision || 3;
        const rates = await getFeesForCharges(selectedTokenType, balance.toString());
        const gstRate = rates && rates.gstCharge !== 0
            ? balance * (rates.gstCharge / 100)
            : 0;
        const tdsRate = rates && rates.tdsCharge !== 0
            ? balance * (rates.tdsCharge / 100)
            : 0;
        const calculatedFeeRate = ((balance - minFee) * feeRate) / 100;
        const gst = (minFee + feeRate) * (gstRate / 100);
        const tds = (balance - (minFee + feeRate + gst)) * (tdsRate / 100);
        const networkFees = rates && rates.totalFees ? rates.totalFees : 0;
        setAmountForSend(balance.toFixed(precision))
        setCharges({
            networkFees: networkFees.toFixed(precision),
            gstCharges: gst.toFixed(precision),
            tdsCharges: tds.toFixed(precision),
        })

    }

    /* Method defination for API call of token chnage */
    const handleTokenChangeForSend = async (token: string) => {
        setSelectedTokenType(token);
        if (selectedCryptoForWalletProcess?.currencyId) {
            const fees = await getFeesByCurrency(selectedCryptoForWalletProcess.currencyId, token);
            const cryptoWithTokens = { ...selectedCryptoForWalletProcess, fees: fees || {} as Fees };
            setSelectedCryptoForWalletProcess(cryptoWithTokens);
        }
    }
    /* Method defination for API call of token chnage */
    const handleTokenChangeForReceive = async (token: string) => {
        setSelectedTokenType(token);
        if (selectedCryptoForWalletProcess?.currencyId) {
            const fees = await getFeesByCurrency(selectedCryptoForWalletProcess.currencyId, token);
            const cryptoWithTokens = { ...selectedCryptoForWalletProcess, fees: fees || {} as Fees };
            setSelectedCryptoForWalletProcess(cryptoWithTokens);
            const address: CustomerLedgerResult | null = await getReceiveAddress(cryptoWithTokens.currencyId, token) || null;
            if (address) {
                setAddressForReceive(address?.publicKey || '');
                setReceiveMemo(address?.memo || null);
            }
        }
    }

    /* Method defination for checking external address is valid or not  */
    const handleSendAddress = async (address: string) => {
        setSendAddress(address)
        if (address === '') {
            return;
        }
        const isValid = await checkAddress(address);
        setSendAddressValidate(isValid === 1 ? 'valid' : 'invalid');
    }

    /* Method defination for checking valid address for send */
    const checkAddress = async (address: string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            currencyId: selectedCryptoForWalletProcess?.currencyId,
            tokenType: selectedTokenType,
            toAddress: address,
        }
        try {
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/checkNodeAddress`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response.data.error;
            return response.data.isValid;


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

    /* Method defination for setting up deposit for fiat */
    const setupFiatDeposit = async (fiat: Asset) => {
        setSelectedCryptoForWalletProcess(fiat);
        await getAdminBankDetails(fiat.currencyId);
        setOpenDepositModal(true)
    }

    /* Method defination for setting up deposit for fiat */
    const setupFiatWithdraw = async (fiat: Asset) => {
        setSelectedCryptoForWalletProcess(fiat);
        const responseBankDetails = await getUserBankDetails({ uuid: userUuid });
        const bankDetails = (responseBankDetails && responseBankDetails.data) as BankDetails;
        const error = bankDetails.error;
        if (error.error_data === 1) {
            showSnackbar(error.error_msg, 'error');
            return;
        }
        await getTransactionLimitByTier(fiat.currencyId);
        if (bankDetails?.bankDetailsResult?.account_no) {

            const resp = await getUserSettings()
            if (!resp.data.success) {
                showSnackbar(resp.data.message, 'error');
                return;
            }
            const settings = resp.data.data;
            if (!settings.twoFactorEnabled) {
                showSnackbar('Please enable 2FA from settings to proceed further', 'error');
                return;
            }

            setOpenWithdrawModal(true)
        } else {
            showSnackbar('You need to add your bank details first', 'error');
            setLoading(true);
            setTimeout(() => {
                const path = '/finance-hub/buy-and-swap-crypto'
                const encodedPath = encodeURIComponent(path)
                console.log(encodedPath)
                router.push(`/bank-details?continue=${encodedPath}`);
            }, 2000);
        }
    }


    /* Method defination for setup crypto for send */
    const setupCryptoSend = async (crypto: Asset) => {
        console.log(crypto)
        const resp = await getUserSettings()
        if (!resp.data.success) {
            showSnackbar(resp.data.message, 'error');
            return;
        }
        const settings = resp.data.data;
        if (!settings.twoFactorEnabled) {
            showSnackbar('Please enable 2FA from settings to proceed further', 'error');
            return;
        }
        const tokens = (await getCurrencyTokens(crypto.currencyId)) || [];
        const firstToken = tokens.length > 0 ? tokens[0]?.tokenType || '' : '';
        setSelectedTokenType(firstToken);
        const fees = await getFeesByCurrency(crypto.currencyId, firstToken);
        const cryptoWithTokens = { ...crypto, tokens, fees: fees || {} as Fees };
        setSelectedCryptoForWalletProcess(cryptoWithTokens);
        setOpenSendModal(true)
    }


    /* Method defination to get receive address */
    const getReceiveAddress = async (currencyId: number, tokenType: string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            userUuid: userUuid,
            currencyId,
            tokenType: tokenType,
        }
        try {
            setLoading(true);
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/getCryptoAddress`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response.data.error;
            if (error?.error_data !== 0) {
                showSnackbar(error.error_msg, 'error');
                return false;
            }
            const customerLedgerResult = response.data.customerLedgerResult;
            return customerLedgerResult;




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


    /* Method defination for setup crypto for receive */
    const setupCryptoReceive = async (crypto: Asset) => {
        console.log(crypto)
        const tokens = (await getCurrencyTokens(crypto.currencyId)) || [];
        const firstToken = tokens.length > 0 ? tokens[0]?.tokenType || '' : '';
        setSelectedTokenType(firstToken);
        setSelectedCryptoForWalletProcess(crypto)
        const fees = await getFeesByCurrency(crypto.currencyId, firstToken);
        const cryptoWithTokens = { ...crypto, tokens, fees: fees || {} as Fees };
        setSelectedCryptoForWalletProcess(cryptoWithTokens);
        const address: CustomerLedgerResult | null = await getReceiveAddress(crypto.currencyId, firstToken) || null;
        if (address) {
            setAddressForReceive(address?.publicKey || '');
            setReceiveMemo(address?.memo || null);
            setOpenReceiveModal(true)
        }

    }

    /* Method defination for handling send to external wallet submit click */
    const handleSendSubmit = async () => {
        const balance = selectedCryptoForWalletProcess?.closingBalance;
        if (balance === 0) {
            showSnackbar('Insufficient Balance', 'error');
            return;
        }
        const isValid = await checkAddress(sendAddress.trim());
        setSendAddressValidate(isValid === 1 ? 'valid' : 'invalid');
        if (isValid === 0) {
            showSnackbar('Please provide a valid address', 'error');
            return;
        }
        if (twoFactorOTPForSend === '') {
            showSnackbar('Please enter valid 2FA OTP', 'error');
            return;
        }
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            userUuid: userUuid,
            currencyId: selectedCryptoForWalletProcess?.currencyId,
            currency: selectedCryptoForWalletProcess?.currencyCode,
            tokenType: selectedTokenType,
            amount: amountForSend,
            toAddress: sendAddress,
            memo: sendMemo,
            securityCode: twoFactorOTPForSend
        }
        try {
            setLoading(true);
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/sendToOther`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            if (response.data.error?.error_data !== 0) {
                showSnackbar(response.data.error.error_msg, 'error');
                return false;
            }
            showSnackbar('Send successfully', 'success')
            setOpenSendModal(true)
            await getWalletDetails(userUuid);
            await getUserTransaction(pageNo, transactionFilter, userUuid);
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

    /* Method defination for setting up fees popup */
    const setupFeesPopup = async () => {
        try {
            // Fetch volume-wise trading fees


            const response = await axios.get<TradingFeesResponse>(
                API_BASE_URL + "/finance-hub/volumeWiseTradingFees",
                {
                    headers: {
                        "Content-Type": "application/json",
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    },
                }
            );

            const tradingFees = response.data.value;
            console.log(tradingFees);


            // Fetch user-specific trading fees
            const payloadFee1 = {
                adminUser: localStorage.getItem('uuid'),
                userUuid: userUuid
            }
            //const { data: userFees }
            const response1 = await axios.post<UserTradingFeeResponse>(
                API_BASE_URL +
                `/finance-hub/userVolumeWiseTradingFees`, payloadFee1,
                {
                    headers: {
                        "Content-Type": "application/json",
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    },
                }
            );
            const userFees = response1.data;
            if (response.data?.error?.error_data === 1) {
                showSnackbar(response.data?.error?.error_msg, 'error')
            }
            //console.log(userFees);
            if (userFees?.userTradingFees) {
                setUserExchangeFee({
                    totalVolume: parseFloat(
                        userFees.userTradingFees[0].totalVolume
                    ).toFixed(2),
                    totalFees: parseFloat(userFees.userTradingFees[0].totalFees).toFixed(2),
                    makerFee: userFees.userTradingFees[0].makerFee,
                    takerFee: userFees.userTradingFees[0].takerFee,
                });
            }

            setExchangeFees(tradingFees);
            setOpenFeesModal(true)
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

    /* Method defination to get all asset details */
    const getAllAssetDetails = async (brokerId: string) => {
        try {
            const response = await axios.get<ApiResponse>(
                `https://accounts.paybito.com/CacheService/api/getAssetsData?Name=Assets&BrokerId=${brokerId}`,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const parsedCurrencyData = JSON.parse(response.data.value);
            console.log(parsedCurrencyData)
            setAllAssets(parsedCurrencyData.Values);
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

    /* Method defination to get all currency by broker id */
    const getAllCounterAssets = async (brokerId: string) => {
        if (brokerId === '') {
            return;
        }
        try {
            setLoading(false);
            const response = await axios.get<ApiResponse>(
                `${API_BASE_URL}/finance-hub/getAllCurrency/${brokerId}`,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );
            const error = response.data.error;
            const currencyList = response.data.currencyList;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            setCounterAssets(currencyList);
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
    /* Method defination to get all currency by broker id */
    const getAllBaseAssets = async (counter: string) => {
        setSelectedCounterAsset(counter)
        setSelectedBaseAsset('');
        setBuySellAmount('');
        setBuySellMarketPrice('');
        setBuySellTotalPrice('');
        // Fetch selling asset balance only in SELL mode
        if (purchaseType === 'sell') {
            await getSellingAssetBalance(counter);
        }
        try {
            setLoading(false);
            const response = await axios.get<ApiResponse>(
                `${API_BASE_URL}/finance-hub/getBaseByCurrency?brokerId=${brokerId}&currency=${counter}&country=${brokerCountry}`,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );
            const error = response.data.error;
            const baseCurrencyList = response.data.baseCurrencyList;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            setBaseAssets(baseCurrencyList);
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

    /* Method defination for setting selected base asset */
    const setBaseAsset = async (base: string) => {
        setSelectedBaseAsset(base);
        setBuySellAmount('');
        setBuySellMarketPrice('');
        setBuySellTotalPrice('');

        // Fetch balance when base asset is selected in BUY mode
        if (purchaseType === 'buy') {
            await getSellingAssetBalance(base);
        }

        await checkBuySellEligible(selectedCounterAsset, base);
    }

    /* method defination to check if buy/sell is eligible for selected asset */
    const checkBuySellEligible = async (counter: string, base: string) => {
        if (counter === '' || base === '') {
            showSnackbar('Please select the assets first', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get<ApiResponse>(
                `${API_BASE_URL}/finance-hub/pairWiseBuySellChecking?currency=${counter}&baseCurrency=${base}`,
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
            const buySellFlag = response.data.buySellFlag;
            setIsBuySellEligible(buySellFlag === 1 ? true : false);

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

    /* method defination to set buy/sell amount */
    const handleBuySellAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // ✅ Allow empty value (Backspace to clear)
        if (value === '') {
            setBuySellAmount('');
            setBuySellMarketPrice('');
            setBuySellTotalPrice('');
            return;
        }

        // ✅ Only then clean unwanted characters
        const cleanedValue = value
            .replace(/[^0-9.]/g, '')     // allow only numbers and dot
            .replace(/(\.).*?\./g, '$1'); // ensure only one dot

        event.target.value = cleanedValue
        renderAllPrices(cleanedValue)
    }
    /* Method defination for deducing all prices based on price given by user */
    const renderAllPrices = async (amount: string) => {
        if (amount === '') {
            setBuySellMarketPrice('');
            setBuySellTotalPrice('');
            return;
        }
        setBuySellAmount(amount);
        const marketPrice = await getMarketPrice(amount);
        //console.log('MARKET PRICE => ', marketPrice);
        if (!marketPrice) {
            setBuySellMarketPrice('');
            setBuySellTotalPrice('');
            return;
        }
        setBuySellMarketPrice(parseFloat(marketPrice.toString()).toFixed(selectedBaseAsset.toUpperCase() === 'USD' ? 4 : 6));
        const totalPrice = parseFloat(amount) * parseFloat(marketPrice);
        //console.log(amount, marketPrice, totalPrice);
        setBuySellTotalPrice(totalPrice.toFixed(selectedBaseAsset.toUpperCase() === 'USD' ? 4 : 6));
    }

    /* Method defination for getting market price as per amount */
    const getMarketPrice = async (amount: string) => {
        if (amount === '' || parseFloat(amount) < 0) {
            showSnackbar('Amount cannot be negative or blank', 'error')
            setBuySellMarketPrice('');
            setBuySellTotalPrice('');
            return;
        } else if (selectedBaseAsset === '' || selectedCounterAsset === '') {
            showSnackbar('You need to select assets first', 'error');
            return;
        }

        try {
            setLoading(false);
            if (isBuySellEligible) {
                const response = await axios.get<ApiResponse>(
                    `https://stream.paybito.com/SocketStream/api/marketPrice?symbol=${selectedCounterAsset.toUpperCase()}${selectedBaseAsset.toUpperCase()}&side=${purchaseType === 'buy' ? 'BID' : 'ASK'}&amount=${amount}`,
                    {
                        headers: {
                            //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                        }
                    }
                );

                if (response.data.statuscode === '0') {
                    showSnackbar('*Orderbook depth reached, price not found', 'error');
                    setBuySellMarketPrice('');
                    setBuySellTotalPrice('');
                    return;
                }

                return response.data.price;

            } else {
                const payload = {
                    currency: selectedCounterAsset,
                    baseCurrency: selectedBaseAsset,
                    action: purchaseType === 'buy' ? 1 : 2,
                };

                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/convertPrice`, payload,
                    {
                        headers: {
                            //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                        }
                    }
                );
                const error = response.data.error;
                if (error.error_data === 1) {
                    showSnackbar('*Orderbook depth reached, price not found', 'error');
                    setBuySellMarketPrice('');
                    setBuySellTotalPrice('');
                    return;
                }

                response.data.marketPrice;
            }


        } catch (error) {
            console.error('Failed to get market price', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false);
        }
    }

    /* Method defination to validate & call API ehen buy/sell button is clicked */
    const initiateBuySell = async () => {
        if (buySellAmount === '' || parseFloat(buySellAmount) < 0) {
            showSnackbar('Amount cannot be negative or blank', 'error')
            setBuySellMarketPrice('');
            setBuySellTotalPrice('');
            return;
        } else if (selectedBaseAsset === '' || selectedCounterAsset === '') {
            showSnackbar('You need to select assets first', 'error');
            return;
        } else if (parseFloat(buySellTotalPrice) < 0.0001) {
            showSnackbar('Total Price should be greater than 0.0001', 'error');
            return;
        }
        const marketPrice = await getMarketPrice(buySellAmount);
        if (isBuySellEligible) {
            const payload = {
                "adminUser": localStorage.getItem('uuid'),
                "userId": userId.toString(),
                "selling_asset_code": selectedBaseAsset,
                "buying_asset_code": selectedCounterAsset,
                "price": marketPrice,
                "txn_type": purchaseType === 'buy' ? '1' : '2'
            }
            try {
                setLoading(true);
                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/OfferPriceCheck`, payload,
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


                const baseCurrencyId = await walletList.find((c: Asset) => c.currencyCode === selectedBaseAsset)?.currencyId;
                const counterCurrecyId = await walletList.find((c: Asset) => c.currencyCode === selectedCounterAsset)?.currencyId;

                const payload1 = {
                    "adminUser": localStorage.getItem('uuid'),
                    "userUuid": userUuid,
                    "selling_asset_code": purchaseType === 'buy' ? selectedBaseAsset : selectedCounterAsset,
                    "buying_asset_code": purchaseType === 'buy' ? selectedCounterAsset : selectedBaseAsset,
                    "amount": buySellAmount,
                    "price": marketPrice,
                    "offerType": "M",
                    "txn_type": purchaseType === 'buy' ? '1' : '2',
                    "baseCurrencyId": baseCurrencyId,
                    "currencyId": counterCurrecyId,

                }
                try {
                    setLoading(true);
                    const tradeResponse = await axios.post<ApiResponse>(
                        `${API_BASE_URL}/finance-hub/TradeCreateOffer`, payload1,
                        {
                            headers: {
                                //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                            }
                        }
                    );
                    const error = tradeResponse.data.error;
                    if (error.error_data === 1) {
                        showSnackbar(error.error_msg, 'error');
                        return;
                    }
                    setBuySellAmount('');
                    setBuySellMarketPrice('');
                    setBuySellTotalPrice('');
                    showSnackbar(error.error_msg, 'success');
                    getBuySellTxnHistory(userUuid, buySellTxnPageNo);

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

        } else {
            const payload = {
                userId: userId,
                baseCurrency: selectedBaseAsset,
                currency: selectedCounterAsset,
                amount: parseFloat(buySellAmount),
                action: purchaseType === 'buy' ? 1 : 2,
            }
            try {
                setLoading(true)
                const tradeResponse = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/currencyConversion`, payload,
                    {
                        headers: {
                            //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                        }
                    }
                );
                const error = tradeResponse.data.error;
                if (error.error_data === 1) {
                    showSnackbar(error.error_msg, 'error');
                    return;
                }
                setBuySellAmount('');
                setBuySellMarketPrice('');
                setBuySellTotalPrice('');
                showSnackbar(error.error_msg, 'success');
                getBuySellTxnHistory(userUuid, buySellTxnPageNo);

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

    }

    /* method defination for toggling screen */
    const toggleScreen = async (screen: string) => {
        setShowWallet(screen === 'wallet' ? true : false);
        if (screen === 'wallet') {
            await getWalletDetails(userUuid);
            await getUserTransaction(pageNo, transactionFilter, userUuid);
        } else {
            await getAllCounterAssets(brokerId);
            await getBuySellTxnHistory(userUuid, buySellTxnPageNo);
        }
    }

    /* Method defination for rendering all cryptos details for wallet  */
    const getWalletDetails = async (uuid: string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            userUuid: uuid,
        }
        try {
            setLoading(true);
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/getUserBalance`, payload,
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
            const userBalanceList = response.data.userBalanceList;

            const sortedBalanceList = [...userBalanceList].sort((a: Asset, b: Asset) => {
                // First, prioritize currencyType = 1
                if (a.currencyType === 1 && b.currencyType !== 1) return -1;
                if (a.currencyType !== 1 && b.currencyType === 1) return 1;

                // If both are same type, sort alphabetically by currencyCode
                return a.currencyCode.localeCompare(b.currencyCode);
            });

            setRawWalletList(sortedBalanceList);
            setWalletList(sortedBalanceList);

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

    /* Handle search crypto */
    const handleSearchCrypto = (searchText: string) => {
        setSearchValue(searchText);
        if (searchText === '') {
            setWalletList(rawWalletList);
            return;
        }
        const filteredList = rawWalletList.filter((asset: Asset) =>
            asset.currencyCode.toLowerCase().includes(searchText.toLowerCase()) ||
            (asset.currencyName && asset.currencyName.toLowerCase().includes(searchText.toLowerCase()))
        );
        setWalletList(filteredList);
    }

    /* Method defination to get user transaction */
    const getUserTransaction = async (page: number, type: string, uuid: string) => {
        setTransactionFilter(type.toLowerCase() === 'send' ? 'send' : type.toLowerCase() === 'deposit' ? 'deposit' : type.toLowerCase() === 'withdraw' ? 'withdraw' : 'received')
        setPageNo(page);
        let payload = {};
        if (type === 'send' || type === 'received') {
            payload = {
                adminUser: localStorage.getItem('uuid'),
                userUuid: uuid,
                pageNo: page,
                noOfItemsPerPage,
                timeSpan: 'all',
                transactionType: type
            }
        } else if (type === 'deposit' || type === 'withdraw') {
            payload = {
                adminUser: localStorage.getItem('uuid'),
                userUuid,
                pageNo: page,
                noOfItemsPerPage
            }
        }
        setWalletTransactions([]);
        try {
            setLoading(true)
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/${type === 'send' || type === 'received' ? `getUserAllTransaction` : type === 'deposit' ? 'getInvoicesList' : 'getWithdrawalDetails'}`, payload,
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
            const userTransactionsResult = (type === 'send' || type === 'received' ? response.data?.userTransactionsResult : type === 'deposit' ? response.data?.invoicesListResult : response.data?.withdrawalListResult) || [];
            const totalCount = response.data?.totalCount || 0;
            setWalletTransactions(userTransactionsResult);
            setTotaCount(totalCount);

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

    /* Method defination for handling filter */
    const handleTransactionFilter = async (type: string) => {
        await getUserTransaction(pageNo, type, userUuid)
    }
    /* Method defination for handling page change */
    const handlePaginationSelection = async (pageType: string) => {
        let reqPage = pageType === 'prev' ? pageNo - 1 : pageNo + 1;
        const maxPage = Math.ceil(totalCount / noOfItemsPerPage);
        reqPage = reqPage === 0 ? 1 : reqPage;
        if (reqPage === 0) {
            reqPage = 1;
        } else if (reqPage === maxPage) {
            reqPage = maxPage - 1;
        } else {
            reqPage = reqPage
        }
        await getUserTransaction(reqPage, transactionFilter, userUuid)

    }
    /* Method defination for handling page change */
    const handleBuySellPaginationSelection = async (pageType: string) => {
        let reqPage = pageType === 'prev' ? pageNo - 1 : pageNo + 1;
        const maxPage = Math.ceil(buySellTxnTotalCount / noOfItemsPerPage);
        //reqPage = reqPage === 0 ? 1 : reqPage;
        if (reqPage === 0) {
            reqPage = 1;
        } else if (reqPage === maxPage) {
            reqPage = maxPage - 1;
        } else {
            reqPage = reqPage
        }
        console.log(reqPage);
        await getBuySellTxnHistory(userUuid, reqPage);

    }


    /* Method defination to handle copying address for receive */
    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(addressForReceive);
            setCopied(true);
        } catch (err) {
            console.error('Failed to copy address:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = addressForReceive;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
        }
    };


    /* Method used for helper */
    const formatDate = (timestamp: string) => {
        let date: Date;

        // Check if the format is DD-MM-YYYY (e.g., "21-11-2025 15:29:23")
        if (timestamp && /^\d{2}-\d{2}-\d{4}/.test(timestamp)) {
            // Parse DD-MM-YYYY HH:mm:ss format
            const [datePart, timePart] = timestamp.split(' ');
            const [day, month, year] = datePart.split('-');
            // Convert to YYYY-MM-DD format which JavaScript Date understands
            const dateString = `${year}-${month}-${day}${timePart ? ' ' + timePart : ''}`;
            date = new Date(dateString);
        } else {
            // Handle YYYY-MM-DD format (e.g., "2025-11-21 15:28:28.067201") or other standard formats
            date = new Date(timestamp);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        if (isMobile) {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    /* Method used for helper */
    const formatAmount = (amount: string, currency: string) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0.00';

        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(num);
    };
    /* Method used for helper */
    const getStatusConfig = (status: number) => {
        switch (status) {
            case 1:
                return {
                    label: 'Completed',
                    color: 'success',
                    icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
                };
            case 0:
                return {
                    label: 'Pending',
                    color: 'warning',
                    icon: <ScheduleIcon sx={{ fontSize: 16 }} />
                };
            case -1:
                return {
                    label: 'Failed',
                    color: 'error',
                    icon: <ErrorIcon sx={{ fontSize: 16 }} />
                };
            default:
                return {
                    label: 'Unknown',
                    color: 'default',
                    icon: <ScheduleIcon sx={{ fontSize: 16 }} />
                };
        }
    };
    /* Method used for helper */
    const getActionIcon = (action: string) => {
        switch (action.toLowerCase()) {
            case 'send':
                return <SendIcon sx={{ fontSize: 16, color: 'error.main' }} />;
            case 'receive':
                return <ReceiveIcon sx={{ fontSize: 16, color: 'success.main' }} />;
            case 'trade':
                return <SwapIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
            default:
                return <SwapIcon sx={{ fontSize: 16, color: 'text.secondary' }} />;
        }
    };
    /* Method used for helper */
    const toggleRowExpanded = (transactionId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(transactionId)) {
            newExpanded.delete(transactionId);
        } else {
            newExpanded.add(transactionId);
        }
        setExpandedRows(newExpanded);
    };
    /* Method used for helper */
    const openTransactionUrl = (currencyUrl: string, currencyTxnid: string) => {
        if (currencyUrl && currencyTxnid) {
            window.open(`${currencyUrl}${currencyTxnid}`, '_blank');
        }
    };


    /* Method defination for get all buy sell txn history */
    const getBuySellTxnHistory = async (uuid: string, page: number) => {
        setBuySellTxnPageNo(page);
        const payload = {
            pageNo: page,
            noOfItemsPerPage: noOfItemsPerPage,
            adminUser: localStorage.getItem("uuid"),
            timeSpan: 'all',
            transactionType: "all",
            userUuid: uuid,
        }

        try {
            setLoading(true);
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/getUserAllTransaction`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response.data.error;
            if (error?.error_data !== 0) {
                showSnackbar(error.error_msg, 'error');
                return false;
            }
            const totalCount = response.data.totalCount || 0;
            
            const buySellTransactions = response.data.userTransactionsResult || [];
            // Filter transactions where action is either "Buy" or "Sell"
            const filteredTransactions = buySellTransactions.filter(
                (txn: { action: string }) => txn.action.toLowerCase() === "buy" || txn.action.toLowerCase() === "sell"
            );
            setBuySellTxnHistory(filteredTransactions);
            setBuySellTxnTotalCount(filteredTransactions.length);

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

    /* method defination to get Admin bank details */
    const getAdminBankDetails = async (currencyId: number) => {
        const payload = {
            userId: userId,
            adminUser: localStorage.getItem('uuid'),
            userUuid: userUuid,
        }
        try {
            setLoading(true);
            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/transactions/GetAdminBankDetails`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            // const error = response.data.error;
            // if (error?.error_data !== 0) {
            //     showSnackbar(error.error_msg, 'error');
            //     return false;
            // }
            const adminBankDetails = response.data.adminBankDetails;
            const currencyBankDetails = adminBankDetails?.find((detail: AdminBankDetails) => detail.currencyId === currencyId) || null;
            console.log('ADMIN BANK DETAILS => ', currencyBankDetails);
            setSelectedAdminBankDetails(currencyBankDetails);
            await getTransactionLimitByTier(currencyId);
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





    /* method defination to get fiat range for deposit & withdraw */
    const getTransactionLimitByTier = async (currencyId: number) => {
        const payload = {
            userUuid,
            adminUser: localStorage.getItem('uuid'),
            currencyId,
            tierType: userKycTierType

        }
        try {
            setLoading(true);
            const response = await axios.post<TransactionLimitResponse>(
                `${API_BASE_URL}/finance-hub/getTransactionLimitByTier`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
            const error = response.data.error;
            if (error !== '') {
                showSnackbar(error, 'error');
                return;
            }
            const selectedFiatFees = response.data.value
            setSelectedFiatTier(selectedFiatFees || null);

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

    /* Method defination calling APIs after conversion to B$ is done */
    const handleOnConversionSuccess = async () => {
        await getWalletDetails(userUuid);
        await getUserTransaction(pageNo, transactionFilter, userUuid);
    }

    useEffect(() => {
        makeUserLogin();
    }, []);

    /* Function defination to handle what will hapen after share */
    const handleShareSuccess = (recipientIds: number[]) => {
        showSnackbar(`Wallet address shared with ${recipientIds.length} ${recipientIds.length === 1 ? 'person' : 'people'}!`, 'success');
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
        <Fragment>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
                    {isLoginSectionEnabled && <LoadingMappingComponent />}
                    {!isLoginSectionEnabled && <Fragment>
                        {!showWallet ? (
                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>

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
                                            {/* Instructional Section */}
                                            <Box
                                                sx={{
                                                    p: 3,
                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(30, 64, 175, 0.02)' : 'rgba(66, 165, 245, 0.05)',
                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                }}
                                            >
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
                                                        variant="h6"
                                                        sx={{
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 600,
                                                            fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                                            flex: 1,
                                                            minWidth: 'fit-content'
                                                        }}
                                                    >
                                                        Change one crypto to another instantly
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

                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                    {[
                                                        `Select the cryptocurrency you want to ${purchaseType === 'buy' ? 'Buy' : 'Sell'}.`,
                                                        `Select the cryptocurrency or fiat you want to \"${purchaseType === 'buy' ? 'Buy' : 'Sell'}\" in order to \"${purchaseType === 'buy' ? 'Sell' : 'Buy'}\" the above selected cryptocurrency.`,
                                                        `Enter the amount of cryptocurrency you wish to sell next to \"${purchaseType === 'buy' ? 'Buying' : 'Selling'} Amount\".`,
                                                        `Review the price that will automatically populate afterwards.`,
                                                        `Review the total trade cost next to \"Total Price\".`,
                                                        `Once you are happy with all elements, click on \"${purchaseType === 'buy' ? 'Buy' : 'Sell'}\" and the transaction will execute as ordered.`
                                                    ].map((step, index) => (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 2,
                                                                mb: 2
                                                            }}
                                                        >
                                                            <CheckCircle
                                                                sx={{
                                                                    color: '#22c55e',
                                                                    fontSize: 20,
                                                                    flexShrink: 0
                                                                }}
                                                            />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: theme.palette.text.primary,
                                                                    lineHeight: 1.6,
                                                                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                                                    flex: 1
                                                                }}
                                                            >
                                                                {step}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>

                                            {/* Header with Tabs and Fees Button */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    p: 2,
                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        disabled={loading}
                                                        variant="text"
                                                        onClick={() => setPurchaseType('buy')}
                                                        sx={{
                                                            color: purchaseType === 'buy' ? theme.palette.text.primary : theme.palette.text.secondary,
                                                            fontWeight: purchaseType === 'buy' ? 600 : 500,
                                                            fontSize: '1rem',
                                                            minWidth: 'auto',
                                                            px: 2,
                                                            py: 1,
                                                            borderBottom: purchaseType === 'buy' ? `2px solid #22c55e` : '2px solid transparent',
                                                            borderRadius: 0,
                                                            '&:hover': {
                                                                backgroundColor: 'transparent',
                                                            }
                                                        }}
                                                    >
                                                        Buy
                                                    </Button>
                                                    <Button
                                                        disabled={loading}
                                                        variant="text"
                                                        onClick={() => setPurchaseType('sell')}
                                                        sx={{
                                                            color: purchaseType === 'sell' ? theme.palette.text.primary : theme.palette.text.secondary,
                                                            fontWeight: purchaseType === 'sell' ? 600 : 500,
                                                            fontSize: '1rem',
                                                            minWidth: 'auto',
                                                            px: 2,
                                                            py: 1,
                                                            borderBottom: purchaseType === 'sell' ? `2px solid #ef4444` : '2px solid transparent',
                                                            borderRadius: 0,
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(0,0,0,0.04)',
                                                            }
                                                        }}
                                                    >
                                                        Sell
                                                    </Button>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    {/* Display balance based on Buy/Sell mode */}
                                                    {((purchaseType === 'buy' && selectedBaseAsset) || (purchaseType === 'sell' && selectedCounterAsset)) && (
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                px: 2,
                                                                py: 1,
                                                                borderRadius: 2,
                                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                                            }}
                                                        >
                                                            <WalletIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: theme.palette.primary.main,
                                                                    fontWeight: 600,
                                                                    fontSize: '0.875rem',
                                                                }}
                                                            >
                                                                {sellingAssetBalance.toFixed(4)} {purchaseType === 'buy' ? selectedBaseAsset : selectedCounterAsset}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    <Button
                                                        disabled={loading}
                                                        onClick={setupFeesPopup}
                                                        variant="contained"
                                                        size="small"
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
                                                        Fees
                                                    </Button>
                                                </Box>
                                            </Box>

                                            {/* Trading Interface */}
                                            <Box sx={{ p: 3 }}>
                                                {/* Buy/Sell Label */}
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: { xs: 'column', md: 'row' },
                                                        gap: 3,
                                                        mb: 2,
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            flex: 1,
                                                            width: '100%',
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 600,
                                                            fontSize: '1.1rem',
                                                            textTransform: 'capitalize'
                                                        }}
                                                    >
                                                        {purchaseType}
                                                    </Typography>
                                                    {/* With Label */}
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            flex: 1,
                                                            width: '100%',
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 500,
                                                            display: { xs: 'none', md: 'block' },
                                                            minWidth: 'fit-content'
                                                        }}
                                                    >
                                                        {purchaseType === 'buy' ? 'With' : 'For'}
                                                    </Typography>
                                                </Box>

                                                {/* Currency Selection Row */}
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: { xs: 'column', md: 'row' },
                                                        gap: 3,
                                                        mb: 3,
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {/* Left Currency Selector */}
                                                    <Box sx={{ flex: 1, width: '100%' }}>
                                                        <FormControl fullWidth>
                                                            <Select
                                                                value={selectedCounterAsset}
                                                                onChange={(e) => { getAllBaseAssets(e.target.value); }}
                                                                displayEmpty
                                                                sx={{
                                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        border: 'none',
                                                                    },
                                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                        border: 'none',
                                                                    },
                                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                        border: `1px solid ${theme.palette.primary.main}`,
                                                                    },
                                                                    borderRadius: 2,
                                                                    height: 56,
                                                                }}
                                                            >
                                                                <MenuItem value="" disabled>
                                                                    <Typography sx={{ color: theme.palette.text.secondary }}>
                                                                        Select Currency
                                                                    </Typography>
                                                                </MenuItem>
                                                                {counterAssets.length > 0 && counterAssets.map((asset) => (
                                                                    <MenuItem value={asset} key={asset}>{asset}</MenuItem>
                                                                ))}

                                                            </Select>
                                                        </FormControl>
                                                    </Box>



                                                    {/* Right Currency Selector */}
                                                    <Box sx={{ flex: 1, width: '100%' }}>
                                                        <FormControl fullWidth>
                                                            <Select
                                                                value={selectedBaseAsset}
                                                                onChange={(e) => { setBaseAsset(e.target.value); }}
                                                                displayEmpty
                                                                sx={{
                                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                                        border: 'none',
                                                                    },
                                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                        border: 'none',
                                                                    },
                                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                        border: `1px solid ${theme.palette.primary.main}`,
                                                                    },
                                                                    borderRadius: 2,
                                                                    height: 56,
                                                                }}
                                                            >
                                                                <MenuItem value="" disabled>
                                                                    <Typography sx={{ color: theme.palette.text.secondary }}>
                                                                        Select Currency
                                                                    </Typography>
                                                                </MenuItem>
                                                                {baseAssets.length > 0 && baseAssets.map((asset) => (
                                                                    <MenuItem value={asset} key={asset}>{asset}</MenuItem>
                                                                ))}

                                                            </Select>
                                                        </FormControl>
                                                    </Box>
                                                </Box>

                                                {/* Input Fields Row */}
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: { xs: 'column', md: 'row' },
                                                        gap: 3,
                                                        mb: 4
                                                    }}
                                                >
                                                    {/* Buying/Selling Amount */}
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                mb: 1,
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {purchaseType === 'buy' ? 'Buying' : 'Selling'} Amount {selectedCounterAsset !== '' ? `(${selectedCounterAsset})` : ''}
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            placeholder="0.00"
                                                            variant="outlined"
                                                            onChange={(e) => { handleBuySellAmount(e as React.ChangeEvent<HTMLInputElement>) }}
                                                            value={buySellAmount}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                                                    '& fieldset': {
                                                                        border: 'none',
                                                                    },
                                                                    '&:hover fieldset': {
                                                                        border: 'none',
                                                                    },
                                                                    '&.Mui-focused fieldset': {
                                                                        border: `1px solid ${theme.palette.primary.main}`,
                                                                    },
                                                                    height: 56,
                                                                    borderRadius: 2,
                                                                },
                                                                '& .MuiOutlinedInput-input': {
                                                                    fontSize: '1rem',
                                                                    fontWeight: 500,
                                                                }
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Price */}
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                mb: 1,
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            Price {selectedBaseAsset !== '' ? `(${selectedBaseAsset})` : ''}
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            defaultValue={buySellMarketPrice}
                                                            disabled
                                                            placeholder="0.00"
                                                            variant="outlined"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                                                    '& fieldset': {
                                                                        border: 'none',
                                                                    },
                                                                    '&:hover fieldset': {
                                                                        border: 'none',
                                                                    },
                                                                    '&.Mui-focused fieldset': {
                                                                        border: `1px solid ${theme.palette.primary.main}`,
                                                                    },
                                                                    height: 56,
                                                                    borderRadius: 2,
                                                                },
                                                                '& .MuiOutlinedInput-input': {
                                                                    fontSize: '1rem',
                                                                    fontWeight: 500,
                                                                }
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Total Price */}
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: theme.palette.text.secondary,
                                                                mb: 1,
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            Total Price {selectedBaseAsset !== '' ? `(${selectedBaseAsset})` : ''}
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            placeholder="0.00"
                                                            defaultValue={buySellTotalPrice}
                                                            disabled
                                                            variant="outlined"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                                                    '& fieldset': {
                                                                        border: 'none',
                                                                    },
                                                                    '&:hover fieldset': {
                                                                        border: 'none',
                                                                    },
                                                                    '&.Mui-focused fieldset': {
                                                                        border: `1px solid ${theme.palette.primary.main}`,
                                                                    },
                                                                    height: 56,
                                                                    borderRadius: 2,
                                                                },
                                                                '& .MuiOutlinedInput-input': {
                                                                    fontSize: '1rem',
                                                                    fontWeight: 500,
                                                                }
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* Buy/Sell Button */}
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                    <Button
                                                        disabled={loading}
                                                        variant="contained"
                                                        size="large"
                                                        onClick={initiateBuySell}
                                                        fullWidth={true} // Make button full width on all screen sizes
                                                        sx={{
                                                            backgroundColor: purchaseType === 'buy' ? '#22c55e' : '#ef4444',
                                                            color: 'white',
                                                            fontWeight: 600,
                                                            fontSize: '1rem',
                                                            px: 4,
                                                            py: 1.5,
                                                            borderRadius: 2,
                                                            minWidth: { xs: '100%', sm: 120 }, // Full width on mobile, min-width on larger screens
                                                            width: { xs: '100%', sm: 'auto' }, // Full width on mobile, auto on larger screens
                                                            '&:hover': {
                                                                backgroundColor: purchaseType === 'buy' ? '#16a34a' : '#dc2626',
                                                                transform: 'translateY(-1px)',
                                                            },
                                                            transition: 'all 0.2s ease-in-out'
                                                        }}
                                                    >
                                                        {!loading ? purchaseType === 'buy' ? 'Buy' : 'Sell' : 'Please wait ...'}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Fade>
                                </Paper>
                                <Paper
                                    elevation={6}
                                    sx={{
                                        width: '100%',
                                        maxWidth: 800,
                                        mx: 'auto',
                                        mt: 3,
                                        borderRadius: 3,
                                        backgroundColor: theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Fade in={true} timeout={1000}>
                                        <Box>
                                            {/* Table Header */}
                                            <Box
                                                sx={{
                                                    p: 3,
                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(30, 64, 175, 0.02)' : 'rgba(66, 165, 245, 0.05)',
                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: theme.palette.text.primary,
                                                        fontWeight: 600,
                                                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                                        mb: 1
                                                    }}
                                                >
                                                    Recent Transactions
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: theme.palette.text.secondary,
                                                        fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                                    }}
                                                >
                                                    Track your recent buy and sell transactions
                                                </Typography>
                                            </Box>

                                            {/* Table Container with Responsive Scroll */}
                                            <Box
                                                sx={{
                                                    overflow: 'auto',
                                                    maxHeight: '400px',
                                                    '&::-webkit-scrollbar': {
                                                        width: 8,
                                                        height: 8,
                                                    },
                                                    '&::-webkit-scrollbar-track': {
                                                        background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                                    },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                                                        borderRadius: 4,
                                                    },
                                                    '&::-webkit-scrollbar-thumb:hover': {
                                                        background: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                                                    },
                                                }}
                                            >
                                                <Table sx={{ minWidth: { xs: 650, sm: 750 } }}>
                                                    <TableHead>
                                                        <TableRow
                                                            sx={{
                                                                backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                                            }}
                                                        >
                                                            <TableCell
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                    color: theme.palette.text.primary,
                                                                    py: 2,
                                                                    px: { xs: 1, sm: 2 },
                                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                }}
                                                            >
                                                                Timestamp
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                    color: theme.palette.text.primary,
                                                                    py: 2,
                                                                    px: { xs: 1, sm: 2 },
                                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                }}
                                                            >
                                                                Txn ID
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                    color: theme.palette.text.primary,
                                                                    py: 2,
                                                                    px: { xs: 1, sm: 2 },
                                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                }}
                                                            >
                                                                Description
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                    color: theme.palette.text.primary,
                                                                    py: 2,
                                                                    px: { xs: 1, sm: 2 },
                                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                }}
                                                            >
                                                                Action
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                    color: theme.palette.text.primary,
                                                                    py: 2,
                                                                    px: { xs: 1, sm: 2 },
                                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                }}
                                                            >
                                                                Status
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {/* Sample data - replace with your actual transaction data */}
                                                        {buySellTxnHistory.length > 0 && buySellTxnHistory.map((transaction: BuySellTransaction) => (
                                                            <TableRow
                                                                key={transaction.transactionId}
                                                                sx={{
                                                                    '&:hover': {
                                                                        backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                                                    },
                                                                    '&:last-child td': {
                                                                        borderBottom: 'none',
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell
                                                                    sx={{
                                                                        py: 2,
                                                                        px: { xs: 1, sm: 2 },
                                                                        borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                            color: theme.palette.text.primary,
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        {transaction.transactionTimestamp}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell
                                                                    sx={{
                                                                        py: 2,
                                                                        px: { xs: 1, sm: 2 },
                                                                        borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                            color: theme.palette.text.secondary,
                                                                            fontFamily: 'monospace',
                                                                            maxWidth: { xs: 80, sm: 120 },
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                        }}
                                                                        title={transaction.transactionId.toString()}
                                                                    >
                                                                        {transaction.transactionId.toString()}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell
                                                                    sx={{
                                                                        py: 2,
                                                                        px: { xs: 1, sm: 2 },
                                                                        borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                    }}
                                                                >
                                                                    <Box>
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                                                color: theme.palette.text.primary,
                                                                                fontWeight: 500,
                                                                                mb: 0.5,
                                                                            }}
                                                                        >
                                                                            {transaction.action.toLowerCase() === 'buy' ? `Buy ${transaction.currency} with ${transaction.baseCurrency}` : `Sell ${transaction.currency} for ${transaction.baseCurrency}`}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                                                color: theme.palette.text.secondary,
                                                                            }}
                                                                        >
                                                                            {transaction.debitAmount !== '0' ? transaction.debitAmount : transaction.creditAmount}
                                                                        </Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell
                                                                    sx={{
                                                                        py: 2,
                                                                        px: { xs: 1, sm: 2 },
                                                                        borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                    }}
                                                                >
                                                                    <Chip
                                                                        label={transaction.action}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: transaction.action === 'Buy' ? '#22c55e' : '#ef4444',
                                                                            color: 'white',
                                                                            fontWeight: 600,
                                                                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                                            height: { xs: 24, sm: 28 },
                                                                            '& .MuiChip-label': {
                                                                                px: { xs: 1, sm: 1.5 },
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell
                                                                    sx={{
                                                                        py: 2,
                                                                        px: { xs: 1, sm: 2 },
                                                                        borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                                    }}
                                                                >
                                                                    <Chip
                                                                        label={transaction.status === 1 ? 'Completed' : transaction.status === 2 ? 'Failed' : 'Pending'}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor:
                                                                                transaction.status === 1 ? '#22c55e' :
                                                                                    transaction.status === 2 ? '#ef4444' : '#f59e0b',
                                                                            color: 'white',
                                                                            fontWeight: 600,
                                                                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                                                            height: { xs: 24, sm: 28 },
                                                                            '& .MuiChip-label': {
                                                                                px: { xs: 1, sm: 1.5 },
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </Box>

                                            {/* Empty State - Show when no transactions */}
                                            {buySellTxnHistory.length === 0 && (
                                                <Box
                                                    sx={{
                                                        p: 6,
                                                        textAlign: 'center',
                                                        color: theme.palette.text.secondary,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            mb: 1,
                                                            color: theme.palette.text.secondary,
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        No transactions yet
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: theme.palette.text.secondary,
                                                        }}
                                                    >
                                                        Your transaction history will appear here once you start trading
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Pagination Footer */}
                                            {buySellTxnHistory.length > 0 && <Box
                                                sx={{
                                                    p: 2,
                                                    borderTop: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    gap: 2,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: theme.palette.text.secondary,
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                    }}
                                                >
                                                    Showing {buySellTxnHistory.length} of {buySellTxnTotalCount} transactions
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => handleBuySellPaginationSelection('prev')}
                                                        sx={{
                                                            minWidth: { xs: 32, sm: 'auto' },
                                                            px: { xs: 1, sm: 2 },
                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                            borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                                                            color: theme.palette.text.secondary,
                                                        }}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={buySellTxnHistory.length >= buySellTxnTotalCount}
                                                        onClick={() => handleBuySellPaginationSelection('next')}
                                                        sx={{
                                                            minWidth: { xs: 32, sm: 'auto' },
                                                            px: { xs: 1, sm: 2 },
                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                            borderColor: theme.palette.primary.main,
                                                            color: theme.palette.primary.main,
                                                            '&:hover': {
                                                                backgroundColor: theme.palette.primary.main,
                                                                color: 'white',
                                                            }
                                                        }}
                                                    >
                                                        Next
                                                    </Button>
                                                </Box>
                                            </Box>}
                                        </Box>
                                    </Fade>
                                </Paper>
                            </Box>

                        )

                            : (<Fragment>
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
                                                    gap: { xs: 2, md: 3 },
                                                    p: { xs: 2, sm: 2.5, md: 3 },
                                                    borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                    flexWrap: { xs: 'wrap', lg: 'nowrap' },
                                                }}
                                            >
                                                {/* Left Section: Title */}
                                                <Box sx={{ flex: { xs: '0 0 auto', lg: '0 0 auto' } }}>
                                                    <Typography
                                                        variant="h5"
                                                        sx={{
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 700,
                                                            mb: 0.5,
                                                            fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                                        }}
                                                    >
                                                        Wallet
                                                    </Typography>
                                                </Box>

                                                {/* Middle Section: Search Bar */}
                                                <Box
                                                    sx={{
                                                        flex: { xs: '1 1 100%', sm: '1 1 auto', lg: '1 1 400px' },
                                                        minWidth: { xs: '100%', sm: 'auto' },
                                                        order: { xs: 3, lg: 2 },
                                                    }}
                                                >
                                                    <TextField
                                                        fullWidth
                                                        placeholder="Search assets, currency code..."
                                                        variant="outlined"
                                                        size="small"
                                                        value={searchValue}
                                                        onChange={(e) => handleSearchCrypto(e.target.value)}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Search
                                                                        sx={{
                                                                            color: theme.palette.text.secondary,
                                                                            fontSize: 20,
                                                                        }}
                                                                    />
                                                                </InputAdornment>
                                                            ),
                                                            endAdornment: searchValue && (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => setSearchValue('')}
                                                                        sx={{
                                                                            color: theme.palette.text.secondary,
                                                                            '&:hover': {
                                                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                                            },
                                                                        }}
                                                                    >
                                                                        <Close sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                backgroundColor:
                                                                    theme.palette.mode === 'light'
                                                                        ? 'rgba(0,0,0,0.03)'
                                                                        : 'rgba(255,255,255,0.05)',
                                                                borderRadius: 2,
                                                                transition: 'all 0.2s ease-in-out',
                                                                '&:hover': {
                                                                    backgroundColor:
                                                                        theme.palette.mode === 'light'
                                                                            ? 'rgba(0,0,0,0.05)'
                                                                            : 'rgba(255,255,255,0.08)',
                                                                },
                                                                '&.Mui-focused': {
                                                                    backgroundColor:
                                                                        theme.palette.mode === 'light'
                                                                            ? '#ffffff'
                                                                            : 'rgba(255,255,255,0.1)',
                                                                    boxShadow: `0 0 0 3px ${alpha(
                                                                        theme.palette.primary.main,
                                                                        0.1
                                                                    )}`,
                                                                    '& fieldset': {
                                                                        borderColor: theme.palette.primary.main,
                                                                        borderWidth: 2,
                                                                    },
                                                                },
                                                                '& fieldset': {
                                                                    borderColor:
                                                                        theme.palette.mode === 'light'
                                                                            ? 'rgba(0,0,0,0.12)'
                                                                            : 'rgba(255,255,255,0.12)',
                                                                    transition: 'border-color 0.2s ease-in-out',
                                                                },
                                                            },
                                                            '& .MuiOutlinedInput-input::placeholder': {
                                                                color: theme.palette.text.secondary,
                                                                opacity: 0.6,
                                                            },
                                                            '& .MuiInputBase-input': {
                                                                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                                                color: theme.palette.text.primary,
                                                            },
                                                        }}
                                                    />
                                                </Box>

                                                {/* Right Section: Button */}
                                                <Button
                                                    disabled={loading}
                                                    onClick={() => toggleScreen('buy_swap')}
                                                    variant="outlined"
                                                    startIcon={<TrendingUp />}
                                                    sx={{
                                                        background: 'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        fontSize: '0.875rem',
                                                        px: { xs: 2, sm: 3 },
                                                        py: { xs: 0.8, sm: 1 },
                                                        border: 'none',
                                                        borderRadius: 2,
                                                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                                                        transition: 'all 0.3s ease-in-out',
                                                        whiteSpace: 'nowrap',
                                                        flex: { xs: '0 0 auto', lg: '0 0 auto' },
                                                        width: { xs: '100%', sm: 'auto' },
                                                        order: { xs: 2, lg: 3 },
                                                        '&:hover': {
                                                            background:
                                                                'linear-gradient(90deg, #1717f1 0%, #852597 50%, #d62e56 100%)',
                                                            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
                                                            transform: 'translateY(-1px)',
                                                        },
                                                    }}
                                                >
                                                    Buy/Sell
                                                </Button>
                                            </Box>

                                            {/* Wallet Assets */}
                                            <Box sx={{ p: 3 }}>
                                                {/* Asset Cards */}
                                                {walletList.map((asset: Asset, index) => (
                                                    <Card
                                                        key={asset?.currencyId}
                                                        elevation={0}
                                                        sx={{
                                                            mb: 3,
                                                            overflow: 'visible',
                                                            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                            borderRadius: 3,
                                                            transition: 'all 0.3s ease-in-out',
                                                            '&:hover': {
                                                                borderColor: theme.palette.primary.main,
                                                                transform: 'translateY(-4px)',
                                                                boxShadow: `0 8px 24px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.35)'}`,
                                                            },
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                p: { xs: 2.5, sm: 3, md: 3.5 },
                                                                display: 'flex',
                                                                flexDirection: { xs: 'column', lg: 'row' },
                                                                justifyContent: 'space-between',
                                                                alignItems: { xs: 'flex-start', lg: 'center' },
                                                                gap: { xs: 3, md: 4, lg: 2 },
                                                            }}
                                                        >
                                                            {/* Left Section: Asset Info */}
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 2,
                                                                    flex: '0 0 auto',
                                                                    minWidth: { xs: '100%', lg: 'auto' },
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 48,
                                                                        height: 48,
                                                                        borderRadius: '50%',
                                                                        overflow: 'hidden',
                                                                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                                                        flexShrink: 0,
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={`${CRYPTOIMAGEURL}/${asset?.currencyCode}.png`}
                                                                        alt={asset?.currencyCode}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'cover',
                                                                        }}
                                                                    />
                                                                </Box>

                                                                <Box>
                                                                    <Typography
                                                                        variant="h6"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            fontSize: { xs: '1rem', md: '1.1rem' },
                                                                            color: theme.palette.text.primary,
                                                                            mb: 0.25,
                                                                        }}
                                                                    >
                                                                        {asset?.currencyCode}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: theme.palette.text.secondary,
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        {asset?.currencyName}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            {/* Middle Section: Current Price + Balance + Holdings */}
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    gap: { xs: 5, md: 7 },
                                                                    flex: '1 1 auto',
                                                                    minWidth: { xs: '100%', lg: 'auto' },
                                                                    justifyContent: 'center',
                                                                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                                                                }}
                                                            >
                                                                {/* Current Price & Change */}
                                                                <Box sx={{ flex: '0 0 auto' }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: theme.palette.text.secondary,
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 500,
                                                                            mb: 0.5,
                                                                        }}
                                                                    >
                                                                        Current Price
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="h6"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            fontSize: { xs: '0.95rem', md: '1.05rem' },
                                                                            color: theme.palette.text.primary,
                                                                            mb: 0.5,
                                                                        }}
                                                                    >
                                                                        ${parseFloat(asset.lastPrice).toFixed(2)}
                                                                    </Typography>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        {asset?.roc >= 0 ? (
                                                                            <TrendingUp sx={{ fontSize: 16, color: '#22c55e' }} />
                                                                        ) : (
                                                                            <TrendingDown sx={{ fontSize: 16, color: '#ef4444' }} />
                                                                        )}
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{
                                                                                color: asset.roc >= 0 ? '#22c55e' : '#ef4444',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.85rem',
                                                                            }}
                                                                        >
                                                                            {asset?.roc >= 0 ? '+' : ''}{asset?.roc}%
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                {/* Available Balance */}
                                                                <Box sx={{ flex: '0 0 auto' }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: theme.palette.text.secondary,
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 500,
                                                                            mb: 0.75,
                                                                            letterSpacing: 0.5,
                                                                        }}
                                                                    >
                                                                        Balance
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="h6"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            fontSize: { xs: '0.95rem', md: '1.05rem' },
                                                                            color: theme.palette.text.primary,
                                                                        }}
                                                                    >
                                                                        {asset?.closingBalance}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: theme.palette.text.secondary,
                                                                            fontSize: '0.7rem',
                                                                        }}
                                                                    >
                                                                        {asset?.currencyCode}
                                                                    </Typography>
                                                                </Box>

                                                                {/* Holdings */}
                                                                <Box sx={{ flex: '0 0 auto' }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            color: theme.palette.text.secondary,
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 500,
                                                                            mb: 0.75,
                                                                            letterSpacing: 0.5,
                                                                        }}
                                                                    >
                                                                        Holdings
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="h6"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            fontSize: { xs: '0.95rem', md: '1.05rem' },
                                                                            color: theme.palette.text.primary,
                                                                        }}
                                                                    >
                                                                        {asset?.totalBalance}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: theme.palette.text.secondary,
                                                                            fontSize: '0.7rem',
                                                                        }}
                                                                    >
                                                                        ${asset?.holdingInUsd}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            {/* Right Section: Action Buttons (Vertical) */}
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 1.5,
                                                                    minWidth: { xs: '100%', lg: 180 },
                                                                    width: { xs: '100%', lg: 'auto' },
                                                                }}
                                                            >
                                                                {asset?.currencyType === 2 ? (
                                                                    <>
                                                                        <Button
                                                                            disabled={loading || asset?.sendAccess !== 1}
                                                                            onClick={() => setupCryptoSend(asset)}
                                                                            variant="outlined"
                                                                            fullWidth={isMobile}
                                                                            startIcon={<Send sx={{ fontSize: 16 }} />}
                                                                            sx={{
                                                                                color: '#1e40af',
                                                                                borderColor: '#1e40af',
                                                                                fontSize: '0.85rem',
                                                                                fontWeight: 600,
                                                                                py: 1,
                                                                                px: 2,
                                                                                minWidth: 140,
                                                                                borderRadius: 2,
                                                                                whiteSpace: 'nowrap',
                                                                                transition: 'all 0.2s ease-in-out',
                                                                                '&:hover': {
                                                                                    backgroundColor: theme.palette.mode === 'light'
                                                                                        ? 'rgba(30, 64, 175, 0.08)'
                                                                                        : 'rgba(66, 165, 245, 0.12)',
                                                                                    borderColor: '#0ea5e9',
                                                                                },
                                                                            }}
                                                                        >
                                                                            Send
                                                                        </Button>

                                                                        <Button
                                                                            disabled={loading || asset?.receiveAccess !== 1}
                                                                            onClick={() => setupCryptoReceive(asset)}
                                                                            variant="outlined"
                                                                            fullWidth={isMobile}
                                                                            startIcon={<CallReceived sx={{ fontSize: 16 }} />}
                                                                            sx={{
                                                                                color: '#22c55e',
                                                                                borderColor: '#22c55e',
                                                                                fontSize: '0.85rem',
                                                                                fontWeight: 600,
                                                                                py: 1,
                                                                                px: 2,
                                                                                minWidth: 140,
                                                                                borderRadius: 2,
                                                                                whiteSpace: 'nowrap',
                                                                                transition: 'all 0.2s ease-in-out',
                                                                                '&:hover': {
                                                                                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                                                                                    borderColor: '#16a34a',
                                                                                },
                                                                            }}
                                                                        >
                                                                            Receive
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button
                                                                            disabled={loading}
                                                                            onClick={() => setupFiatDeposit(asset)}
                                                                            variant="outlined"
                                                                            fullWidth={isMobile}
                                                                            startIcon={<Send sx={{ fontSize: 16 }} />}
                                                                            sx={{
                                                                                color: '#1e40af',
                                                                                borderColor: '#1e40af',
                                                                                fontSize: '0.85rem',
                                                                                fontWeight: 600,
                                                                                py: 1,
                                                                                px: 2,
                                                                                minWidth: 140,
                                                                                borderRadius: 2,
                                                                                whiteSpace: 'nowrap',
                                                                                transition: 'all 0.2s ease-in-out',
                                                                                '&:hover': {
                                                                                    backgroundColor: theme.palette.mode === 'light'
                                                                                        ? 'rgba(30, 64, 175, 0.08)'
                                                                                        : 'rgba(66, 165, 245, 0.12)',
                                                                                    borderColor: '#0ea5e9',
                                                                                },
                                                                            }}
                                                                        >
                                                                            Deposit
                                                                        </Button>

                                                                        <Button
                                                                            disabled={loading}
                                                                            onClick={() => setupFiatWithdraw(asset)}
                                                                            variant="outlined"
                                                                            fullWidth={isMobile}
                                                                            startIcon={<CallReceived sx={{ fontSize: 16 }} />}
                                                                            sx={{
                                                                                color: '#22c55e',
                                                                                borderColor: '#22c55e',
                                                                                fontSize: '0.85rem',
                                                                                fontWeight: 600,
                                                                                py: 1,
                                                                                px: 2,
                                                                                minWidth: 140,
                                                                                borderRadius: 2,
                                                                                whiteSpace: 'nowrap',
                                                                                transition: 'all 0.2s ease-in-out',
                                                                                '&:hover': {
                                                                                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                                                                                    borderColor: '#16a34a',
                                                                                },
                                                                            }}
                                                                        >
                                                                            Withdraw
                                                                        </Button>
                                                                    </>
                                                                )}

                                                                {/* Convert to Bito Dollar Button */}
                                                                {asset.currencyCode !== 'USDB' && asset.isBrokerCurrency !== 1 &&
                                                                    <BitoDollarConvertContent
                                                                        assetId={asset.currencyId.toString()}
                                                                        assetCode={asset.currencyCode}
                                                                        balance={asset.closingBalance.toString()}
                                                                        themeMode={mode}
                                                                        onConversionSuccess={handleOnConversionSuccess}
                                                                    />}
                                                            </Box>
                                                        </Box>
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
                                                        flexWrap: { xs: 'wrap', md: 'nowrap' }, // ⬅️ CHANGE 1: Only wrap on mobile
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
                                                            Wallet Transactions History
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{
                                                        display: 'flex',
                                                        gap: 1,
                                                        alignItems: 'center',
                                                        flexWrap: { xs: 'wrap', md: 'nowrap' }, // ⬅️ CHANGE 2: Only wrap buttons on mobile
                                                        justifyContent: { xs: 'center', md: 'flex-end' } // ⬅️ CHANGE 3: Align buttons properly
                                                    }}>
                                                        <Button
                                                            disabled={loading}
                                                            variant={transactionFilter === 'deposit' ? 'contained' : 'outlined'}
                                                            size="small"
                                                            onClick={() => handleTransactionFilter('deposit')}
                                                            sx={{
                                                                backgroundColor: transactionFilter === 'deposit' ? theme.palette.primary.main : 'transparent',
                                                                color: transactionFilter === 'deposit' ? 'white' : theme.palette.primary.main,
                                                                borderColor: theme.palette.primary.main,
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem',
                                                                px: 2,
                                                                py: 0.5,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 0.5,
                                                                minWidth: 70,
                                                                flexShrink: 0, // ⬅️ CHANGE 4: Prevent buttons from shrinking
                                                                '&:hover': {
                                                                    backgroundColor: transactionFilter === 'deposit' ? theme.palette.primary.dark : theme.palette.mode === 'light'
                                                                        ? 'rgba(30, 64, 175, 0.08)'
                                                                        : 'rgba(66, 165, 245, 0.08)',
                                                                }
                                                            }}
                                                        >
                                                            Deposit
                                                        </Button>
                                                        <Button
                                                            disabled={loading}
                                                            variant={transactionFilter === 'withdraw' ? 'contained' : 'outlined'}
                                                            size="small"
                                                            onClick={() => handleTransactionFilter('withdraw')}
                                                            sx={{
                                                                backgroundColor: transactionFilter === 'withdraw' ? theme.palette.primary.main : 'transparent',
                                                                color: transactionFilter === 'withdraw' ? 'white' : theme.palette.primary.main,
                                                                borderColor: theme.palette.primary.main,
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem',
                                                                px: 2,
                                                                py: 0.5,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 0.5,
                                                                minWidth: 70,
                                                                flexShrink: 0, // ⬅️ Prevent buttons from shrinking
                                                                '&:hover': {
                                                                    backgroundColor: transactionFilter === 'send' ? theme.palette.primary.dark : theme.palette.mode === 'light'
                                                                        ? 'rgba(30, 64, 175, 0.08)'
                                                                        : 'rgba(66, 165, 245, 0.08)',
                                                                }
                                                            }}
                                                        >
                                                            Withdraw
                                                        </Button>
                                                        <Button
                                                            disabled={loading}
                                                            variant={transactionFilter === 'send' ? 'contained' : 'outlined'}
                                                            size="small"
                                                            onClick={() => handleTransactionFilter('send')}
                                                            sx={{
                                                                backgroundColor: transactionFilter === 'send' ? theme.palette.primary.main : 'transparent',
                                                                color: transactionFilter === 'send' ? 'white' : theme.palette.primary.main,
                                                                borderColor: theme.palette.primary.main,
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem',
                                                                px: 2,
                                                                py: 0.5,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 0.5,
                                                                minWidth: 70,
                                                                flexShrink: 0, // ⬅️ Prevent buttons from shrinking
                                                                '&:hover': {
                                                                    backgroundColor: transactionFilter === 'send' ? theme.palette.primary.dark : theme.palette.mode === 'light'
                                                                        ? 'rgba(30, 64, 175, 0.08)'
                                                                        : 'rgba(66, 165, 245, 0.08)',
                                                                }
                                                            }}
                                                        >
                                                            Sent
                                                        </Button>
                                                        <Button
                                                            disabled={loading}
                                                            variant={transactionFilter === 'received' ? 'contained' : 'outlined'}
                                                            size="small"
                                                            onClick={() => handleTransactionFilter('received')}
                                                            sx={{
                                                                backgroundColor: transactionFilter === 'received' ? theme.palette.primary.main : 'transparent',
                                                                color: transactionFilter === 'received' ? 'white' : theme.palette.primary.main,
                                                                borderColor: theme.palette.primary.main,
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem',
                                                                px: 2,
                                                                py: 0.5,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 0.5,
                                                                minWidth: 70,
                                                                flexShrink: 0, // ⬅️ Prevent buttons from shrinking
                                                                '&:hover': {
                                                                    backgroundColor: transactionFilter === 'received' ? theme.palette.primary.dark : theme.palette.mode === 'light'
                                                                        ? 'rgba(30, 64, 175, 0.08)'
                                                                        : 'rgba(66, 165, 245, 0.08)',
                                                                }
                                                            }}
                                                        >
                                                            Received
                                                        </Button>
                                                    </Box>
                                                </Box>

                                                {/* Transaction Content */}
                                                <Box sx={{ minHeight: 300 }}>
                                                    {/* Desktop Table Header - Only show when there are transactions */}
                                                    {walletTransactions.length > 0 && (
                                                        <Box
                                                            sx={{
                                                                display: { xs: 'none', lg: 'flex' },
                                                                p: 2,
                                                                backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                                                borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                                            }}
                                                        >
                                                            {['TimeStamp', 'Description', 'Asset', 'Amount', 'Action', 'Status'].map((header, index) => (
                                                                <Typography
                                                                    key={header}
                                                                    variant="body2"
                                                                    sx={{
                                                                        flex: index === 1 ? 2 : 1,
                                                                        fontWeight: 600,
                                                                        color: theme.palette.text.secondary,
                                                                        fontSize: '0.875rem',
                                                                        textAlign: index === 3 ? 'right' : 'center',
                                                                        px: 1
                                                                    }}
                                                                >
                                                                    {header}
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    )}

                                                    {/* Empty State */}
                                                    {walletTransactions.length === 0 ? <Box
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
                                                            Your transaction history will appear here once you start trading.
                                                            All your sends, receives, and trades will be tracked securely.
                                                        </Typography>
                                                        <Button
                                                            disabled={loading}
                                                            variant="contained"
                                                            onClick={() => toggleScreen('buy_swap')}
                                                            sx={{
                                                                backgroundColor: theme.palette.primary.main,
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                px: 3,
                                                                py: 1.5,
                                                                borderRadius: 2,
                                                                '&:hover': {
                                                                    backgroundColor: theme.palette.primary.dark,
                                                                    transform: 'translateY(-1px)',
                                                                },
                                                                transition: 'all 0.2s ease-in-out'
                                                            }}
                                                        >
                                                            Start Trading
                                                        </Button>
                                                    </Box> : <Box
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
                                                            {walletTransactions.map((transaction: WalletTransaction, index) => (
                                                                <Box
                                                                    key={`${transaction?.transactionId}_${index}`}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        py: 2,
                                                                        px: 2,
                                                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                                                        '&:hover': {
                                                                            backgroundColor: theme.palette.mode === 'light'
                                                                                ? 'rgba(0,0,0,0.02)'
                                                                                : 'rgba(255,255,255,0.02)'
                                                                        },
                                                                        transition: 'background-color 0.2s ease'
                                                                    }}
                                                                >
                                                                    {/* Timestamp */}
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            flex: '0 0 auto',
                                                                            width: '140px', // Fixed width instead of flex: 1
                                                                            fontWeight: 500,
                                                                            color: 'text.primary',
                                                                            fontSize: '0.875rem',
                                                                            px: 1
                                                                        }}
                                                                    >
                                                                        {transactionFilter === 'send' || transactionFilter === 'received' ? formatDate(transaction?.transactionTimestamp) : transactionFilter === 'withdraw' ? formatDate(transaction?.timestamp) : formatDate(transaction?.created)}
                                                                    </Typography>

                                                                    {/* Description */}
                                                                    <Box sx={{
                                                                        flex: '1 1 auto', // Allow this to grow
                                                                        minWidth: '200px',
                                                                        px: 1
                                                                    }}>
                                                                        {transactionFilter === 'send' || transactionFilter === 'received' ?
                                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                                {getActionIcon(transaction.action)}
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        fontWeight: 500,
                                                                                        color: 'text.primary',
                                                                                        fontSize: '0.875rem'
                                                                                    }}
                                                                                >
                                                                                    {transaction.description}
                                                                                </Typography>
                                                                            </Stack>
                                                                            : transactionFilter === 'deposit' ?
                                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={{
                                                                                            fontWeight: 500,
                                                                                            color: 'text.primary',
                                                                                            fontSize: '0.875rem'
                                                                                        }}
                                                                                    >
                                                                                        {transaction.currency} Deposited
                                                                                    </Typography>
                                                                                </Stack>
                                                                                :
                                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        sx={{
                                                                                            fontWeight: 500,
                                                                                            color: 'text.primary',
                                                                                            fontSize: '0.875rem'
                                                                                        }}
                                                                                    >
                                                                                        {transaction.currency} Withdrawal
                                                                                    </Typography>
                                                                                </Stack>
                                                                        }
                                                                        {transaction.orderId && (
                                                                            <Typography
                                                                                variant="caption"
                                                                                sx={{
                                                                                    color: 'text.secondary',
                                                                                    fontSize: '0.75rem',
                                                                                    fontFamily: 'monospace'
                                                                                }}
                                                                            >
                                                                                #{transactionFilter === 'send' || transactionFilter === 'received' ? transaction.orderId : transactionFilter === 'deposit' ? transaction.order_no : transaction.withdrawalId}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>

                                                                    {/* Asset */}
                                                                    <Box sx={{
                                                                        flex: '0 0 auto',
                                                                        width: '100px', // Fixed width instead of flex: 1
                                                                        px: 1
                                                                    }}>
                                                                        <Chip
                                                                            label={transaction.currency}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{
                                                                                fontWeight: 600,
                                                                                fontSize: '0.75rem',
                                                                                alignItems: 'center',
                                                                            }}
                                                                        />
                                                                    </Box>

                                                                    {/* Amount */}
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            flex: '0 0 auto',
                                                                            width: '140px', // Fixed width instead of flex: 1
                                                                            fontWeight: 600,
                                                                            color: transactionFilter.toLowerCase() === 'send' || transactionFilter.toLowerCase() === 'deposit' ? 'error.main' : 'success.main',
                                                                            fontSize: '0.875rem',
                                                                            textAlign: 'right',
                                                                            px: 1,
                                                                            fontFamily: 'monospace'
                                                                        }}
                                                                    >
                                                                        {transactionFilter.toLowerCase() === 'send' || transactionFilter.toLowerCase() === 'deposit' ? '-' : '+'}
                                                                        {(() => {
                                                                            if (transactionFilter.toLowerCase() === 'send') {
                                                                                const amount = Number(transaction.debitAmount ?? 0);
                                                                                return amount.toLocaleString();
                                                                            } else  if (transactionFilter.toLowerCase() === 'received') {
                                                                                const amount = Number(transaction.creditAmount ?? 0);
                                                                                return amount.toLocaleString();    
                                                                            } else if (transactionFilter === 'deposit') {
                                                                                return Number(transaction.amount ?? 0).toLocaleString();
                                                                            } else {
                                                                                const amt = Number(transaction.amount ?? 0);
                                                                                const fee = Number(transaction.txnCharge ?? 0);
                                                                                return (amt - fee).toLocaleString();
                                                                            }
                                                                        })()} {transaction.currency}
                                                                    </Typography>

                                                                    {/* Action */}
                                                                    <Box sx={{
                                                                        flex: '0 0 auto',
                                                                        width: '100px',
                                                                        px: 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}>
                                                                        <Chip
                                                                            label={transactionFilter}
                                                                            size="small"
                                                                            color={transactionFilter.toLowerCase() === 'send' || transactionFilter.toLowerCase() === 'deposit' ? 'error' : 'success'}
                                                                            variant="outlined"
                                                                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                                        />
                                                                    </Box>

                                                                    {/* Status */}
                                                                    <Box sx={{
                                                                        flex: '0 0 auto',
                                                                        width: '140px', // Fixed width instead of flex: 1
                                                                        px: 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'flex-start'
                                                                    }}>
                                                                        <Chip
                                                                            icon={getStatusConfig(transactionFilter === 'send' || transactionFilter === 'received' ? transaction?.status === 1 ? 1 : transaction?.status === 0 ? 0 : -1 : transactionFilter === 'deposit' ? transaction?.status === 17 ? 1 : 0 : transaction?.status === 'Confirmed' ? 1 : -1)?.icon || null}
                                                                            label={getStatusConfig(transactionFilter === 'send' || transactionFilter === 'received' ? transaction?.status === 1 ? 1 : transaction?.status === 0 ? 0 : -1 : transactionFilter === 'deposit' ? transaction?.status === 17 ? 1 : 0 : transaction?.status === 'Confirmed' ? 1 : -1)?.label}
                                                                            size="small"
                                                                            color={(getStatusConfig(transactionFilter === 'send' || transactionFilter === 'received' ? transaction?.status === 1 ? 1 : transaction?.status === 0 ? 0 : -1 : transactionFilter === 'deposit' ? transaction?.status === 17 ? 1 : 0 : transaction?.status === 'Confirmed' ? 1 : -1)?.color || 'success') as "success" | "warning" | "error" | "default" | "primary" | "secondary" | "info"}
                                                                            variant="filled"
                                                                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                                        />
                                                                        {(transactionFilter === 'send' || transactionFilter === 'received') && transaction.currencyTxnid && transaction.currencyUrl && (
                                                                            <Tooltip title="View on Explorer">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => openTransactionUrl(transaction.currencyUrl, transaction.currencyTxnid)}
                                                                                    sx={{ ml: 1 }}
                                                                                >
                                                                                    <LaunchIcon sx={{ fontSize: 16 }} />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                            ))}
                                                    </Box>}

                                                    {/* Pagination Footer */}
                                                    {walletTransactions.length > 0 && <Box
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
                                                            Showing {walletTransactions.length} of {totalCount} transactions
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <IconButton
                                                                size="small"
                                                                onChange={() => handlePaginationSelection('prev')}
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
                                                                disabled
                                                                onChange={() => handlePaginationSelection('next')}
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
                    </Fragment>
                    }
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

                {/* Modal for fees */}
                <Dialog
                    open={openFeesModal}
                    onClose={() => setOpenFeesModal(false)}
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
                            Fees
                        </Typography>
                        <IconButton
                            onClick={() => setOpenFeesModal(false)}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ px: 3, py: 2 }}>
                        {/* Summary Section */}
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: theme.palette.text.primary,
                                    fontWeight: 600,
                                    mb: 2,
                                    fontSize: '1.1rem'
                                }}
                            >
                                Summary - 30 Days
                            </Typography>

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    mb: 3
                                }}
                            >
                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            mb: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        Total Volume
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: theme.palette.text.primary,
                                            fontWeight: 600,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        ${userExchangeFee?.totalVolume}
                                    </Typography>
                                </Box>

                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            mb: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        Total Fees Accrued
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: theme.palette.text.primary,
                                            fontWeight: 600,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        ${userExchangeFee?.totalFees}
                                    </Typography>
                                </Box>

                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            mb: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        Current Maker Fees
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: theme.palette.text.primary,
                                            fontWeight: 600,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {userExchangeFee?.makerFee}
                                    </Typography>
                                </Box>

                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            mb: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        Current Taker Fees
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: theme.palette.text.primary,
                                            fontWeight: 600,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {userExchangeFee?.takerFee}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Explanatory Text */}
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.8rem',
                                    lineHeight: 1.5,
                                    textAlign: 'justify'
                                }}
                            >
                                Your fee tier is based upon total USD trading volume over the trailing 30 day periods. Total Volume includes volume for trading Pairs in CONVERT, SPOT and OTC trading
                                consolidated across all BitConnect subaccounts. If a USD value is not available, we log the BTC amount of each filled order. Transactions made via our USD Basis are
                                converted to USD based on the most recent 24 hour average price from a third-party subscription book.
                            </Typography>
                        </Box>

                        {/* Fee Tiers Table */}
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: theme.palette.text.primary,
                                    fontWeight: 600,
                                    mb: 2,
                                    fontSize: '1rem'
                                }}
                            >
                                Fee Structure
                            </Typography>

                            {/* Table Header */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    p: 2,
                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px 8px 0 0',
                                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        flex: 2,
                                        fontWeight: 600,
                                        color: theme.palette.text.secondary,
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    Tier (30 Day Trading)
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        flex: 1,
                                        fontWeight: 600,
                                        color: theme.palette.text.secondary,
                                        fontSize: '0.8rem',
                                        textAlign: 'center'
                                    }}
                                >
                                    Maker Fee
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        flex: 1,
                                        fontWeight: 600,
                                        color: theme.palette.text.secondary,
                                        fontSize: '0.8rem',
                                        textAlign: 'center'
                                    }}
                                >
                                    Taker Fee
                                </Typography>
                            </Box>

                            {/* Table Rows */}
                            {exchangeFees.map((fee, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        p: 2,
                                        borderLeft: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                        borderRight: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                        borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                                        backgroundColor: index % 2 === 0
                                            ? (theme.palette.mode === 'light' ? '#ffffff' : theme.palette.background.paper)
                                            : (theme.palette.mode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)'),
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'light' ? 'rgba(30, 64, 175, 0.02)' : 'rgba(66, 165, 245, 0.02)',
                                        }
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            flex: 2,
                                            color: theme.palette.text.primary,
                                            fontSize: '0.8rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        {fee.volumeFrom} - {fee.volumeTo}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            flex: 1,
                                            color: theme.palette.text.primary,
                                            fontSize: '0.8rem',
                                            textAlign: 'center',
                                            fontWeight: 500
                                        }}
                                    >
                                        {fee.makerFee}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            flex: 1,
                                            color: theme.palette.text.primary,
                                            fontSize: '0.8rem',
                                            textAlign: 'center',
                                            fontWeight: 500
                                        }}
                                    >
                                        {fee.takerFee}%
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Bottom Explanatory Text */}
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.75rem',
                                    lineHeight: 1.4,
                                    textAlign: 'justify'
                                }}
                            >
                                PayBDC uses a maker-taker fee model for determining its trading fees. Orders that provide liquidity (maker orders) are charged different fees from orders that take liquidity
                                (taker orders). All limit orders you place will be charged the maker taker fees schedule above. All stop limit orders are charged as taker fees. All market orders are
                                considered as &quot;taking liquidity&quot; and charged as a taker. When you place an order at the market price that gets filled immediately, you are considered a taker. When you place an order where no part is automatically matched,
                                you provide liquidity to the market and are charged as maker. Note that you might move a mix of both orders (some will be maker orders and some will be taker orders). Some partially filled orders
                                you are charged as a taker for the rest that moves trading and charged as a maker for the rest. Note that trades that has been cancelled, will show in the order detail and
                                order report.
                            </Typography>
                        </Box>
                    </DialogContent>
                </Dialog>

                {/* Modal for Deposit */}
                <Dialog
                    open={openDepositModal}
                    onClose={() => setOpenDepositModal(false)}
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
                            Deposit {selectedCryptoForWalletProcess?.currencyCode}
                        </Typography>
                        <IconButton
                            onClick={() => setOpenDepositModal(false)}
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
                                    {selectedCryptoForWalletProcess?.closingBalance || 0}   {selectedCryptoForWalletProcess?.currencyCode}
                                </Typography>
                            </Box>



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
                                    defaultValue={amountForDeposit}
                                    onChange={(e) => handleDepositAmount(e as React.ChangeEvent<HTMLInputElement>)}
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
                                onClick={handleDepositSubmit}
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
                                {loading ? 'Processing Transaction...' : 'Deposit'}
                            </Button>

                            <Divider sx={{ my: 1 }} />

                            {/* range */}
                            <Box>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Range:
                                    </Typography>
                                    <Chip
                                        label={`${selectedFiatTier?.minLimit || 0} ${selectedCryptoForWalletProcess?.currencyCode}`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        to
                                    </Typography>
                                    <Chip
                                        label={`${selectedFiatTier?.dailySendLimit || 0} ${selectedCryptoForWalletProcess?.currencyCode}`}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                    />
                                </Box>

                            </Box>
                            {/* Additional Info */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'warning.dark' }}>
                                    Security Tips
                                </Typography>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Ensure the deposit amount entered matches your intended transaction.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Always use your registered bank account for deposits.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Do not share your transaction reference or payment details with anyone.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Confirm that the payment gateway or bank details shown belong to the verified platform.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Avoid depositing from third-party or joint accounts to prevent delays or rejection.
                                    </Typography>
                                </Stack>

                            </Paper>



                        </Stack>
                    </DialogContent>
                </Dialog>
                {/* Modal for Withdraw */}
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
                            Withdraw {selectedCryptoForWalletProcess?.currencyCode}
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
                                    {selectedCryptoForWalletProcess?.closingBalance || 0}   {selectedCryptoForWalletProcess?.currencyCode}
                                </Typography>
                            </Box>

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

                            {/* 2FA OTP Field */}
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                    2FA OTP
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="text"
                                    placeholder="Enter OTP from your Google Authenticator App"
                                    value={twoFactorOTPForWithdraw}
                                    onChange={(e) => setTwoFactorOTPForWithdraw(e.target.value)}
                                    inputProps={{
                                        maxLength: 6,
                                        pattern: '[0-9]*'
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
                                startIcon={loading ? null : <CallReceived />}
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
                                {loading ? 'Processing Transaction...' : 'Withdraw'}
                            </Button>

                            <Divider sx={{ my: 1 }} />

                            {/* range */}
                            <Box>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Range:
                                    </Typography>
                                    <Chip
                                        label={`${selectedFiatTier?.minLimit || 0} ${selectedCryptoForWalletProcess?.currencyCode}`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        to
                                    </Typography>
                                    <Chip
                                        label={`${selectedFiatTier?.dailySendLimit || 0} ${selectedCryptoForWalletProcess?.currencyCode}`}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>

                            {/* Additional Info */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'warning.dark' }}>
                                    Security Tips
                                </Typography>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Ensure the withdrawal bank account belongs to you and matches your registered details.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Double-check the account number and IFSC/branch details before confirming the withdrawal.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Avoid sharing OTPs or confirmation codes with anyone — the platform will never ask for them.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Do not use third-party or unverified bank accounts for withdrawals.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Review the withdrawal limits and fees before submitting your request.
                                    </Typography>
                                </Stack>
                            </Paper>
                        </Stack>
                    </DialogContent>
                </Dialog>

                {/* Modal for send */}
                <Dialog
                    open={openSendModal}
                    onClose={() => setOpenSendModal(false)}
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
                            Send {selectedCryptoForWalletProcess?.currencyCode}
                        </Typography>
                        <IconButton
                            onClick={() => setOpenSendModal(false)}
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
                                    {selectedCryptoForWalletProcess?.closingBalance || 0}   {selectedCryptoForWalletProcess?.currencyCode}
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
                                    value={sendAddress}
                                    onChange={(e) => handleSendAddress(e.target.value)}
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
                                {sendAddressValidate !== 'blank' && <Typography variant="h6" sx={{ mt: '2px', mb: '2px', fontWeight: 300, textAlign: 'center', color: sendAddressValidate === 'valid' ? 'green' : 'red' }}>
                                    {sendAddressValidate === 'valid' ? `Address is valid` : `Address not valid`}
                                </Typography>}
                            </Box>
                            {/* Token type */}
                            {selectedCryptoForWalletProcess?.tokens && selectedCryptoForWalletProcess.tokens.length > 1 && <Box sx={{ flex: 1, width: '100%' }}>
                                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                    Token
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        displayEmpty
                                        value={selectedTokenType}
                                        onChange={(e) => handleTokenChangeForSend(e.target.value)}
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
                                                Select Token
                                            </Typography>
                                        </MenuItem>
                                        {selectedCryptoForWalletProcess?.tokens.map((token: Token) => (
                                            <MenuItem value={token.tokenType} key={token.tokenType}>{token.tokenType}</MenuItem>
                                        ))}

                                    </Select>
                                </FormControl>
                            </Box>}

                            {/*  Tag */}
                            {selectedCryptoForWalletProcess?.memoRequired === 1 || selectedCryptoForWalletProcess?.currencyCode === 'HCX' && <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {selectedCryptoForWalletProcess?.currencyCode} Tag
                                    </Typography>
                                    <Tooltip title="Optional identifier for tracking transactions">
                                        <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    </Tooltip>
                                </Box>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Optional transaction memo"
                                    value={sendMemo}
                                    onChange={(e) => setSendMemo(e.target.value)}
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
                                    defaultValue={amountForSend}
                                    onChange={(e) => handleSendAmount(e as React.ChangeEvent<HTMLInputElement>)}
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
                            {/* 2FA OTP Field */}
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                    2FA OTP
                                </Typography>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="text"
                                    placeholder="Enter OTP from your Google Authenticator App"
                                    value={twoFactorOTPForSend}
                                    onChange={(e) => setTwoFactorOTPForSend(e.target.value)}
                                    inputProps={{
                                        maxLength: 6,
                                        pattern: '[0-9]*'
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
                                onClick={handleSendSubmit}
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
                                        Network Fee Estimation : {charges.networkFees}
                                    </Typography>
                                </Box>
                                {parseFloat(charges.gstCharges) > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Info sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        GST : {charges.gstCharges}
                                    </Typography>
                                </Box>}
                                {parseFloat(charges.tdsCharges) > 0 && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Info sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                        TDS : {charges.tdsCharges}
                                    </Typography>
                                </Box>}


                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Range:
                                    </Typography>
                                    <Chip
                                        label={`${selectedCryptoForWalletProcess?.fees?.fromFee || 0} ${selectedCryptoForWalletProcess?.currencyCode}`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        to
                                    </Typography>
                                    <Chip
                                        label={`${selectedCryptoForWalletProcess?.fees?.toFee || 0} ${selectedCryptoForWalletProcess?.currencyCode}`}
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

                {/* Modal for Receive */}
                <Dialog
                    open={openReceiveModal}
                    onClose={() => setOpenReceiveModal(false)}
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
                            Receive {selectedCryptoForWalletProcess?.currencyCode}
                        </Typography>
                        <IconButton
                            onClick={() => setOpenReceiveModal(false)}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ px: 3, py: 3 }}>
                        <Stack spacing={3}>
                            {/* Warning Notice */}
                            <Alert
                                severity="info"
                                sx={{
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                    '& .MuiAlert-icon': {
                                        color: 'primary.main'
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Important Notice
                                </Typography>
                                <Typography variant="body2">
                                    Only send {selectedCryptoForWalletProcess?.currencyCode} and {selectedCryptoForWalletProcess?.action}-compatible tokens to this address.
                                    Sending other cryptocurrencies may result in permanent loss.
                                </Typography>
                            </Alert>

                            {/* Token type */}
                            {selectedCryptoForWalletProcess?.tokens && selectedCryptoForWalletProcess.tokens.length > 1 && <Box sx={{ flex: 1, width: '100%' }}>
                                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                    Token
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        displayEmpty
                                        value={selectedTokenType}
                                        onChange={(e) => handleTokenChangeForReceive(e.target.value)}
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
                                                Select Token
                                            </Typography>
                                        </MenuItem>
                                        {selectedCryptoForWalletProcess?.tokens.map((token: Token) => (
                                            <MenuItem value={token.tokenType} key={token.tokenType}>{token.tokenType}</MenuItem>
                                        ))}

                                    </Select>
                                </FormControl>
                            </Box>}

                            {/*  Tag */}
                            {receiveMemo !== null && <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {selectedCryptoForWalletProcess?.currencyCode} Tag
                                    </Typography>
                                    <Tooltip title="Optional identifier for tracking transactions">
                                        <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    </Tooltip>
                                </Box>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Optional transaction memo"
                                    value={receiveMemo}

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

                            {/* QR Code Section */}

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                                    border: `1px solid ${theme.palette.divider}`,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                    Wallet Address QR Code
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    <QrCode value={addressForReceive} size={150} />
                                </Box>

                            </Paper>


                            <Divider sx={{ my: 1 }}>
                                <Chip label="OR" size="small" color="primary" variant="outlined" />
                            </Divider>

                            {/* Address Section */}
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
                                    Wallet Address
                                </Typography>
                                <Box sx={{ position: 'relative' }}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        value={addressForReceive}
                                        InputProps={{
                                            readOnly: true,
                                            sx: {
                                                fontFamily: 'monospace',
                                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                                pr: 6, // Reduced padding for icon button
                                                backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
                                            },
                                            endAdornment: (
                                                <Tooltip title={copied ? 'Copied!' : 'Copy address'}>
                                                    <IconButton
                                                        onClick={handleCopyAddress}
                                                        sx={{
                                                            position: 'absolute',
                                                            right: 8,
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            color: copied ? 'success.main' : 'primary.main',
                                                            backgroundColor: copied
                                                                ? alpha(theme.palette.success.main, 0.1)
                                                                : alpha(theme.palette.primary.main, 0.1),
                                                            '&:hover': {
                                                                backgroundColor: copied
                                                                    ? alpha(theme.palette.success.main, 0.2)
                                                                    : alpha(theme.palette.primary.main, 0.2),
                                                                color: copied ? 'success.dark' : 'primary.dark'
                                                            },
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        {copied ? <CheckIcon /> : <CopyIcon />}
                                                    </IconButton>
                                                </Tooltip>
                                            )
                                        }}
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
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    This address is only for {selectedCryptoForWalletProcess?.currencyCode} and {selectedCryptoForWalletProcess?.action}-compatible tokens
                                </Typography>
                            </Box>
                            {/* Share Section */}
                            <Box>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<ShareIcon />}
                                    onClick={() => setOpenShareDialog(true)}
                                    sx={{
                                        borderColor: theme.palette.primary.main,
                                        color: theme.palette.primary.main,
                                        fontWeight: 600,
                                        py: 1.5,
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                            borderColor: theme.palette.primary.dark,
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    Share Wallet Address
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                                    Share your {selectedCryptoForWalletProcess?.currencyCode} wallet address with others in messages
                                </Typography>
                            </Box>
                            {/* Additional Info */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'warning.dark' }}>
                                    Security Tips
                                </Typography>
                                <Stack spacing={0.5}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Always verify the address before receiving funds
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Double-check the network compatibility
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        • Start with a small test transaction if unsure
                                    </Typography>
                                </Stack>
                            </Paper>
                        </Stack>
                    </DialogContent>
                </Dialog>
                {/* Share Content Dialog */}
                <ShareContentDialog
                    open={openShareDialog}
                    onClose={() => setOpenShareDialog(false)}
                    contentId={selectedCryptoForWalletProcess?.currencyId || 0}
                    contentType="TEXT"
                    message={`My ${selectedCryptoForWalletProcess?.currencyCode} Wallet Address: ${addressForReceive}${receiveMemo ? `\nMemo/Tag: ${receiveMemo}` : ''}`}
                    userId={userId}
                    onShareSuccess={handleShareSuccess}
                />

            </ThemeProvider>
        </Fragment>
    );
};

export default FinanceHubBuySwapPage;