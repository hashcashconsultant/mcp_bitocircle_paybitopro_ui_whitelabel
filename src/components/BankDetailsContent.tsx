'use client'

import React, { useState, useEffect, useMemo, Fragment, JSX } from 'react'
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Card,
    Alert,
    CircularProgress,
    MenuItem,
    FormControl,
    Select,
    useTheme,
    useMediaQuery,
    alpha,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    Snackbar,
    Backdrop,
    Divider,
    createTheme
} from '@mui/material'
import {
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
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
    History as HistoryIcon,
    KeyboardArrowDown as ArrowDownIcon,
    KeyboardArrowUp as ArrowUpIcon,
    Launch as LaunchIcon,
    Schedule as ScheduleIcon,
    FilterList as FilterIcon,
    Warning as WarningIcon
} from '@mui/icons-material'
import axios from 'axios';
import { getBitoHubUserInfo, getUserBankDetails, getUserKycDetails } from '../services/CoreDataService';

const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';

// Interfaces
export interface BankDetailsResult {
    bank_details_id: number;
    user_id: number;
    uuid: string | null;
    beneficiary_name: string;
    benificiary_name?: string;
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
    bankVerificationDocType?: string;
    bankDocType?: string;
}

export interface BankDetailsError {
    error_data: number;
    error_msg: string;
}

export interface BankDetails {
    bankDetails: BankDetailsResult;
    error: BankDetailsError;
}

interface BankDetailsContentProps {
    onSave?: (bankDetails: BankDetails) => Promise<void>
    initialData?: BankDetails
    isLoading?: boolean
    verificationStatus?: 'pending' | 'verified' | 'rejected' | null
}

interface UserExchangeData {
    userId: number;
    uuid: string;
    brokerId: string;
    country: string;
    userTierType: number;
    bankDetailsStatus: number;
    otp: number;
    gaOtp: number;
    isUserFollowing: number;
    topN: number;
    useCache: boolean;
    checkMappingStatus: number;
}

interface UserExchangeResponse {
    success: boolean;
    message: string;
    data: UserExchangeData;
    errorCode: string | null;
    totalRecords: number;
}

interface BankFormData {
    accountHolderName: string;
    accountNumber: string;
    accountType: string;
    codeType: string;
    codeValue: string;
    bankName: string;
    bankAddress: string;
    bankDocType: string;
    bankDocFile: File | null;
    bankDocFileName: string;
}

interface FormErrors {
    accountHolderName: string;
    accountNumber: string;
    accountType: string;
    codeType: string;
    codeValue: string;
    bankName: string;
    bankAddress: string;
    bankDocType: string;
    bankDocFile: string;
}

interface ValidationResult {
    isValid: boolean;
    errorMessage: string;
}

interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
}

interface SaveBankDetailsPayload {
    uuid: string | null;
    benificiary_name: string;
    bank_name: string;
    bankAddress: string;
    accountType: string;
    account_no: string;
    routing_no: string;
    swiftCode: string;
    ifscCode: string;
    bankVerificationDocType: string;
    country: string;
}

interface SaveBankDetailsResponse {
    error?: BankDetailsError;
}

interface VerificationStatusConfig {
    severity: 'success' | 'error' | 'warning' | 'info';
    message: string;
    icon: JSX.Element;
}

const BankDetailsContent: React.FC<BankDetailsContentProps> = ({
    onSave,
    initialData,
    isLoading = false,
    verificationStatus = null,
}) => {

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [mode, setMode] = useState<'light' | 'dark'>('light');
    const [userUuid, setUserUuid] = useState<string | null>(null)
    const [bankDetailsStatus, setBankDetailsStatus] = useState<string | number>("")
    const searchParams = useSearchParams();
    const router = useRouter();
    const [continueUrl, setContinueUrl] = useState<string | null>(null);
    const [kycName, setKycName] = useState<string>('');
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [bankDocType, setBankDocType] = useState<string>('Voided Check');
    const [bankDocFile, setBankDocFile] = useState<File | null>(null);
    const [bankDocFileName, setBankDocFileName] = useState<string>('');
    const [bankDocTypeError, setBankDocTypeError] = useState<string>('');
    const [bankDocFileError, setBankDocFileError] = useState<string>('');
    const [isBankDocTypeTouched, setIsBankDocTypeTouched] = useState<boolean>(false);
    const [isBankDocFileTouched, setIsBankDocFileTouched] = useState<boolean>(false);
    const [formData, setFormData] = useState<BankFormData>({
        accountHolderName: '',
        accountNumber: '',
        accountType: 'Personal Savings',
        codeType: 'ROUTING NUMBER',
        codeValue: '',
        bankName: '',
        bankAddress: '',
        bankDocType: 'Voided Check',
        bankDocFile: null,
        bankDocFileName: '',
    });

    const BANK_DOC_TYPES = [
        'Voided Check',
        'Bank Letter / Bank Account Verification Letter',
        'Recent Bank Statement (last 3 months)',
        'Direct Deposit Form / ACH Authorization Form',
        'Screenshot or PDF from Online Banking',
    ];
    const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
    const MAX_FILE_SIZE_MB = 5;

    const [formErrors, setFormErrors] = useState<FormErrors>({
        accountHolderName: '',
        accountNumber: '',
        accountType: '',
        codeType: '',
        codeValue: '',
        bankName: '',
        bankAddress: '',
        bankDocType: '',
        bankDocFile: '',
    });

    const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
    const [touched, setTouched] = useState<Record<keyof BankFormData, boolean>>({
        accountHolderName: false,
        accountNumber: false,
        accountType: false,
        codeType: false,
        codeValue: false,
        bankName: false,
        bankAddress: false,
        bankDocType: false,
        bankDocFile: false,
        bankDocFileName: false,
    });

    // Validation Functions
    const validateAccountHolderName = (name: string): ValidationResult => {
        if (!name.trim()) {
            return { isValid: false, errorMessage: 'Account holder name is required' };
        }
        if (name.trim().length < 3) {
            return { isValid: false, errorMessage: 'Name must be at least 3 characters long' };
        }
        if (name.trim().length > 100) {
            return { isValid: false, errorMessage: 'Name must not exceed 100 characters' };
        }
        // Only allow letters and spaces - no special characters
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            return { isValid: false, errorMessage: 'Name can only contain letters and spaces' };
        }
        return { isValid: true, errorMessage: '' };
    };

    const validateAccountNumber = (accountNumber: string): ValidationResult => {
        if (!accountNumber.trim()) {
            return { isValid: false, errorMessage: 'Account number is required' };
        }
        if (accountNumber.trim().length < 8) {
            return { isValid: false, errorMessage: 'Account number must be at least 8 characters long' };
        }
        if (accountNumber.trim().length > 34) {
            return { isValid: false, errorMessage: 'Account number must not exceed 34 characters' };
        }
        // Only allow letters and numbers - no special characters
        if (!/^[a-zA-Z0-9]+$/.test(accountNumber.trim())) {
            return { isValid: false, errorMessage: 'Account number can only contain letters and numbers' };
        }
        return { isValid: true, errorMessage: '' };
    };

    const validateIFSCCode = (code: string): ValidationResult => {
        if (!code.trim()) {
            return { isValid: false, errorMessage: 'IFSC code is required' };
        }
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code.trim().toUpperCase())) {
            return { isValid: false, errorMessage: 'Invalid IFSC code format (e.g., SBIN0001234)' };
        }
        return { isValid: true, errorMessage: '' };
    };

    const validateSWIFTCode = (code: string): ValidationResult => {
        if (!code.trim()) {
            return { isValid: false, errorMessage: 'SWIFT code is required' };
        }
        if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(code.trim().toUpperCase())) {
            return { isValid: false, errorMessage: 'Invalid SWIFT code format (e.g., SBININBB123)' };
        }
        return { isValid: true, errorMessage: '' };
    };

    const validateRoutingNumber = (code: string): ValidationResult => {
        if (!code.trim()) {
            return { isValid: false, errorMessage: 'Routing number is required' };
        }
        if (!/^\d{9}$/.test(code.trim())) {
            return { isValid: false, errorMessage: 'Routing number must be exactly 9 digits' };
        }
        return { isValid: true, errorMessage: '' };
    };

    const validateCodeValue = (codeType: string, codeValue: string): ValidationResult => {
        switch (codeType) {
            case 'IFSC CODE':
                return validateIFSCCode(codeValue);
            case 'SWIFT CODE':
                return validateSWIFTCode(codeValue);
            case 'ROUTING NUMBER':
                return validateRoutingNumber(codeValue);
            default:
                return { isValid: false, errorMessage: 'Invalid code type' };
        }
    };

    const validateBankName = (name: string): ValidationResult => {
        if (!name.trim()) {
            return { isValid: false, errorMessage: 'Bank name is required' };
        }
        if (name.trim().length < 3) {
            return { isValid: false, errorMessage: 'Bank name must be at least 3 characters long' };
        }
        if (name.trim().length > 100) {
            return { isValid: false, errorMessage: 'Bank name must not exceed 100 characters' };
        }
        // Only allow letters, numbers and spaces - no special characters
        if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
            return { isValid: false, errorMessage: 'Bank name can only contain letters, numbers and spaces' };
        }
        return { isValid: true, errorMessage: '' };
    };

    const validateBankAddress = (address: string): ValidationResult => {
        if (!address.trim()) {
            return { isValid: false, errorMessage: 'Bank address is required' };
        }
        if (address.trim().length < 5) {
            return { isValid: false, errorMessage: 'Bank address must be at least 5 characters long' };
        }
        if (address.trim().length > 200) {
            return { isValid: false, errorMessage: 'Bank address must not exceed 200 characters' };
        }

        // Only letters, numbers, spaces, and `-`, `/`, `.`, `,` are allowed
        if (!/^[a-zA-Z0-9\s,.\-\/]+$/.test(address.trim())) {
            return { isValid: false, errorMessage: 'Address can only contain letters, numbers, spaces, and - / . ,' };
        }

        return { isValid: true, errorMessage: '' };
    };

    const validateField = (fieldName: keyof BankFormData, value: string): string => {
        let validationResult: ValidationResult;

        switch (fieldName) {
            case 'accountHolderName':
                validationResult = validateAccountHolderName(value);
                break;
            case 'accountNumber':
                validationResult = validateAccountNumber(value);
                break;
            case 'codeValue':
                validationResult = validateCodeValue(formData.codeType, value);
                break;
            case 'bankName':
                validationResult = validateBankName(value);
                break;
            case 'bankAddress':
                validationResult = validateBankAddress(value);
                break;
            default:
                validationResult = { isValid: true, errorMessage: '' };
        }

        return validationResult.errorMessage;
    };

    const validateBankDocType = (docType: string): ValidationResult => {
        if (!docType || !docType.trim()) {
            return { isValid: false, errorMessage: 'Please select a document type' };
        }
        return { isValid: true, errorMessage: '' };
    };

    const validateBankDocFile = (file: File | null): ValidationResult => {
        if (!file) {
            return { isValid: false, errorMessage: 'Please upload a bank verification document' };
        }
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
            return { isValid: false, errorMessage: 'Only PDF, JPG, or PNG files are accepted' };
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            return { isValid: false, errorMessage: `File size must not exceed ${MAX_FILE_SIZE_MB} MB` };
        }
        return { isValid: true, errorMessage: '' };
    };

    const validateAllFields = (): boolean => {
        const errors: FormErrors = {
            accountHolderName: validateField('accountHolderName', formData.accountHolderName),
            accountNumber: validateField('accountNumber', formData.accountNumber),
            accountType: '',
            codeType: '',
            codeValue: validateField('codeValue', formData.codeValue),
            bankName: validateField('bankName', formData.bankName),
            bankAddress: validateField('bankAddress', formData.bankAddress),
            bankDocType: validateBankDocType(bankDocType).errorMessage,
            bankDocFile: validateBankDocFile(bankDocFile).errorMessage,
        };

        setFormErrors(errors);

        // Mark all fields as touched
        setTouched({
            accountHolderName: true,
            accountNumber: true,
            accountType: true,
            codeType: true,
            codeValue: true,
            bankName: true,
            bankAddress: true,
            bankDocType: true,
            bankDocFile: true,
            bankDocFileName: true,
        });
        setIsBankDocTypeTouched(true);
        setIsBankDocFileTouched(true);

        return Object.values(errors).every(error => error === '');
    };

    const handleFileSelect = (file: File | null) => {
        if (!file) return;
        const result = validateBankDocFile(file);
        setBankDocFile(result.isValid ? file : null);
        setBankDocFileName(result.isValid ? file.name : '');
        setBankDocFileError(result.errorMessage);
        setIsBankDocFileTouched(true);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (file) handleFileSelect(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleRemoveFile = () => {
        setBankDocFile(null);
        setBankDocFileName('');
        setBankDocFileError('');
    };

    // Load theme preference from localStorage on mount
    useEffect(() => {
        const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
        if (savedMode) {
            setMode(savedMode);
        } else {
            setMode(prefersDarkMode ? 'dark' : 'light');
        }
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

    useEffect(() => {
        const redirectedUrl = searchParams.get('continue') || null;
        const decodedRedirectedUrl = redirectedUrl ? decodeURIComponent(redirectedUrl) : null;
        console.log(decodedRedirectedUrl);
        setContinueUrl(decodedRedirectedUrl)
        getUserInfo();
    }, [])

    /* Method defination for rendering bank details */
    const renderBankDetails = async (uuid: string, nameFromKyc?: string): Promise<void> => {
        try {
            const adminUser = localStorage.getItem('adminUuid') || localStorage.getItem('uuid');
            const responseBankDetails = await axios.post(
                `https://institutional-bo.paybito.com:8443/BrokerAdminApi/broker/GetUserBankDetails`,
                { adminUser: adminUser, uuid: uuid },
                {
                    // headers: { authorization: `bearer ${token}` }
                }
            );
            const bankDetails = (responseBankDetails && responseBankDetails.data) as BankDetails;
            const error = bankDetails?.error;
            if (error && error.error_data === 1) {
                showSnackbar(error.error_msg, 'error');
                return;
            }
            const r = bankDetails?.bankDetails;
            if (!r) return;
            const codeType =
                r.routing_no && r.routing_no !== '' ? 'ROUTING NUMBER' :
                r.swiftCode && r.swiftCode !== '' ? 'SWIFT CODE' :
                r.ifscCode && r.ifscCode !== '' ? 'IFSC CODE' : 'ROUTING NUMBER';
            const codeValue =
                r.routing_no && r.routing_no !== '' ? r.routing_no :
                r.swiftCode && r.swiftCode !== '' ? r.swiftCode :
                r.ifscCode && r.ifscCode !== '' ? r.ifscCode : '';
            
            const resolvedKycName = nameFromKyc !== undefined ? nameFromKyc : kycName;
            handleInputChange('accountHolderName', resolvedKycName || r.benificiary_name || r.beneficiary_name || '');
            handleInputChange('accountNumber', r.account_no || '');
            handleInputChange('accountType', r.accountType || 'Personal Savings');
            handleInputChange('codeType', codeType);
            handleInputChange('codeValue', codeValue);
            handleInputChange('bankName', r.bank_name || '');
            handleInputChange('bankAddress', r.bankAddress || '');
            const docType = r.bankVerificationDocType || r.bankDocType || 'Voided Check';
            setBankDocType(docType);
        } catch (error) {
            console.error('Failed to render bank details', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
        }
    }

    /* Method defination for get bitohub user details */
    const getUserInfo = async (): Promise<void> => {
        try {
            setLoading(true)
            const response = await getBitoHubUserInfo();

            if (!response.data.success) {
                showSnackbar(response.data.message, 'error');
                return;
            }
            const resp = response.data.data as UserExchangeData;
            setUserUuid(resp.uuid)
            setBankDetailsStatus(resp.bankDetailsStatus)

            let nameToUse = '';
            try {
                const kycResponse = await getUserKycDetails(resp.uuid);
                const userResult = kycResponse?.data?.userResult;
                if (userResult) {
                    if (userResult.userType === 2) {
                        nameToUse = userResult.enterpriseUser?.companyName || '';
                    } else if (userResult.userType === 1) {
                        const firstName = userResult.firstName || '';
                        const lastName = userResult.lastName || '';
                        nameToUse = `${firstName} ${lastName}`.trim();
                    }
                }
            } catch (err) {
                console.error('Failed to get KYC details', err);
            }
            setKycName(nameToUse);
            if (nameToUse) {
                handleInputChange('accountHolderName', nameToUse);
            }
            await renderBankDetails(resp.uuid, nameToUse);
        } catch (error) {
            console.error('Failed to get user info', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
        }
    }

    // Helper function to show snackbar
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info'): void => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = (): void => {
        setSnackbarOpen(false);
    };

    /* Method defination for storing any input change */
    const handleInputChange = (field: keyof BankFormData, value: string): void => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error for this field when user starts typing
        if (touched[field]) {
            const error = validateField(field, value);
            setFormErrors((prev) => ({
                ...prev,
                [field]: error,
            }));
        }
    }

    const handleBlur = (field: keyof BankFormData): void => {
        setTouched((prev) => ({
            ...prev,
            [field]: true,
        }));

        const fieldValue = formData[field];
        const error = validateField(field, typeof fieldValue === 'string' ? fieldValue : '');
        setFormErrors((prev) => ({
            ...prev,
            [field]: error,
        }));
    };

    /*  Method defination to call API to save bank details */
    const handleSave = async (): Promise<void> => {
        // Validate all fields
        const isValid = validateAllFields();

        if (!isValid) {
            showSnackbar('Please fix all validation errors before submitting', 'error');
            return;
        }

        try {
            setLoading(true);
            const bankData: SaveBankDetailsPayload = {
                uuid: userUuid,
                benificiary_name: formData.accountHolderName.trim(),
                bank_name: formData.bankName.trim(),
                bankAddress: formData.bankAddress.trim(),
                accountType: formData.accountType,
                account_no: formData.accountNumber.trim().replace(/\s/g, ''),
                routing_no: formData.codeType === 'ROUTING NUMBER' ? formData.codeValue.trim() : '',
                swiftCode: formData.codeType === 'SWIFT CODE' ? formData.codeValue.trim().toUpperCase() : '',
                ifscCode: formData.codeType === 'IFSC CODE' ? formData.codeValue.trim().toUpperCase() : '',
                bankVerificationDocType: bankDocType,
                country: '',
            };

            const adminUser = localStorage.getItem('adminUuid') || localStorage.getItem('uuid') || '';
            const payloadData = new FormData();
            payloadData.append('bankData', JSON.stringify(bankData));
            payloadData.append('adminUser', adminUser);
            if (bankDocFile) {
                payloadData.append('doc', bankDocFile);
            }

            const response = await axios.post(
                `https://institutional-bo.paybito.com:8443/BrokerAdminApi/broker/UpdateUserBankDetails-v2`,
                payloadData,
                {
                    // headers: { authorization: `bearer ${token}` }
                }
            );

            const res = (response && response.data) as SaveBankDetailsResponse;
            if (res?.error && res.error.error_data === 1) {
                showSnackbar(res.error.error_msg || 'Failed to save bank details', 'error');
                return;
            }

            if (userUuid) {
                showSnackbar('Bank details saved successfully', 'success');
                setSaveSuccess(true);
                await renderBankDetails(userUuid);

                if (continueUrl !== null) {
                    setTimeout(() => {
                        router.push(`${continueUrl}`);
                    }, 2000);
                }
            } else {
                showSnackbar('User UUID is missing', 'error');
            }
        } catch (error) {
            console.error('Failed to save bank details', error);
            if (error instanceof Error) {
                showSnackbar(error.message, 'error');
            } else {
                showSnackbar('An unexpected error occurred', 'error');
            }
        } finally {
            setLoading(false)
        }
    }

    const getBankDetailsStatusMessage = (): string => {
        if (bankDetailsStatus === "" || bankDetailsStatus === null || bankDetailsStatus === undefined) {
            return "Bank details not submitted.";
        } else if (bankDetailsStatus === 0 || bankDetailsStatus === "0") {
            return "Bank details submitted for Verification.";
        } else if (bankDetailsStatus === 2 || bankDetailsStatus === "2") {
            return "Bank details verified.";
        } else if (bankDetailsStatus === 3 || bankDetailsStatus === "3") {
            return "Bank documents declined, please submit again.";
        }
        return "Bank details not submitted.";
    }

    const getVerificationStatusConfig = (): VerificationStatusConfig | null => {
        if (bankDetailsStatus === "" || bankDetailsStatus === null || bankDetailsStatus === undefined) {
            return {
                severity: 'info',
                message: 'Bank details not submitted.',
                icon: <InfoIcon />,
            }
        } else if (bankDetailsStatus === 0 || bankDetailsStatus === "0") {
            return {
                severity: 'warning',
                message: 'Bank details submitted for Verification.',
                icon: <WarningIcon />,
            }
        } else if (bankDetailsStatus === 2 || bankDetailsStatus === "2") {
            return {
                severity: 'success',
                message: 'Bank details verified.',
                icon: <CheckCircleIcon />,
            }
        } else if (bankDetailsStatus === 3 || bankDetailsStatus === "3") {
            return {
                severity: 'error',
                message: 'Bank documents declined, please submit again.',
                icon: <ErrorIcon />,
            }
        }
        return null
    }

    const verificationConfig = getVerificationStatusConfig()

    return (
        <Fragment>
            <Box
                sx={{
                    minHeight: '100vh',
                    py: { xs: 2, sm: 3, md: 4 },
                    px: { xs: 2, sm: 3 },
                    background:
                        theme.palette.mode === 'light'
                            ? 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
                            : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
                }}
            >
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                    {/* Header Section */}
                    <Box sx={{ mb: 4 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mb: 1,
                            }}
                        >
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                                }}
                            >
                                Bank Details
                            </Typography>
                            <Tooltip title="Your bank information for deposits and withdrawals">
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                        },
                                    }}
                                >
                                    <InfoIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography
                            variant="body1"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                fontWeight: 500,
                            }}
                        >
                            {getBankDetailsStatusMessage()}
                        </Typography>
                    </Box>

                    {/* Status Alerts */}
                    {verificationConfig && (
                        <Alert
                            severity={verificationConfig.severity}
                            icon={verificationConfig.icon}
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                animation: 'slideIn 0.3s ease-in-out',
                                '@keyframes slideIn': {
                                    from: {
                                        opacity: 0,
                                        transform: 'translateY(-10px)',
                                    },
                                    to: {
                                        opacity: 1,
                                        transform: 'translateY(0)',
                                    },
                                },
                            }}
                        >
                            {verificationConfig.message}
                        </Alert>
                    )}

                    {saveSuccess && (
                        <Alert
                            severity="success"
                            icon={<CheckCircleIcon />}
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                fontSize: '0.95rem',
                                fontWeight: 500,
                            }}
                        >
                            Bank details saved successfully!
                        </Alert>
                    )}

                    {/* Main Form Card */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, sm: 3.5, md: 4 },
                            borderRadius: 3,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            backgroundColor:
                                theme.palette.mode === 'light'
                                    ? '#ffffff'
                                    : theme.palette.background.paper,
                            boxShadow:
                                theme.palette.mode === 'light'
                                    ? '0 4px 20px rgba(0,0,0,0.08)'
                                    : '0 4px 20px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s ease-in-out',
                        }}
                    >
                        {/* Form Container */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5, md: 3 } }}>
                            {/* Row 1: Account Holder Name & IBAN / Account Number */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    gap: { xs: 2, sm: 2.5, md: 3 },
                                }}
                            >
                                {/* Account Holder Name */}
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Account Holder's Name"
                                        placeholder="Enter account holder's name"
                                        variant="outlined"
                                        value={formData.accountHolderName}
                                        onChange={(e) =>
                                            handleInputChange('accountHolderName', e.target.value)
                                        }
                                        onBlur={() => handleBlur('accountHolderName')}
                                        error={touched.accountHolderName && Boolean(formErrors.accountHolderName)}
                                        helperText={touched.accountHolderName && formErrors.accountHolderName}
                                        disabled={isLoading}
                                        InputProps={{ readOnly: true }}
                                        required
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.02)'
                                                        : 'rgba(255,255,255,0.05)',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    backgroundColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.04)'
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
                                                },
                                                '& fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.12)'
                                                            : 'rgba(255,255,255,0.12)',
                                                    transition: 'border-color 0.2s ease-in-out',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.2)'
                                                            : 'rgba(255,255,255,0.2)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiOutlinedInput-input::placeholder': {
                                                color: theme.palette.text.secondary,
                                                opacity: 0.7,
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: theme.palette.text.secondary,
                                                fontWeight: 500,
                                                fontSize: '0.95rem',
                                                '&.Mui-focused': {
                                                    color: theme.palette.primary.main,
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                {/* IBAN / Account Number */}
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="IBAN / Account Number"
                                        placeholder="Enter IBAN or account number"
                                        variant="outlined"
                                        value={formData.accountNumber}
                                        onChange={(e) =>
                                            handleInputChange('accountNumber', e.target.value)
                                        }
                                        onBlur={() => handleBlur('accountNumber')}
                                        error={touched.accountNumber && Boolean(formErrors.accountNumber)}
                                        helperText={touched.accountNumber && formErrors.accountNumber}
                                        disabled={isLoading}
                                        required
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.02)'
                                                        : 'rgba(255,255,255,0.05)',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    backgroundColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.04)'
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
                                                },
                                                '& fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.12)'
                                                            : 'rgba(255,255,255,0.12)',
                                                    transition: 'border-color 0.2s ease-in-out',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.2)'
                                                            : 'rgba(255,255,255,0.2)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiOutlinedInput-input::placeholder': {
                                                color: theme.palette.text.secondary,
                                                opacity: 0.7,
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: theme.palette.text.secondary,
                                                fontWeight: 500,
                                                fontSize: '0.95rem',
                                                '&.Mui-focused': {
                                                    color: theme.palette.primary.main,
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Row 2: Account Type, Code Type & Enter Code */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    gap: { xs: 2, sm: 2.5, md: 3 },
                                }}
                            >
                                {/* Account Type */}
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Account Type"
                                        variant="outlined"
                                        value={formData.accountType}
                                        onChange={(e) =>
                                            handleInputChange('accountType', e.target.value)
                                        }
                                        disabled={isLoading}
                                        required
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.02)'
                                                        : 'rgba(255,255,255,0.05)',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    backgroundColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.04)'
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
                                                },
                                                '& fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.12)'
                                                            : 'rgba(255,255,255,0.12)',
                                                    transition: 'border-color 0.2s ease-in-out',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.2)'
                                                            : 'rgba(255,255,255,0.2)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: theme.palette.text.secondary,
                                                fontWeight: 500,
                                                fontSize: '0.95rem',
                                                '&.Mui-focused': {
                                                    color: theme.palette.primary.main,
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="Personal Checking">Personal Checking</MenuItem>
                                        <MenuItem value="Personal Savings">Personal Savings</MenuItem>
                                        <MenuItem value="Business Checking">Business Checking</MenuItem>
                                        <MenuItem value="Business Savings">Business Savings</MenuItem>
                                    </TextField>
                                </Box>

                                {/* Code Type */}
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Code Type"
                                        variant="outlined"
                                        value={formData.codeType}
                                        onChange={(e) => {
                                            handleInputChange('codeType', e.target.value);
                                            // Clear code value when changing code type
                                            handleInputChange('codeValue', '');
                                            setFormErrors(prev => ({ ...prev, codeValue: '' }));
                                        }}
                                        disabled={isLoading}
                                        required
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.02)'
                                                        : 'rgba(255,255,255,0.05)',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    backgroundColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.04)'
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
                                                },
                                                '& fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.12)'
                                                            : 'rgba(255,255,255,0.12)',
                                                    transition: 'border-color 0.2s ease-in-out',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.2)'
                                                            : 'rgba(255,255,255,0.2)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: theme.palette.text.secondary,
                                                fontWeight: 500,
                                                fontSize: '0.95rem',
                                                '&.Mui-focused': {
                                                    color: theme.palette.primary.main,
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="IFSC CODE">IFSC CODE</MenuItem>
                                        <MenuItem value="SWIFT CODE">SWIFT CODE</MenuItem>
                                        <MenuItem value="ROUTING NUMBER">ROUTING NUMBER</MenuItem>
                                    </TextField>
                                </Box>

                                {/* Enter Code */}
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Enter Code"
                                        placeholder={`Enter ${formData.codeType.toLowerCase()}`}
                                        variant="outlined"
                                        value={formData.codeValue}
                                        onChange={(e) =>
                                            handleInputChange('codeValue', e.target.value)
                                        }
                                        onBlur={() => handleBlur('codeValue')}
                                        error={touched.codeValue && Boolean(formErrors.codeValue)}
                                        helperText={touched.codeValue && formErrors.codeValue}
                                        disabled={isLoading}
                                        required
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.02)'
                                                        : 'rgba(255,255,255,0.05)',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    backgroundColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.04)'
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
                                                },
                                                '& fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.12)'
                                                            : 'rgba(255,255,255,0.12)',
                                                    transition: 'border-color 0.2s ease-in-out',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor:
                                                        theme.palette.mode === 'light'
                                                            ? 'rgba(0,0,0,0.2)'
                                                            : 'rgba(255,255,255,0.2)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: 2,
                                                },
                                            },
                                            '& .MuiOutlinedInput-input::placeholder': {
                                                color: theme.palette.text.secondary,
                                                opacity: 0.7,
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: theme.palette.text.secondary,
                                                fontWeight: 500,
                                                fontSize: '0.95rem',
                                                '&.Mui-focused': {
                                                    color: theme.palette.primary.main,
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Row 3: Bank Name */}
                            <Box>
                                <TextField
                                    fullWidth
                                    label="Bank Name"
                                    placeholder="Enter bank name"
                                    variant="outlined"
                                    value={formData.bankName}
                                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                                    onBlur={() => handleBlur('bankName')}
                                    error={touched.bankName && Boolean(formErrors.bankName)}
                                    helperText={touched.bankName && formErrors.bankName}
                                    disabled={isLoading}
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor:
                                                theme.palette.mode === 'light'
                                                    ? 'rgba(0,0,0,0.02)'
                                                    : 'rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                backgroundColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.04)'
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
                                            },
                                            '& fieldset': {
                                                borderColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.12)'
                                                        : 'rgba(255,255,255,0.12)',
                                                transition: 'border-color 0.2s ease-in-out',
                                            },
                                            '&:hover fieldset': {
                                                borderColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.2)'
                                                        : 'rgba(255,255,255,0.2)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: theme.palette.primary.main,
                                                borderWidth: 2,
                                            },
                                        },
                                        '& .MuiOutlinedInput-input::placeholder': {
                                            color: theme.palette.text.secondary,
                                            opacity: 0.7,
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: theme.palette.text.secondary,
                                            fontWeight: 500,
                                            fontSize: '0.95rem',
                                            '&.Mui-focused': {
                                                color: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Box>

                            {/* Row 4: Bank Address */}
                            <Box>
                                <TextField
                                    fullWidth
                                    label="Bank Address"
                                    placeholder="Enter bank address"
                                    variant="outlined"
                                    value={formData.bankAddress}
                                    onChange={(e) =>
                                        handleInputChange('bankAddress', e.target.value)
                                    }
                                    onBlur={() => handleBlur('bankAddress')}
                                    error={touched.bankAddress && Boolean(formErrors.bankAddress)}
                                    helperText={touched.bankAddress && formErrors.bankAddress}
                                    disabled={isLoading}
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor:
                                                theme.palette.mode === 'light'
                                                    ? 'rgba(0,0,0,0.02)'
                                                    : 'rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                backgroundColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.04)'
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
                                            },
                                            '& fieldset': {
                                                borderColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.12)'
                                                        : 'rgba(255,255,255,0.12)',
                                                transition: 'border-color 0.2s ease-in-out',
                                            },
                                            '&:hover fieldset': {
                                                borderColor:
                                                    theme.palette.mode === 'light'
                                                        ? 'rgba(0,0,0,0.2)'
                                                        : 'rgba(255,255,255,0.2)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: theme.palette.primary.main,
                                                borderWidth: 2,
                                            },
                                        },
                                        '& .MuiOutlinedInput-input::placeholder': {
                                            color: theme.palette.text.secondary,
                                            opacity: 0.7,
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: theme.palette.text.secondary,
                                            fontWeight: 500,
                                            fontSize: '0.95rem',
                                            '&.Mui-focused': {
                                                color: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Box>

                            {/* Bank Verification Document */}
                            <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: 1.5,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                                        color: theme.palette.warning.main
                                    }}>
                                        <Assignment sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.2 }}>
                                            Bank Verification Document
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                            Upload a document to verify your bank account
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: alpha(theme.palette.warning.main, 0.08), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.text.primary, mb: 1 }}>
                                        <InfoIcon fontSize="small" sx={{ color: theme.palette.warning.main }} /> Uploaded document should show:
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" component="ul" sx={{ m: 0, pl: 3, '& li': { mb: 0.5 } }}>
                                        <li>Account Holder Name</li>
                                        <li>Bank Name</li>
                                        <li>Account Number (partially masked if needed)</li>
                                        <li>Routing / IFSC / SWIFT details (as applicable)</li>
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, sm: 2.5, md: 3 } }}>
                                    {/* Document Type Select */}
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Bank Account Verification Document Type"
                                            value={bankDocType}
                                            onChange={(e) => {
                                                setBankDocType(e.target.value);
                                                setBankDocTypeError('');
                                            }}
                                            onBlur={() => {
                                                setIsBankDocTypeTouched(true);
                                                setBankDocTypeError(validateBankDocType(bankDocType).errorMessage);
                                            }}
                                            error={isBankDocTypeTouched && Boolean(bankDocTypeError)}
                                            helperText={isBankDocTypeTouched && bankDocTypeError}
                                            disabled={isLoading}
                                            required
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                    },
                                                    '& fieldset': {
                                                        borderColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
                                                    },
                                                }
                                            }}
                                        >
                                            {BANK_DOC_TYPES.map((type) => (
                                                <MenuItem key={type} value={type}>{type}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Box>

                                    {/* File Upload Area */}
                                    <Box sx={{ flex: 1 }}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept=".pdf,.jpeg,.jpg,.png"
                                            onChange={handleFileInputChange}
                                            disabled={isLoading}
                                        />
                                        {!bankDocFileName ? (
                                            <Box
                                                onClick={() => !isLoading && fileInputRef.current && fileInputRef.current.click()}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                sx={{
                                                    border: `2px dashed ${isDragOver ? theme.palette.primary.main : isBankDocFileTouched && bankDocFileError ? theme.palette.error.main : alpha(theme.palette.primary.main, 0.3)}`,
                                                    borderRadius: 2,
                                                    p: { xs: 2.5, md: 3 },
                                                    textAlign: 'center',
                                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                                    backgroundColor: isDragOver ? alpha(theme.palette.primary.main, 0.05) : theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    minHeight: '92px',
                                                    '&:hover': {
                                                        backgroundColor: isLoading ? undefined : alpha(theme.palette.primary.main, 0.05),
                                                        borderColor: isLoading ? undefined : theme.palette.primary.main,
                                                    }
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>
                                                    {isDragOver ? 'Drop your file here' : 'Click or drag & drop to upload'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Accepted formats: PDF, JPG, PNG (Max 5 MB)
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2,
                                                borderRadius: 2,
                                                backgroundColor: alpha(theme.palette.success.main, 0.08),
                                                border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
                                                minHeight: '92px',
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                                                    <CheckCircleIcon color="success" fontSize="medium" />
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {bankDocFileName}
                                                    </Typography>
                                                </Box>
                                                <IconButton size="small" onClick={handleRemoveFile} color="error" disabled={isLoading} sx={{ flexShrink: 0, ml: 1 }}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        )}
                                        {isBankDocFileTouched && bankDocFileError && (
                                            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', ml: 1.5 }}>
                                                {bankDocFileError}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            {/* Information Box */}
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                    borderRadius: 2,
                                    display: 'flex',
                                    gap: 1.5,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <InfoIcon
                                    sx={{
                                        color: theme.palette.primary.main,
                                        fontSize: 20,
                                        mt: 0.25,
                                        flexShrink: 0,
                                    }}
                                />
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: theme.palette.text.primary,
                                            fontWeight: 600,
                                            mb: 0.5,
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        Important Information
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            lineHeight: 1.6,
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        Ensure all bank details are accurate before submission. Any
                                        discrepancies may result in transaction delays or rejection.
                                        Your bank information is encrypted and securely stored.
                                    </Typography>
                                </Box>
                            </Card>

                            {/* Save Button */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    justifyContent: { xs: 'stretch', sm: 'flex-start' },
                                    pt: 2,
                                }}
                            >
                                <Button
                                    variant="contained"
                                    size={isMobile ? 'medium' : 'large'}
                                    disabled={isLoading || loading}
                                    onClick={handleSave}
                                    sx={{
                                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: { xs: '0.9rem', sm: '1rem' },
                                        px: { xs: 2, sm: 4 },
                                        py: { xs: 1.2, sm: 1.5 },
                                        borderRadius: 2,
                                        minWidth: { xs: '100%', sm: 160 },
                                        textTransform: 'none',
                                        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                                        transition: 'all 0.3s ease-in-out',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 12px 35px ${alpha(
                                                theme.palette.primary.main,
                                                0.4
                                            )}`,
                                        },
                                        '&:disabled': {
                                            opacity: 0.7,
                                        },
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background:
                                                'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                            animation: 'shimmer 2s infinite',
                                        },
                                        '@keyframes shimmer': {
                                            '0%': {
                                                transform: 'translateX(-100%)',
                                            },
                                            '100%': {
                                                transform: 'translateX(100%)',
                                            },
                                        },
                                    }}
                                    endIcon={
                                        (isLoading || loading) ? (
                                            <CircularProgress size={20} color="inherit" />
                                        ) : undefined
                                    }
                                >
                                    {(isLoading || loading) ? 'Saving...' : 'SAVE CHANGES'}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
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

export default BankDetailsContent