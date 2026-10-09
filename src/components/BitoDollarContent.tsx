'use client'
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import dynamic from 'next/dynamic';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Alert,
    Tabs,
    Tab,
    useTheme,
    Stack,
    useMediaQuery,
    alpha,
    SelectChangeEvent,
    Snackbar,
    Backdrop,
    CircularProgress,
    createTheme,
    Pagination,
} from '@mui/material'
import {
    AccountBalanceWallet,
    Add,
    Remove,
    Download,
    Close,
    CheckCircle,
    Cancel,
    AttachMoney,
    CurrencyBitcoin,
    LocalOffer,
    AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material'
import axios from 'axios';
import { getBitoHubUserInfo, getUserBankDetails, getUserKycDetails, getBitoDollarTxnCharge, getUserHomeCurrency } from '../services/CoreDataService';
import { useRouter } from 'next/navigation';

/**
 * Adding paypal checkout button
 */
const PayPalCheckoutButton = dynamic(
    () => import('../components/PayPalCheckoutButton'),
    { ssr: false }
);
interface SendToOtherResposne {
    error: {
        error_data: number
        error_msg: string
    },

}

interface TxnChargeResponse {
    txnCharge: number
    message: string
}

interface HomeCurrency {
    homeCurrencyId: string;
    tradingFeesCurrencyId: string;
    tradingFeesCurrency: string;
    homeCurrency: string;
}


interface Transaction {
    transactionId: number;
    userId: number;
    firstName: string;
    email: string;
    description: string;
    action: string;
    status: string;
    transactionTimestamp: string;
    tradeId: number;
    offerId: number;
    offerQty: number;
    offerPrice: number;
    requestAmount: number;
    requestPrice: number;
    currency: string;
    debitAmount: number;
    creditAmount: number;
    miningFees: number;
    txnCharge: number;
    networkFees: number;
    openingBalance: number;
    closingBalance: number;
    tradeAssetAmount: string;
    copyTradeFlag: string;
    tds: number;
    tdsInInr: number;
    gstInInr: number;
    isBalanceLocked: number;
    isTravelData: number;
}


interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

interface FiatWithdrawResponse {
    message: string,
    success: boolean,
    returnId: number;
    orderId: string | null,
}
interface BitoDollarConversionResponse {
    message: string,
    success: boolean,
    returnId: number;
}
interface BitoDollarPayPalDepositResponse {
    message: string,
    status: boolean,
}
interface CurrencyConversionResponse {
    error: {
        error_data: number,
        error_msg: string,
    }
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
    //tokens: Array<Token>;
    //fees: Fees;
}

interface ApiTransaction {
    success: boolean,
    totalRows: number,
    transactions: Transaction[],
    error: string,
}

interface BalanceResponse {
    error: {
        error_data: number
        error_msg: string
    },
    userBalanceList: Asset[],
    totalCount: number;
}

interface BankDetails {
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
interface BaseResponse {
    data: Base[];
    success: boolean;
    message: string;
}

interface Base {
    baseCurrency: string;
    currencyId: number;
    currencyType: number;
}

interface MarketPriceResponse {
    marketPrice: number;
    error: {
        error_data: number;
        error_msg: string;
    };
}
// Replace your existing PayPalSuccess interface with this:
interface PayPalSuccess {
    id: string;
    status: string;
    payer?: {
        email_address?: string;
        name?: {
            given_name?: string;
            surname?: string;
        };
        payer_id?: string;
    };
    purchase_units?: Array<{
        amount?: {
            value?: string;
            currency_code?: string;
        };
        payments?: {
            captures?: Array<{
                id: string;
                status: string;
                amount: {
                    value: string;
                    currency_code: string;
                };
            }>;
        };
    }>;
}
interface TokenTypeResponse {
    response: {
        currencyId: number;
        currency: string;
        baseCurrency: string | null;
        currencyName: string | null;
        currencyCode: string | null;
        tokenType: string;
    }[];
    error: {
        error_data: number;
        error_msg: string;
    };
}
interface FeesResponse {
    error: {
        error_data: number;
        error_msg: string;
    };
    userBalanceList: null;
    userTransactionsResult: null;
    customerkeysResult: null;
    paymentOrdersListResult: null;
    invoicesListResult: null;
    feesListResult: Fees[];
    withdrawalListResult: null;
    customerLedgerResult: null;
    totalCount: number;
    checkBeforeBuy: boolean;
    transactionId: number;
    usdValue: number;
    fees: Fees;
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

interface AddressResponse {
    isValid: number;
    error: {
        error_data: number;
        error_msg: string;
    };
}

interface PayPalError {
    message: string;
    code?: string;
    details?: unknown;
}

interface UserDetails {
    firstName?: string
    middleName?: string
    lastName?: string
    address?: string
    city?: string
    state?: string
    country?: string
    zip?: string
    uuid?: string
    dob?: string
    ssn?: string
    birthPlace?: string
    industry?: string
    occupation?: string
    sourcesOfFunds?: string
    txnVolumeId?: string
    annualIncomeId?: string
    netWorthId?: string
    empCategory?: string
    empType?: string
    pep?: number | string
    bankingPartner?: string
    relationWithBank?: string
    accountPurpose?: string
    thirdParty?: number | string
    userDocsStatus?: string
    isKycFinished?: number
    userTierDocsStatus?: string
    panNo?: string
    tin?: string
    userType?: number
    enterpriseUser?: EnterpriseUser
}

interface EnterpriseUser {
    companyName?: string
    companyRegNo?: string
    incorporationCountry?: string
    companyWebsite?: string
    companyregAddress?: string
    companyregCity?: string
    companyregState?: string
    companyregZip?: string
    companyregCountry?: string
    companyOfficeAddress?: string
    companyOfficeCity?: string
    companyOfficeState?: string
    companyOfficeZip?: string
    companyOfficeCountry?: string
    businessActivity?: string
    accountPurpose?: string
    investmentSource?: string
    revenue?: string
    profit?: string
    companyAssets?: string
    transactionVolumes?: string
    transactionFrequency?: string
    bankingPartner?: string
    corporateStructure?: string
    relationWithBank?: string
    businessDescription?: string
    enterpriseOwners?: BeneficialOwner[]
}

interface BeneficialOwner {
    id?: number
    ownerUuid?: string
    enterpriseId?: number
    ownerType: string
    firstName: string
    middleName?: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    country: string
    zip: string
    dob: string
    birthPlace: string
    ssn: string
    ownershipPer: number
    pep: number
    action?: string
}
interface TransactionLimitResponse {
    error: string,
    value: FiatTierSettings | undefined
}
interface FiatTierSettings {
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

interface PayPalPayment {
    minAmount : number
    maxAmount : number
    currency : string
}

const TabPanel = ({ children, value, index }: TabPanelProps) => {
    return (
        <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
            {value === index && children}
        </Box>
    )
}

const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;


const BitoDollarContent: React.FC = () => {
    const router = useRouter();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
    const [paypalPaymentSetup, setPayPalPaymentSetup] = useState<PayPalPayment>({
        minAmount : 10,
        maxAmount : 500,
        currency : 'USD'
    })

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
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const isTablet = useMediaQuery(theme.breakpoints.down('md'))

    // State management
    const [balance, setBalance] = useState<number>(1234.56)
    const [depositModalOpen, setDepositModalOpen] = useState(false)
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
    const [withdrawTab, setWithdrawTab] = useState(0)
    const [kycApproved, setKycApproved] = useState(false)
    const [bankConnected, setBankConnected] = useState(false)
    const [selectedCryptoBase, setSelectedCryptoBase] = useState<Base | null>(null)
    const [selectedFiatBase, setSelectedFiatBase] = useState<Base | null>(null)
    const [networks, setNetworks] = useState<TokenTypeResponse['response']>([])
    const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
    const [fiatAmount, setFiatAmount] = useState('')
    const [usdbAmount, setUsdbAmount] = useState('')
    const [fiatTxnCharges, setFiatTxnCharges] = useState<number>(0)
    const [cryptoTxnCharges, setCryptoTxnCharges] = useState<number>(0)
    const [cryptoAmount, setCryptoAmount] = useState('')
    const [baseAmount, setBaseAmount] = useState('')
    const [cryptoMarketPrice, setCryptoMarketPrice] = useState<number>(0);
    const [fiatMarketPrice, setFiatMarketPrice] = useState<number>(0);
    const [walletAddress, setWalletAddress] = useState('')
    const [walletAddressValidate, setWalletAddressValidate] = useState<'valid' | 'invalid' | 'blank'>('blank')
    const [brokerId, setBrokerId] = useState<string>('');
    const [brokerCountry, setBrokerCountry] = useState<string>('');
    const [homeCurrency, setHomeCurrency] = useState<HomeCurrency | null>(null);
    const [userUuid, setUserUuid] = useState<string>('');
    const [userId, setUserId] = useState<number>(0);
    const [userKycTierType, setUserKycTierType] = useState<number>(1);
    const [userBitoDollarBalance, setUserBitoDollarBalance] = useState<Asset | null>(null);
    const [balanceInHomeCurrency, setBalanceInHomeCurrency] = useState<string>('0.00');
    const [searchString, setSearchString] = useState<string>('');
    const [pageNo, setPageNo] = useState<number>(1);
    const [noOfItemsPerPage, setNoOfItemsPerPage] = useState<number>(20);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [txnType, setTxnType] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAW' | 'EARNINGS' | 'SPENDING'>('ALL');
    const [txnFilterTab, setTxnFilterTab] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [bases, setBases] = useState<Base[]>([]);
    const [fees, setFees] = useState<Fees | null>(null)
    const [paypalModalOpen, setPaypalModalOpen] = useState(false);
    const [paypalAmount, setPaypalAmount] = useState('');
    const [selectedFiatTier, setSelectedFiatTier] = useState<FiatTierSettings | null>(null);
    const [selectedCryptoTier, setSelectedCryptoTier] = useState<Fees | null>(null);




    useEffect(() => {
        getUserDetails();
    }, [])

    /**
     * method defination to get user uuid & other details
     *  @returns {void}
     */
    const getUserDetails = async () => {
        const payload = {
            "adminUser": localStorage.getItem('uuid'),
        }
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
            setBrokerId(userObj.brokerId);
            setBrokerCountry(userObj.country);
            setUserUuid(userObj.uuid);
            setUserId(userObj.userId);
            setUserKycTierType(userObj.userTierType);
            const homeCurrencyResponse = await getUserHomeCurrency(userObj.country, userObj.brokerId);
            setHomeCurrency(homeCurrencyResponse.data);
            await getBitoDollarBalance(resp.uuid, homeCurrencyResponse.data.homeCurrency);


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

    /**
     * Method defination for getiing the user balance of bitodollar
     * @returns {void}
     */
    const getBitoDollarBalance = async (uuid: string, homeCurrency : string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            userUuid: uuid,
        }
        try {
            setLoading(true);
            const response = await axios.post<BalanceResponse>(
                `${API_BASE_URL}/finance-hub/getUserBalance`, payload,
                {
                    // headers: {
                    //     //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    // }
                }
            );
            const error = response.data.error;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            const userBalanceList = response.data.userBalanceList as Asset[];
            const bitoDollarBalance = userBalanceList.find((asset: Asset) => asset.currencyCode === 'USDB');
            console.log(bitoDollarBalance);
            setUserBitoDollarBalance(bitoDollarBalance ?? null);
            await getBitoDollarTransactions(pageNo, searchString, txnType);
            console.log('home currency', homeCurrency)
            const marketPrice = await getMarketPrice('USDB', homeCurrency);
            console.log(marketPrice);
            const usdBalance = bitoDollarBalance && marketPrice ? bitoDollarBalance.closingBalance * marketPrice : 0;
            setBalanceInHomeCurrency(!isNaN(usdBalance) ? usdBalance.toFixed(2) : '0.00');
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

    /**
     * Method defination for getting all bitodollar transactions
    */
    const getBitoDollarTransactions = async (pageNo: number, searchString: string, txnType: string) => {
        try {
            setLoading(true);
            const response = await axios.get<ApiTransaction>(
                `${API_BASE_URL}/finance-hub/bitowallet/transactions/${localStorage.getItem('uuid')}?startDate=&endDate=&txnType=${txnType}&rowsPerPage=${noOfItemsPerPage}&pageNo=${pageNo}&searchStr=${searchString}`,
                {
                    // headers: {
                    //     //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    // }
                }
            );
            const success = response.data.success;
            if (!success) {
                showSnackbar(response.data.error, 'error');
                return;
            }
            setTotalCount(response.data.totalRows);
            setTransactions(response.data.transactions);
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

    /**
     * Handle pagination page change
     */
    const handlePageChange = async (event: React.ChangeEvent<unknown>, value: number) => {
        setPageNo(value);
        await getBitoDollarTransactions(value, searchString, txnType);
    };

    /**
     * Method defination to hnadle redirection to route or page
     * @returns {void}
     */
    const handleRedirection = async (linkType: string, link: string) => {
        localStorage.setItem('show_screen', 'wallet');
        setTimeout(() => {
            localStorage.removeItem('show_screen');
        }, 50000);
        if (linkType === 'internal') {
            router.push(link)
        } else {
            window.location.href = link;
        }
    }

    // Handlers
    const handleDepositModalOpen = () => setDepositModalOpen(true)
    const handleDepositModalClose = () => setDepositModalOpen(false)
    /**
     * Methoddefination for opening withdraw popup
     */
    const handleWithdrawModalOpen = async () => {
        const responseBankDetails = await getUserBankDetails({ uuid: userUuid });
        const bankDetails = (responseBankDetails && responseBankDetails.data) as BankDetails;
        const error = bankDetails.error;
        if (error.error_data === 1) {
            showSnackbar(error.error_msg, 'error');
            return;
        }
        if (bankDetails?.bankDetailsResult?.account_no) {
            setBankConnected(true)
        } else {
            setBankConnected(false);
        }

        const responseKyc = await getUserKycDetails(userUuid);
        const kycData = responseKyc.data.userResult as UserDetails;
        if (kycData?.userDocsStatus === '1') {
            setKycApproved(true);
        } else {
            setKycApproved(false);
        }

        setWithdrawTab(0);
        setWithdrawModalOpen(true);





        await getAllBases();

    }

    /** 
     *  Method defination for rendering all bases of bitodollar
     *  @return {void}
     */
    const getAllBases = async () => {
        try {
            setLoading(true);
            const response = await axios.get<BaseResponse>(
                `${API_BASE_URL}/finance-hub/base-currency?brokerId=${brokerId}&currency=USDB&country=${brokerCountry}`,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );
            const success = response.data.success;
            const baseCurrencyList = response.data.data;
            if (!success) {
                showSnackbar(response.data.message, 'error');
                return;
            }
            setBases(baseCurrencyList);
            const fiatBase = baseCurrencyList.find(item => item.currencyType === 1);
            const cryptoBase = baseCurrencyList.find(item => item.currencyType === 2);
            setSelectedFiatBase(fiatBase || null);
            if (cryptoBase) {
                handleWithdrawCryptoBases(cryptoBase)
            }
            if (fiatBase) {
                handleWithdrawFiatBases(fiatBase)
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
    /**
     * Method defination for handling tab selection for crypto base
     */
    const handleWithdrawCryptoBases = async (base: Base) => {
        setSelectedCryptoBase(base);
        const marketPrice = await getMarketPrice('USDB', base.baseCurrency);
        const tokens = await getTokens(base?.currencyId);
        setNetworks(Array.isArray(tokens) ? tokens : []);
        if (tokens && tokens.length > 0) {
            setSelectedNetwork(tokens[0].tokenType);
            const fees = await getFeesByCurrency(base?.currencyId, tokens[0].tokenType)
            setSelectedCryptoTier(fees || null);
        }
        setCryptoMarketPrice(marketPrice ?? 0)
        if (cryptoAmount !== '') {
            const totalPrice = parseFloat(cryptoAmount) * (marketPrice ?? 0);
            setBaseAmount(totalPrice.toFixed(6));
        }
    }
    /**
     * Method defination for handling tab selection for fiat base
     */
    const handleWithdrawFiatBases = async (base: Base) => {
        setSelectedFiatBase(base);
        const marketPrice = await getMarketPrice('USDB', base.baseCurrency);
        await getTransactionLimitByTier(base?.currencyId);
        setFiatMarketPrice(marketPrice ?? 0)
        if (fiatAmount !== '') {
            const totalPrice = parseFloat(fiatAmount) * (marketPrice ?? 0);
            setUsdbAmount(totalPrice.toFixed(4));
        }

    }

    /**
     * Method defination for closing withdraw popup
     */
    const handleWithdrawModalClose = () => setWithdrawModalOpen(false)

    /** 
     * Method defination for handing usd amount 
     * 
     */
    const handleFiatAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // ✅ Allow empty value (Backspace to clear)
        if (value === '') {
            setFiatAmount('');
            setUsdbAmount('');
            return;
        }

        // ✅ Only then clean unwanted characters
        const cleanedValue = value
            .replace(/[^0-9.]/g, '')     // allow only numbers and dot
            .replace(/(\.).*?\./g, '$1'); // ensure only one dot
        event.target.value = cleanedValue;
        setFiatAmount(cleanedValue);
        const totalPrice = parseFloat(cleanedValue) * (fiatMarketPrice ?? 0);
        setUsdbAmount(totalPrice.toFixed(4));
        const response = await getBitoDollarTxnCharge(cleanedValue, fiatMarketPrice);
        const conversionCharge = (response && response.data) as TxnChargeResponse
        //console.log('conversion charge => ', conversionCharge);
        setFiatTxnCharges(conversionCharge?.txnCharge || 0);

    }

    /**
     * Method defination for validating bitodolar amount for crypto withdraw
     * 
    */
    const handleCryptoAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        // ✅ Allow empty value (Backspace to clear)
        if (value === '') {
            setCryptoAmount('');
            setBaseAmount('');
            return;
        }

        // ✅ Only then clean unwanted characters
        const cleanedValue = value
            .replace(/[^0-9.]/g, '')     // allow only numbers and dot
            .replace(/(\.).*?\./g, '$1'); // ensure only one dot

        event.target.value = cleanedValue;
        setCryptoAmount(cleanedValue);
        const totalPrice = parseFloat(cleanedValue) * (cryptoMarketPrice);
        setBaseAmount(totalPrice.toFixed(6));
        const response = await getBitoDollarTxnCharge(cleanedValue, cryptoMarketPrice);
        const conversionCharge = (response && response.data) as TxnChargeResponse
        setCryptoTxnCharges(conversionCharge?.txnCharge || 0);
        if (selectedNetwork) {
            const fees = await getFees(cleanedValue);
            setFees(fees === undefined ? null : fees);
        }
    }

    /**
     * Method defination to get market price of bases 
     * based on user provided BitoDollar amount
      */
    const getMarketPrice = async (counter: string, base: string) => {

        try {
            const payload = { "currency": counter.toUpperCase(), "baseCurrency": base.toUpperCase(), "action": 2 }
            const response = await axios.post<MarketPriceResponse>(
                `https://accounts.paybito.com/api/home/marketPrice`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }

            );
            const error = response.data.error;
            if (error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                setCryptoAmount('');
                setBaseAmount('');
                return;
            }
            return response.data.marketPrice;
        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        }

    }

    /**
     * Method defination for geting all tokens of BitoDollar
      */
    const getTokens = async (currencyId: number) => {
        try {
            const payload = {
                adminUser: localStorage.getItem('uuid'),
                currencyId,
            }
            const response = await axios.post<TokenTypeResponse>(
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
            return response.data.response;
        } catch (error) {
            console.error('Failed to render currency by broker', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        }
    }

    /**
     * Method defination to get fiat transaction limits
     * 
     *  @param currencyId
     */
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

    /**
     * Method defination for getting fees based on amount user given
     * and token type
     * @param tokenType 
     * @param amount 
     * @returns 
     */

    const getFees = async (amount: string) => {
        if (parseFloat(amount) === 0) {
            return;
        }
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            currencyId: userBitoDollarBalance?.currencyId,
            tokenType: 'HCNET',
            amount: parseFloat(amount),
            country: brokerCountry,
        }
        try {
            const response = await axios.post<FeesResponse>(
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
                currency: userBitoDollarBalance?.currencyId.toString() || '',
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

    /**
     * Method defination for getting fees & ranges based on crypto selection
     * and token type
     * @param currencyId 
     * @param token 
     * @returns 
     */
    const getFeesByCurrency = async (currencyId: number, token: string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            currencyId,
            tokenType: token,
            country: brokerCountry
        }
        try {
            setLoading(true);
            const response = await axios.post<FeesResponse>(
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
    /**
    * Method defination for validating address
    * @param address 
    * @returns 
    */
    const checkAddress = async (address: string) => {
        const payload = {
            adminUser: localStorage.getItem('uuid'),
            currencyId: selectedCryptoBase?.currencyId,
            tokenType: selectedNetwork,
            toAddress: address,
        }
        try {
            const response = await axios.post<AddressResponse>(
                `${API_BASE_URL}/finance-hub/checkNodeAddress`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
                    }
                }
            );
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

    /** 
     * Method defination for setting & validating address
     */
    const handleWalletAddress = async (address: string) => {
        setWalletAddress(address)
        //console.log(address);
        if (address === '') {
            //console.log('blank')
            setWalletAddressValidate('blank');
            return;
        }
        const isValid = await checkAddress(address);
        setWalletAddressValidate(isValid === 1 ? 'valid' : 'invalid');
    }
    /**
     * Event defination for selection txntype filter tab
     * @param _event 
     * @param newValue 
     */
    const handleTxnTabChange = async (_event: React.SyntheticEvent, newValue: number) => {
        console.log(_event);
        console.log(newValue);
        setTxnFilterTab(newValue)
        setTxnType(newValue === 0 ? 'ALL' : newValue === 1 ? 'DEPOSIT' : newValue === 2 ? 'WITHDRAW' : newValue === 3 ? 'EARNINGS' : 'SPENDING')
        await getBitoDollarTransactions(pageNo, searchString, newValue === 0 ? 'ALL' : newValue === 1 ? 'DEPOSIT' : newValue === 2 ? 'WITHDRAW' : newValue === 3 ? 'EARNINGS' : 'SPENDING');
    }

    /**
     * Method defination for chnaging tab in withdraw popup
     * @param _event 
     * @param newValue 
     */

    const handleWithdrawTabChange = async (_event: React.SyntheticEvent, newValue: number) => {
        if (newValue === 1) {
            await getAllBases();
        }
        setWithdrawTab(newValue)
    }

    const handleNetworkChange = async (token: string) => {
        setSelectedNetwork(token)
        const fees = await getFeesByCurrency(Number(selectedCryptoBase?.currencyId), token)
        setSelectedCryptoTier(fees || null);
    }

    const selectDepositMethod = async (method: string) => {
        if (method === 'PayPal') {
            handleDepositModalClose();
            //await getTransactionLimitByTier(Number(homeCurrency?.homeCurrencyId))
            const marketPrice = await getMarketPrice('USDB', paypalPaymentSetup?.currency || 'USD');
            setFiatMarketPrice(marketPrice ?? 0);
            setPaypalModalOpen(true);
        } else {
            alert(`Redirecting to ${method} deposit page...`);
            handleDepositModalClose();
        }
    };

    /**
     * Method defination for processing fiat withdraw
     * @returns {void}
     */

    const processFiatWithdraw = async () => {
        if (!fiatAmount) {
            showSnackbar('Please enter a valid amount', 'error');
            return
        } else if (parseFloat(fiatAmount) >= (userBitoDollarBalance?.closingBalance ?? 0)) {
            showSnackbar('Insuffucient fund', 'error');
            return;
        } if (parseFloat(fiatAmount) < (selectedFiatTier?.minLimit || 0) || parseFloat(fiatAmount) > (selectedFiatTier?.dailySendLimit || 0)) {
            showSnackbar(`Amount should be within ${selectedFiatTier?.minLimit} ${selectedFiatBase?.baseCurrency} and ${selectedFiatTier?.dailySendLimit} ${selectedFiatBase?.baseCurrency}`, 'error');
            return
        }

        try {
            const conversionPayload = {
                userId: userId,
                baseCurrency: selectedFiatBase?.baseCurrency,
                currency: userBitoDollarBalance?.currencyCode,
                amount: parseFloat(fiatAmount),
                action: '2',
                adminUser: localStorage.getItem('uuid'),
                userUuid: userUuid,
            }
            setLoading(true);
            const tradeResponse = await axios.post<CurrencyConversionResponse>(
                `${API_BASE_URL}/finance-hub/currencyConversion`, conversionPayload,
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
            showSnackbar(`B$ converted to ${selectedFiatBase?.baseCurrency}. Withdraw process is getting started.`, 'success')

            try {
                const conResp = await getBitoDollarTxnCharge(fiatAmount, fiatMarketPrice);
                const conversionCharge = (conResp && conResp.data) as TxnChargeResponse
                const finalFiatAmount = parseFloat(fiatAmount) - (conversionCharge?.txnCharge || 0);
                const payload = {
                    "adminUser": localStorage.getItem('uuid'),
                    "currencyId": selectedFiatBase?.currencyId,
                    "amount": finalFiatAmount
                }

                setLoading(true)
                const response = await axios.post<FiatWithdrawResponse>(
                    `${API_BASE_URL}/finance-hub/withdraw/fiatCurrency`, payload,
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
                setFiatAmount('')
                setUsdbAmount('');
                handleWithdrawModalClose()
                showSnackbar(`Successfully initiated withdrawal of B$ ${fiatAmount} to ${selectedFiatBase?.baseCurrency}`, 'success');
                await getBitoDollarBalance(userUuid,homeCurrency?.homeCurrency || 'USD');

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

    const processCryptoWithdraw = async () => {
        if (!cryptoAmount) {
            showSnackbar('Please enter a valid amount', 'error')
            return
        } else if (!walletAddress) {
            showSnackbar('Please enter a wallet address', 'error');
            return
        } else if (parseFloat(cryptoAmount) >= (userBitoDollarBalance?.closingBalance ?? 0)) {
            showSnackbar('Insuffucient fund', 'error');
            return;
        } else if (!selectedCryptoBase) {
            showSnackbar('Need to select a Crypto first', 'error');
            return;
        } else if (parseFloat(cryptoAmount) < (selectedCryptoTier?.fromFee || 0) || parseFloat(cryptoAmount) > (selectedCryptoTier?.toFee || 0)) {
            showSnackbar(`Amount should be within ${selectedCryptoTier?.fromFee} ${selectedFiatBase?.baseCurrency} and ${selectedCryptoTier?.toFee} ${selectedFiatBase?.baseCurrency}`, 'error')
            return
        }


        try {
            setLoading(true)

            const conversionPayload = {
                userId: userId,
                baseCurrency: selectedCryptoBase?.baseCurrency,
                currency: userBitoDollarBalance?.currencyCode,
                amount: parseFloat(cryptoAmount),
                action: '2',
                adminUser: localStorage.getItem('uuid'),
                userUuid: userUuid,
            }

            const tradeResponse = await axios.post<CurrencyConversionResponse>(
                `${API_BASE_URL}/finance-hub/currencyConversion`, conversionPayload,
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
            showSnackbar(`B$ converted to ${selectedCryptoBase?.baseCurrency}. Withdraw process is getting started.`, 'success')
            try {
                const conResp = await getBitoDollarTxnCharge(fiatAmount, fiatMarketPrice);
                const conversionCharge = (conResp && conResp.data) as TxnChargeResponse
                const finalBaseAmount = parseFloat(baseAmount) - (conversionCharge?.txnCharge || 0);
                const payload = {
                    adminUser: localStorage.getItem('uuid'),
                    userUuid: userUuid,
                    currencyId: selectedCryptoBase?.currencyId,
                    currency: selectedCryptoBase?.baseCurrency,
                    tokenType: selectedNetwork,
                    amount: finalBaseAmount,
                    toAddress: walletAddress,
                    memo: ''
                }
                setLoading(true);
                const response = await axios.post<SendToOtherResposne>(
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
                setCryptoAmount('');
                setBaseAmount('');
                setWalletAddress('')
                handleWithdrawModalClose()
                showSnackbar(`Successfully initiated withdrawal of B$ ${cryptoAmount} to ${selectedCryptoBase?.baseCurrency}`, 'success')
                await getBitoDollarBalance(userUuid, homeCurrency?.homeCurrency || 'USD');
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

    /**
     * Method defination for converting to B$
     * @param currencyId
     * @param amount
     * @param currencyType
     * @returns {void}
     */
    const convertToBitoDollar = async (currencyId: string, amount: string, currencyType: string) => {
        const payload = {
            "adminUser": localStorage.getItem('uuid'),
            "currencyId": currencyId,
            "amount": amount,
            "walletTag": 'EXCHANGE'
        }
        try {
            setLoading(true);
            const response = await axios.post<BitoDollarConversionResponse>(
                `${API_BASE_URL}/finance-hub/convert/cryptoToBitodollar`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );
            return response.data.success;
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

    const exportTransactions = () => {
        if (transactions.length === 0) {
            showSnackbar('No transactions has been done yet', 'error');
            return;
        }
        const csvContent =
            'data:text/csv;charset=utf-8,' +
            'Date,Type,Description,Amount,Status,Transaction ID\n' +
            transactions
                .map(
                    (tx) =>
                        `${tx.transactionTimestamp},${tx.action},"${tx.description}",${tx.creditAmount > 0 ? tx.creditAmount : tx.debitAmount},${tx.status},${tx.transactionId}`
                )
                .join('\n')

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', 'bitoconnect_transactions.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Helper function to show snackbar
    const showSnackbar = async (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = async () => {
        setSnackbarOpen(false);
    };

    /**
 * Method definition for handling PayPal amount input
 */
    const handlePaypalAmount = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        if (value === '') {
            setPaypalAmount('');
            return;
        }

        const cleanedValue = value
            .replace(/[^0-9.]/g, '')
            .replace(/(\.).*?\./g, '$1');

        event.target.value = cleanedValue;
        setPaypalAmount(cleanedValue);
    };

    /**
     * Method definition for handling PayPal payment success
     */
    const handlePayPalSuccess = async (details: PayPalSuccess) => {
        console.log('Payment successful:', JSON.stringify(details));

        // Extract amount from the capture
        const capturedAmount = details.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
        const capturedCurrency = details.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code;
        const amount = capturedAmount ? parseFloat(capturedAmount) : parseFloat(paypalAmount);


        try {
            setLoading(true);
            const payload = {
                "amount": amount,
                "adminUserId": localStorage.getItem('uuid'),
                "currency_code": capturedCurrency,
                "orderId": details.id
            }
            const response = await axios.post<BitoDollarPayPalDepositResponse>(
                `${API_BASE_URL}/paypal/create-order`, payload,
                {
                    headers: {
                        //authorization: `bearer ${localStorage.getItem('access_token_us')}`
                    }
                }
            );

            if (!response.data.status) {
                showSnackbar(response.data.message, 'error');
                return;
            }
            showSnackbar(
                `Successfully initiated the deposit of B$ ${amount.toFixed(2)} via PayPal!`,
                'success'
            );
            setPaypalModalOpen(false);
            setPaypalAmount('');

            // Refresh balance
            await getBitoDollarBalance(userUuid, homeCurrency?.homeCurrency || 'USD');

        } catch (error) {
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
        }


    };

    /**
     * Method definition for handling PayPal payment error
     */
    const handlePayPalError = (error: Error | PayPalError) => {
        // Ignore "window closed" - this is normal when user closes popup
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('Window closed') || errorMessage.includes('closed before')) {
            console.log('User closed PayPal popup');
            return; // Don't show error for this
        }

        console.error('PayPal error:', error);
        showSnackbar('Payment failed. Please try again.', 'error');
    };

    return (
        <Fragment>
            <Box
                sx={{
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    py: { xs: 4, md: 6 },
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                    {/* Wallet Header */}
                    <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
                        <Typography
                            variant={isMobile ? 'h3' : 'h2'}
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1,
                            }}
                        >
                            BitoDollars Wallet
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your BitoDollars balance and transactions
                        </Typography>
                    </Box>

                    {/* Balance Card */}
                    <Card
                        sx={{
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(
                                theme.palette.secondary.main,
                                0.1
                            )})`,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            borderRadius: 3,
                            mb: 4,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: '-50%',
                                right: '-10%',
                                width: 300,
                                height: 300,
                                background: `radial-gradient(circle, ${alpha(
                                    theme.palette.primary.main,
                                    0.2
                                )}, transparent)`,
                                borderRadius: '50%',
                            },
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, md: 5 }, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1,
                                        mr: 2,
                                    }}
                                >
                                    Total Balance
                                </Typography>
                                <Chip
                                    icon={
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                bgcolor: 'success.main',
                                                borderRadius: '50%',
                                                animation: 'pulse 2s infinite',
                                                '@keyframes pulse': {
                                                    '0%, 100%': { opacity: 1 },
                                                    '50%': { opacity: 0.5 },
                                                },
                                            }}
                                        />
                                    }
                                    label="Network Active"
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(theme.palette.success.main, 0.1),
                                        border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                        color: 'success.main',
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1, flexWrap: 'wrap' }}>
                                <Typography
                                    variant={isMobile ? 'h3' : 'h2'}
                                    sx={{ fontWeight: 700, color: 'primary.main', mr: 2 }}
                                >
                                    B$
                                </Typography>
                                <Typography variant={isMobile ? 'h3' : 'h2'} sx={{ fontWeight: 700 }}>
                                    {userBitoDollarBalance ? userBitoDollarBalance.closingBalance.toFixed(3) : '0.000'}
                                </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                ≈ {balanceInHomeCurrency ? balanceInHomeCurrency : 0.00} {homeCurrency?.homeCurrency || 'USD'}
                            </Typography>

                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    flexDirection: { xs: 'column', sm: 'row' },
                                }}
                            >
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<Add />}
                                    onClick={handleDepositModalOpen}
                                    sx={{
                                        flex: 1,
                                        py: 2,
                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5568d3, #653a8b)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    Deposit B$
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={<Remove />}
                                    onClick={handleWithdrawModalOpen}
                                    sx={{
                                        flex: 1,
                                        py: 2,
                                        borderWidth: 2,
                                        '&:hover': {
                                            borderWidth: 2,
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        },
                                    }}
                                >
                                    Withdraw B$
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Transaction History */}
                    <Card
                        sx={{
                            borderRadius: 3,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                            {/* Header with Search and Export */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 3,
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                }}
                            >
                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                    Transaction History
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                                    <TextField
                                        size="small"
                                        defaultValue={searchString}
                                        onChange={(e) => setSearchString(e.target.value)}
                                        placeholder="Search transactions..."
                                        sx={{
                                            minWidth: { xs: '100%', sm: 250 },
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: theme.palette.mode === 'dark' ? '#0f0f11' : '#f5f5f5',
                                                '& fieldset': {
                                                    borderColor: 'transparent',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                                },
                                            },
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        startIcon={<Download />}
                                        onClick={exportTransactions}
                                        sx={{
                                            whiteSpace: 'nowrap',
                                            borderColor: theme.palette.mode === 'dark' ? '#667eea' : 'primary.main',
                                            color: theme.palette.mode === 'dark' ? '#667eea' : 'primary.main',
                                        }}
                                    >
                                        Export CSV
                                    </Button>
                                </Box>
                            </Box>

                            {/* Filter Tabs */}
                            <Box
                                sx={{
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    mb: 3,
                                }}
                            >
                                <Tabs
                                    value={txnFilterTab}
                                    onChange={handleTxnTabChange}
                                    sx={{
                                        minHeight: 40,
                                        '& .MuiTab-root': {
                                            minHeight: 40,
                                            textTransform: 'none',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: 'text.secondary',
                                            '&.Mui-selected': {
                                                color: theme.palette.mode === 'dark' ? '#667eea' : 'primary.main',
                                            },
                                        },
                                        '& .MuiTabs-indicator': {
                                            backgroundColor: theme.palette.mode === 'dark' ? '#667eea' : 'primary.main',
                                        },
                                    }}
                                >
                                    <Tab label="All" />
                                    <Tab label="Deposits" />
                                    <Tab label="Withdrawals" />
                                    <Tab label="Earnings" />
                                    <Tab label="Spending" />
                                </Tabs>
                            </Box>

                            {/* Transaction Table */}
                            {transactions.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <Typography color="text.secondary">No transactions yet</Typography>
                                </Box>
                            ) : (
                                <TableContainer
                                    sx={{
                                        '& .MuiTable-root': {
                                            minWidth: isMobile ? 'auto' : 650,
                                        },
                                    }}
                                >
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        borderBottom: `1px solid ${alpha(
                                                            theme.palette.text.primary,
                                                            0.08
                                                        )}`,
                                                        bgcolor: 'transparent',
                                                    }}
                                                >
                                                    Date/Time
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        borderBottom: `1px solid ${alpha(
                                                            theme.palette.text.primary,
                                                            0.08
                                                        )}`,
                                                        bgcolor: 'transparent',
                                                    }}
                                                >
                                                    Type
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        borderBottom: `1px solid ${alpha(
                                                            theme.palette.text.primary,
                                                            0.08
                                                        )}`,
                                                        bgcolor: 'transparent',
                                                    }}
                                                >
                                                    Description
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        borderBottom: `1px solid ${alpha(
                                                            theme.palette.text.primary,
                                                            0.08
                                                        )}`,
                                                        bgcolor: 'transparent',
                                                    }}
                                                >
                                                    Amount
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        borderBottom: `1px solid ${alpha(
                                                            theme.palette.text.primary,
                                                            0.08
                                                        )}`,
                                                        bgcolor: 'transparent',
                                                    }}
                                                >
                                                    Status
                                                </TableCell>
                                                {!isMobile && (
                                                    <TableCell
                                                        sx={{
                                                            color: 'text.secondary',
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            borderBottom: `1px solid ${alpha(
                                                                theme.palette.text.primary,
                                                                0.08
                                                            )}`,
                                                            bgcolor: 'transparent',
                                                        }}
                                                    >
                                                        Transaction ID
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transactions.map((tx, index) => (
                                                <TableRow
                                                    key={index}
                                                    sx={{
                                                        '&:last-child td': { borderBottom: 0 },
                                                        '&:hover': {
                                                            bgcolor:
                                                                theme.palette.mode === 'dark'
                                                                    ? alpha(theme.palette.primary.main, 0.05)
                                                                    : alpha(theme.palette.primary.main, 0.02),
                                                        },
                                                    }}
                                                >
                                                    <TableCell
                                                        sx={{
                                                            borderBottom: `1px solid ${alpha(
                                                                theme.palette.text.primary,
                                                                0.08
                                                            )}`,
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Typography variant="body2">
                                                            {isMobile
                                                                ? new Date(tx.transactionTimestamp).toLocaleDateString()
                                                                : tx.transactionTimestamp}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            borderBottom: `1px solid ${alpha(
                                                                theme.palette.text.primary,
                                                                0.08
                                                            )}`,
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Typography variant="body2">{tx.action}</Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            borderBottom: `1px solid ${alpha(
                                                                theme.palette.text.primary,
                                                                0.08
                                                            )}`,
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Typography variant="body2">{tx.description}</Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            borderBottom: `1px solid ${alpha(
                                                                theme.palette.text.primary,
                                                                0.08
                                                            )}`,
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            B$ {Math.abs(tx.creditAmount > 0 ? tx.creditAmount : tx.debitAmount).toFixed(4)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            borderBottom: `1px solid ${alpha(
                                                                theme.palette.text.primary,
                                                                0.08
                                                            )}`,
                                                            py: 2,
                                                        }}
                                                    >
                                                        <Chip
                                                            label={tx.status === '0' ? 'Pending' : tx.status === '1' ? 'Confirmed' : 'Declined'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor:
                                                                    tx.status === '1'
                                                                        ? alpha('#10b981', 0.15)
                                                                        : tx.status === 'Pending'
                                                                            ? alpha('#f59e0b', 0.15)
                                                                            : alpha('#ef4444', 0.15),
                                                                color:
                                                                    tx.status === '1'
                                                                        ? '#10b981'
                                                                        : tx.status === '0'
                                                                            ? '#f59e0b'
                                                                            : '#ef4444',
                                                                border:
                                                                    tx.status === '1'
                                                                        ? `1px solid ${alpha('#10b981', 0.3)}`
                                                                        : tx.status === 'Pending'
                                                                            ? `1px solid ${alpha('#f59e0b', 0.3)}`
                                                                            : `1px solid ${alpha('#ef4444', 0.3)}`,
                                                                fontWeight: 500,
                                                                fontSize: '0.75rem',
                                                            }}
                                                        />
                                                    </TableCell>
                                                    {!isMobile && (
                                                        <TableCell
                                                            sx={{
                                                                borderBottom: `1px solid ${alpha(
                                                                    theme.palette.text.primary,
                                                                    0.08
                                                                )}`,
                                                                py: 2,
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: '#667eea',
                                                                    cursor: 'pointer',
                                                                    '&:hover': { textDecoration: 'underline' },
                                                                }}

                                                            >
                                                                {tx.transactionId}
                                                            </Typography>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                            {/* Pagination */}
                            {transactions.length > 0 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        mt: 4,
                                        pt: 3,
                                        borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                                    }}
                                >
                                    <Stack spacing={2} alignItems="center">
                                        <Pagination
                                            count={Math.ceil(totalCount / noOfItemsPerPage)}
                                            page={pageNo}
                                            onChange={handlePageChange}
                                            color="primary"
                                            size={isMobile ? 'small' : 'medium'}
                                            showFirstButton
                                            showLastButton
                                            sx={{
                                                '& .MuiPaginationItem-root': {
                                                    fontWeight: 500,
                                                    borderRadius: 2,
                                                    '&.Mui-selected': {
                                                        backgroundColor: theme.palette.mode === 'dark' ? '#667eea' : 'primary.main',
                                                        color: '#fff',
                                                        '&:hover': {
                                                            backgroundColor: theme.palette.mode === 'dark' ? '#5568d3' : 'primary.dark',
                                                        },
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                    },
                                                },
                                            }}
                                        />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                        >
                                            Showing {((pageNo - 1) * noOfItemsPerPage) + 1} to{' '}
                                            {Math.min(pageNo * noOfItemsPerPage, totalCount)} of {totalCount} transactions
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Deposit Modal */}
                    <Dialog
                        open={depositModalOpen}
                        onClose={handleDepositModalClose}
                        maxWidth="md"
                        fullWidth
                        fullScreen={isMobile}
                        PaperProps={{
                            sx: {
                                bgcolor: theme.palette.mode === 'dark' ? '#1a1a1d' : 'background.paper',
                                borderRadius: isMobile ? 0 : 3,
                            },
                        }}
                    >
                        <DialogTitle sx={{ pb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                    Deposit BitoDollars
                                </Typography>
                                <IconButton
                                    onClick={handleDepositModalClose}
                                    sx={{
                                        color: 'text.primary',
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        },
                                    }}
                                >
                                    <Close />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 2, pb: 4 }}>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                    gap: 3,
                                }}
                            >
                                {/* Crypto Wallet */}
                                <Box
                                    onClick={() => handleRedirection('internal', '/finance-hub/buy-and-swap-crypto')}
                                    sx={{
                                        bgcolor: theme.palette.mode === 'dark' ? '#0f0f11' : '#f5f5f5',
                                        borderRadius: 3,
                                        p: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            bgcolor: '#667eea',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <AccountBalanceWallet sx={{ fontSize: 28, color: '#fff' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        Crypto Wallet
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Convert any cryptocurrency to B$ instantly
                                    </Typography>
                                </Box>

                                {/* Store Wallet */}
                                <Box
                                    onClick={() => handleRedirection('internal', '/finance-hub/payments')}
                                    sx={{
                                        bgcolor: theme.palette.mode === 'dark' ? '#0f0f11' : '#f5f5f5',
                                        borderRadius: 3,
                                        p: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            bgcolor: '#667eea',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <Box
                                            component="span"
                                            sx={{ fontSize: 28, color: '#fff', fontWeight: 600 }}
                                        >
                                            🏪
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        Store Wallet
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Transfer from Store Wallet balance to B$
                                    </Typography>
                                </Box>

                                {/* Business Settlement */}
                                <Box
                                    onClick={() => handleRedirection('external', 'https://launch-platform.paybito.com/my-settlement')}
                                    sx={{
                                        bgcolor: theme.palette.mode === 'dark' ? '#0f0f11' : '#f5f5f5',
                                        borderRadius: 3,
                                        p: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            bgcolor: '#667eea',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <Box
                                            component="span"
                                            sx={{ fontSize: 28, color: '#fff', fontWeight: 600 }}
                                        >
                                            💼
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        Business Settlement
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Transfer settlement funds to B$
                                    </Typography>
                                </Box>

                                {/* PayPal */}
                                <Box
                                    onClick={() => selectDepositMethod('PayPal')}
                                    sx={{
                                        bgcolor: theme.palette.mode === 'dark' ? '#0f0f11' : '#f5f5f5',
                                        borderRadius: 3,
                                        p: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            bgcolor: '#667eea',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2,
                                        }}
                                    >
                                        <AttachMoney sx={{ fontSize: 28, color: '#fff' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        PayPal
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Purchase B$ using PayPal
                                    </Typography>
                                </Box>
                            </Box>
                        </DialogContent>
                    </Dialog>

                    {/* PayPal Deposit Modal */}
                    <Dialog
                        open={paypalModalOpen}
                        onClose={() => {
                            // Don't close if payment is in progress
                            if (!loading) {
                                setPaypalModalOpen(false);
                                setPaypalAmount('');
                            }
                        }}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: 3,
                                boxShadow:
                                    theme.palette.mode === 'light'
                                        ? '0 8px 32px rgba(0, 0, 0, 0.08)'
                                        : '0 8px 32px rgba(0, 0, 0, 0.4)',
                            },
                        }}
                    >
                        <DialogTitle sx={{ pb: 1 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <AttachMoney color="primary" />
                                    <Typography variant="h6" fontWeight={600}>
                                        Purchase BitoDollars with PayPal
                                    </Typography>
                                </Box>
                                <IconButton
                                    onClick={() => {
                                        setPaypalModalOpen(false);
                                        setPaypalAmount('');
                                    }}
                                    size="small"
                                    sx={{
                                        color: 'text.secondary',
                                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) },
                                    }}
                                >
                                    <Close />
                                </IconButton>
                            </Box>
                        </DialogTitle>

                        <DialogContent sx={{ pt: 2 }}>
                            <Alert
                                severity="info"
                                sx={{
                                    mb: 3,
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.info.main, 0.2),
                                }}
                            >
                                1 {paypalPaymentSetup?.currency} = {fiatMarketPrice} BitoDollar (B$)
                            </Alert>

                            <TextField
                                fullWidth
                                label={`Amount (${paypalPaymentSetup?.currency})`}
                                type="text"
                                value={paypalAmount}
                                onChange={handlePaypalAmount}
                                placeholder={`Enter amount in ${paypalPaymentSetup?.currency}`}
                                InputProps={{
                                    startAdornment: (
                                        <Typography color="text.secondary" mr={1}>

                                        </Typography>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                                helperText={
                                    paypalAmount
                                        ? `You will receive B$ ${parseFloat(paypalAmount).toFixed(2)}`
                                        : `Minimum: ${paypalPaymentSetup?.minAmount || 0} ${paypalPaymentSetup?.currency}`
                                }
                            />

                            <Box
                                sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    borderRadius: 2,
                                    p: 2,
                                    mb: 3,
                                }}
                            >
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Purchase Summary
                                </Typography>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2">Amount:</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {paypalAmount || '0.00'} {paypalPaymentSetup?.currency}
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2">Processing Fee:</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        0.00 { paypalPaymentSetup?.currency}
                                    </Typography>
                                </Box>
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    pt={1}
                                    borderTop={`1px solid ${alpha(theme.palette.divider, 0.1)}`}
                                >
                                    <Typography variant="body1" fontWeight={600}>
                                        You will receive:
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600} color="primary.main">
                                        B$ {paypalAmount || '0.00'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Show warning if amount is invalid */}
                            {paypalAmount && (parseFloat(paypalAmount) < (paypalPaymentSetup?.maxAmount || 0) || parseFloat(paypalAmount) > (paypalPaymentSetup?.minAmount || 0)) && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    Amount must be between {paypalPaymentSetup?.minAmount || 0} and {paypalPaymentSetup?.maxAmount || 0} {paypalPaymentSetup?.currency}
                                </Alert>
                            )}

                            {/* ALWAYS render PayPalCheckoutButton - just disable it when invalid */}
                            <PayPalCheckoutButton
                                amount={parseFloat(paypalAmount) || 0}
                                currency={paypalPaymentSetup?.currency || 'USD'}
                                clientId={PAYPAL_CLIENT_ID}
                                description={`BitoDollar deposit`}
                                onSuccess={handlePayPalSuccess}
                                onError={handlePayPalError}
                                onCancel={() => showSnackbar('Payment cancelled', 'error')}
                                disabled={
                                    !paypalAmount ||
                                    parseFloat(paypalAmount) < (paypalPaymentSetup?.minAmount || 0) ||
                                    parseFloat(paypalAmount) > (paypalPaymentSetup?.maxAmount || 0)
                                }
                            />
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Amount must be between {paypalPaymentSetup?.minAmount || 0} and {paypalPaymentSetup?.maxAmount || 0} {paypalPaymentSetup?.currency}
                            </Alert>
                        </DialogContent>
                    </Dialog>

                    {/* Withdraw Modal */}
                    <Dialog
                        open={withdrawModalOpen}
                        onClose={handleWithdrawModalClose}
                        maxWidth="sm"
                        fullWidth
                        fullScreen={isMobile}
                    >
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                    Withdraw BitoDollars
                                </Typography>
                                <IconButton onClick={handleWithdrawModalClose}>
                                    <Close />
                                </IconButton>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Tabs value={withdrawTab} onChange={handleWithdrawTabChange} sx={{ mb: 3 }}>
                                <Tab label="Convert to Fiat" />
                                <Tab label="Crypto Withdrawal" />
                            </Tabs>

                            <TabPanel value={withdrawTab} index={0}>
                                {!kycApproved || !bankConnected ? (
                                    <Box
                                        sx={{
                                            backgroundColor: 'background.paper',
                                            borderRadius: 3,
                                            p: { xs: 2, sm: 3, md: 4 },
                                            boxShadow: (theme) => theme.palette.mode === 'light'
                                                ? '0 8px 32px rgba(0, 0, 0, 0.08)'
                                                : '0 8px 32px rgba(0, 0, 0, 0.4)',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        {/* Header Alert */}
                                        <Alert
                                            severity="info"
                                            icon={false}
                                            sx={{
                                                mb: { xs: 2, sm: 3 },
                                                borderRadius: 2,
                                                backgroundColor: (theme) =>
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(30, 64, 175, 0.08)'
                                                        : 'rgba(66, 165, 245, 0.08)',
                                                border: '1px solid',
                                                borderColor: (theme) =>
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(30, 64, 175, 0.2)'
                                                        : 'rgba(66, 165, 245, 0.2)',
                                                '& .MuiAlert-message': {
                                                    fontWeight: 500,
                                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                                }
                                            }}
                                        >
                                            Complete the following requirements to withdraw
                                        </Alert>

                                        {/* Requirements Cards */}
                                        <Stack spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: { xs: 3, sm: 4 } }}>
                                            {/* KYC Status Card */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: { xs: 2, sm: 2.5 },
                                                    borderRadius: 2,
                                                    backgroundColor: (theme) =>
                                                        kycApproved
                                                            ? theme.palette.mode === 'light'
                                                                ? 'rgba(76, 175, 80, 0.08)'
                                                                : 'rgba(76, 175, 80, 0.12)'
                                                            : theme.palette.mode === 'light'
                                                                ? 'rgba(0, 0, 0, 0.04)'
                                                                : 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid',
                                                    borderColor: (theme) =>
                                                        kycApproved
                                                            ? theme.palette.mode === 'light'
                                                                ? 'rgba(76, 175, 80, 0.3)'
                                                                : 'rgba(76, 175, 80, 0.4)'
                                                            : 'divider',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: (theme) =>
                                                            theme.palette.mode === 'light'
                                                                ? '0 4px 12px rgba(0, 0, 0, 0.08)'
                                                                : '0 4px 12px rgba(0, 0, 0, 0.3)',
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: { xs: 40, sm: 48 },
                                                            height: { xs: 40, sm: 48 },
                                                            borderRadius: '50%',
                                                            backgroundColor: (theme) =>
                                                                kycApproved
                                                                    ? theme.palette.mode === 'light'
                                                                        ? 'rgba(76, 175, 80, 0.15)'
                                                                        : 'rgba(76, 175, 80, 0.2)'
                                                                    : theme.palette.mode === 'light'
                                                                        ? 'rgba(0, 0, 0, 0.08)'
                                                                        : 'rgba(255, 255, 255, 0.08)',
                                                        }}
                                                    >
                                                        {kycApproved ? (
                                                            <CheckCircle sx={{ color: 'success.main', fontSize: { xs: 24, sm: 28 } }} />
                                                        ) : (
                                                            <Cancel sx={{ color: 'text.secondary', fontSize: { xs: 24, sm: 28 } }} />
                                                        )}
                                                    </Box>
                                                    <Box>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                                                                mb: 0.5,
                                                                color: 'text.primary'
                                                            }}
                                                        >
                                                            KYC Verification
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: 'text.secondary',
                                                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                                            }}
                                                        >
                                                            {kycApproved ? 'Verified and approved' : 'Required for withdrawal'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Chip
                                                    label={kycApproved ? 'Completed' : 'Required'}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 600,
                                                        backgroundColor: kycApproved ? 'success.main' : 'action.disabledBackground',
                                                        color: kycApproved ? 'white' : 'text.primary',
                                                        display: { xs: 'none', sm: 'flex' }
                                                    }}
                                                />
                                            </Box>

                                            {/* Bank Account Status Card */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    p: { xs: 2, sm: 2.5 },
                                                    borderRadius: 2,
                                                    backgroundColor: (theme) =>
                                                        bankConnected
                                                            ? theme.palette.mode === 'light'
                                                                ? 'rgba(76, 175, 80, 0.08)'
                                                                : 'rgba(76, 175, 80, 0.12)'
                                                            : theme.palette.mode === 'light'
                                                                ? 'rgba(0, 0, 0, 0.04)'
                                                                : 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid',
                                                    borderColor: (theme) =>
                                                        bankConnected
                                                            ? theme.palette.mode === 'light'
                                                                ? 'rgba(76, 175, 80, 0.3)'
                                                                : 'rgba(76, 175, 80, 0.4)'
                                                            : 'divider',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: (theme) =>
                                                            theme.palette.mode === 'light'
                                                                ? '0 4px 12px rgba(0, 0, 0, 0.08)'
                                                                : '0 4px 12px rgba(0, 0, 0, 0.3)',
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: { xs: 40, sm: 48 },
                                                            height: { xs: 40, sm: 48 },
                                                            borderRadius: '50%',
                                                            backgroundColor: (theme) =>
                                                                bankConnected
                                                                    ? theme.palette.mode === 'light'
                                                                        ? 'rgba(76, 175, 80, 0.15)'
                                                                        : 'rgba(76, 175, 80, 0.2)'
                                                                    : theme.palette.mode === 'light'
                                                                        ? 'rgba(0, 0, 0, 0.08)'
                                                                        : 'rgba(255, 255, 255, 0.08)',
                                                        }}
                                                    >
                                                        {bankConnected ? (
                                                            <CheckCircle sx={{ color: 'success.main', fontSize: { xs: 24, sm: 28 } }} />
                                                        ) : (
                                                            <Cancel sx={{ color: 'text.secondary', fontSize: { xs: 24, sm: 28 } }} />
                                                        )}
                                                    </Box>
                                                    <Box>
                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                                                                mb: 0.5,
                                                                color: 'text.primary'
                                                            }}
                                                        >
                                                            Bank Account
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: 'text.secondary',
                                                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                                            }}
                                                        >
                                                            {bankConnected ? 'Successfully linked' : 'Link your account'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Chip
                                                    label={bankConnected ? 'Completed' : 'Required'}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 600,
                                                        backgroundColor: bankConnected ? 'success.main' : 'action.disabledBackground',
                                                        color: bankConnected ? 'white' : 'text.primary',
                                                        display: { xs: 'none', sm: 'flex' }
                                                    }}
                                                />
                                            </Box>
                                        </Stack>

                                        {/* Action Button */}
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            onClick={() => {
                                                if (!kycApproved) {
                                                    router.push(`/kyc`);
                                                } else {
                                                    const path = '/bitodollar-wallet'
                                                    const encodedPath = encodeURIComponent(path)
                                                    console.log(encodedPath)
                                                    router.push(`/bank-details?continue=${encodedPath}`);
                                                }
                                            }}
                                            sx={{
                                                py: { xs: 1.5, sm: 2 },
                                                borderRadius: 2,
                                                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: (theme) =>
                                                        theme.palette.mode === 'light'
                                                            ? '0 6px 20px rgba(30, 64, 175, 0.3)'
                                                            : '0 6px 20px rgba(66, 165, 245, 0.4)',
                                                },
                                                '&:active': {
                                                    transform: 'translateY(0)',
                                                }
                                            }}
                                        >
                                            {!kycApproved ? 'Complete KYC Verification' : 'Link Bank Account'}
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box>
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
                                                {userBitoDollarBalance?.closingBalance || 0}   {userBitoDollarBalance?.currencyCode}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="body2" sx={{ mb: 2 }}>
                                                Select Fiat
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {bases
                                                    .filter(base => base.currencyType === 1)
                                                    .map((base, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={base.baseCurrency}
                                                            onClick={() => handleWithdrawFiatBases(base)}
                                                            color={selectedFiatBase?.baseCurrency === base.baseCurrency ? 'primary' : 'default'}
                                                            variant={selectedFiatBase?.baseCurrency === base.baseCurrency ? 'filled' : 'outlined'}
                                                        />
                                                    ))}
                                            </Box>
                                        </Box>
                                        <TextField
                                            fullWidth
                                            label={`Amount (${selectedFiatBase?.baseCurrency})`}
                                            type="number"
                                            value={fiatAmount}
                                            onChange={(e) => handleFiatAmount(e as React.ChangeEvent<HTMLInputElement>)}
                                            placeholder="0.00"
                                            sx={{ mb: 2 }}
                                        />
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 1.5,
                                                p: 2,
                                                mb: 3,
                                                borderRadius: 2,
                                                background: (theme) =>
                                                    theme.palette.mode === 'dark'
                                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                                        : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.04) 100%)',
                                                border: (theme) =>
                                                    `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                                backdropFilter: 'blur(10px)',
                                            }}
                                        >
                                            {/* B$ Amount Row */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    gap: 1,
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: (theme) =>
                                                                theme.palette.mode === 'dark'
                                                                    ? 'rgba(255,255,255,0.6)'
                                                                    : 'rgba(0,0,0,0.6)',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        B$ Amount
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: (theme) =>
                                                            theme.palette.mode === 'dark'
                                                                ? 'rgba(255,255,255,0.9)'
                                                                : 'rgba(0,0,0,0.87)',
                                                    }}
                                                >
                                                    {usdbAmount || 0} {userBitoDollarBalance?.currencyCode}
                                                </Typography>
                                            </Box>

                                            {/* Divider */}
                                            <Box
                                                sx={{
                                                    height: '1px',
                                                    background: (theme) =>
                                                        theme.palette.mode === 'dark'
                                                            ? 'rgba(255,255,255,0.06)'
                                                            : 'rgba(0,0,0,0.06)',
                                                }}
                                            />

                                            {/* Transaction Charges Row */}
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    gap: 1,
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                                                        }}
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: (theme) =>
                                                                theme.palette.mode === 'dark'
                                                                    ? 'rgba(255,255,255,0.6)'
                                                                    : 'rgba(0,0,0,0.6)',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        Transaction Charges
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: (theme) =>
                                                            theme.palette.mode === 'dark'
                                                                ? 'rgba(255,255,255,0.9)'
                                                                : 'rgba(0,0,0,0.87)',
                                                    }}
                                                >
                                                    {fiatTxnCharges || 0} {selectedFiatBase?.baseCurrency}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {/* range */}
                                        <Box>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Range:
                                                </Typography>
                                                <Chip
                                                    label={`${selectedFiatTier?.minLimit || 0} ${selectedFiatBase?.baseCurrency}`}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    to
                                                </Typography>
                                                <Chip
                                                    label={`${selectedFiatTier?.dailySendLimit || 0} ${selectedFiatBase?.baseCurrency}`}
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                />
                                            </Box>

                                        </Box>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={processFiatWithdraw}
                                            disabled={!fiatAmount}
                                        >
                                            Convert to {selectedFiatBase?.baseCurrency}
                                        </Button>
                                    </Box>
                                )}
                            </TabPanel>

                            <TabPanel value={withdrawTab} index={1}>
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
                                        {userBitoDollarBalance?.closingBalance || 0}   {userBitoDollarBalance?.currencyCode}
                                    </Typography>
                                </Box>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        Select Cryptocurrency
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {bases
                                            .filter(base => base.currencyType === 2)
                                            .map((base, index) => (
                                                <Chip
                                                    key={index}
                                                    label={base.baseCurrency}
                                                    onClick={() => handleWithdrawCryptoBases(base)}
                                                    color={selectedCryptoBase?.baseCurrency === base.baseCurrency ? 'primary' : 'default'}
                                                    variant={selectedCryptoBase?.baseCurrency === base.baseCurrency ? 'filled' : 'outlined'}
                                                />
                                            ))}
                                    </Box>
                                </Box>

                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Network</InputLabel>
                                    <Select value={selectedNetwork ?? ''} label="Network" onChange={(e) => handleNetworkChange(e.target.value as string)}>
                                        {networks.map((network) => (
                                            <MenuItem key={network.tokenType} value={network.tokenType}>
                                                {network.tokenType}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Amount (BitoDollars)"
                                    type="number"
                                    value={cryptoAmount}
                                    onChange={(e) => handleCryptoAmount(e as React.ChangeEvent<HTMLInputElement>)}
                                    placeholder="0.00"
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    label={`Amount (${selectedCryptoBase?.baseCurrency})`}
                                    type="number"
                                    value={baseAmount}
                                    disabled
                                    placeholder="0.00"
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    fullWidth
                                    label="Wallet Address"
                                    value={walletAddress}
                                    onChange={(e) => handleWalletAddress(e.target.value)}
                                    placeholder="0x..."
                                    sx={{ mb: 2 }}
                                />
                                {walletAddressValidate !== 'blank' && <Typography variant="h6" sx={{ mt: '2px', mb: '2px', fontWeight: 300, textAlign: 'center', color: walletAddressValidate === 'valid' ? 'green' : 'red' }}>
                                    {walletAddressValidate === 'valid' ? `Address is valid` : `Address not valid`}
                                </Typography>}

                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        mb: 3,
                                        p: 2,
                                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography variant="body2">Network Fee:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {(typeof fees === 'object' && fees !== null && 'totalFees' in fees) ? (fees as Fees).totalFees : 0}
                                    </Typography>
                                    <Typography variant="body2">Transaction Fee:</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {cryptoTxnCharges} {selectedCryptoBase?.baseCurrency}
                                    </Typography>
                                </Box>
                                {/* range */}
                                <Box>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Range:
                                        </Typography>
                                        <Chip
                                            label={`${selectedCryptoTier?.fromFee || 0} ${selectedCryptoBase?.baseCurrency}`}
                                            size="small"
                                            color="success"
                                            variant="outlined"
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            to
                                        </Typography>
                                        <Chip
                                            label={`${selectedCryptoTier?.toFee || 0} ${selectedCryptoBase?.baseCurrency}`}
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                        />
                                    </Box>

                                </Box>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={processCryptoWithdraw}
                                    disabled={!cryptoAmount || !walletAddress || walletAddressValidate === 'invalid'}
                                >
                                    Withdraw
                                </Button>
                            </TabPanel>
                        </DialogContent>
                    </Dialog>
                </Box>
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
    )
}

export default BitoDollarContent