'use client'

import React, { useState, useEffect, useMemo, Fragment, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getBitoHubUserInfo, getUserBankDetails, getUserKycDetails } from '../services/CoreDataService';

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
    useMediaQuery,
    alpha,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Backdrop,
    Divider,
    createTheme,
    ThemeProvider,
    Checkbox,
    FormControlLabel,
    Stepper,
    Step,
    StepLabel,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Autocomplete,
} from '@mui/material'
import {
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    CloudUpload as CloudUploadIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Assignment as AssignmentIcon,
    VerifiedUser as VerifiedUserIcon,
    CameraAlt as CameraAltIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Close as CloseIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useForm, Controller } from 'react-hook-form'
import Webcam from 'react-webcam'
import QRCode from 'react-qr-code'
import { Country, ICountry } from 'country-state-city'
import CountryStateCityFields from './CountryStateCityFields'
import {
    handleBlockedUnicodeKeyDown,
    handleBlockedUnicodePaste,
    sanitizeBlockedUnicode,
    validateNoBlockedUnicode
} from '../utils/unicodeValidation'

// API Base URL
const API_BASE_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi';


// Constants
const Industries = [
    'Agriculture', 'Automotive', 'Banking', 'Construction', 'Education',
    'Energy', 'Entertainment', 'Finance', 'Healthcare', 'Hospitality',
    'Information Technology', 'Insurance', 'Manufacturing', 'Media',
    'Mining', 'Real Estate', 'Retail', 'Telecommunications', 'Transportation', 'Other'
]

const Occupations = [
    'Accountant', 'Analyst', 'Attorney', 'Business Owner', 'Consultant',
    'Developer', 'Doctor', 'Engineer', 'Executive', 'Manager',
    'Nurse', 'Professor', 'Retired', 'Salesperson', 'Student',
    'Teacher', 'Technician', 'Trader', 'Unemployed', 'Other'
]

const Funds = [
    'Salary/Employment Income', 'Savings', 'Investment Returns', 'Inheritance',
    'Gift', 'Sale of Property', 'Retirement Funds', 'Business Income',
    'Cryptocurrency Mining/Trading', 'Loan', 'Other'
]


const amountOptions = [
    { value: '1', label: '$0 - $10,000' },
    { value: '2', label: '$10,000 - $25,000' },
    { value: '3', label: '$25,000 - $50,000' },
    { value: '4', label: '$50,000 - $100,000' },
    { value: '5', label: '$100,000 - $250,000' },
    { value: '6', label: '$250,000 - $1,000,000' },
    { value: '7', label: '$1,000,000+' },
]

// Interfaces
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
    companyNetWorth?:string
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
interface ScannerTokenResponse {
    error?: {
        error_data?: number
        error_msg?: string
    }
    token?: string
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

interface KycContentProps {
    userDetails?: UserDetails
    isLoading?: boolean
    userType?: 'individual' | 'enterprise'
    onKycComplete?: () => void
}

// Form Data Interfaces
interface AddressFormData {
    houseNo: string
    streetArea: string
    city: string
    state: string
    country: string
    zipCode: string
}

interface DOBFormData {
    month: string
    day: string
    year: string
    birthPlace: string
    ssnOrPassport: string
}

interface EmploymentFormData {
    industry: string
    occupation: string
    sourceOfFunds: string
    monthlyTransactionVolume: string
    annualIncome: string
    netWorth: string
    employmentCategory: string
    employmentType: string
    pepStatus: string
    bankingPartner: string
    bankingDuration: string
    purposeAccount: string
    thirdParty: string
}

interface AddressProofFormData {
    addressProof: FileList
}

interface IDDocumentFormData {
    idProofFront: FileList
    idProofBack?: FileList
}

interface PhotoVerificationFormData {
    userPhoto?: FileList
    panNumber?: string
    panCardPhoto?: FileList
}

interface CompanyInfoFormData {
    companyName: string
    companyRegNo: string
    companyWebsite?: string
    incorporationCountry: string
    corporateStructure: string
    businessActivity: string
    companyregAddress: string
    companyregCity: string
    companyregState: string
    companyregCountry: string
    companyregZip: string
    companyOfficeAddress?: string
    companyOfficeCity?: string
    companyOfficeState?: string
    companyOfficeCountry?: string
    companyOfficeZip?: string
    revenue: string
    companyNetWorth:string
    profit: string
    companyAssets: string
    businessDescription: string
    // Add missing fields
    accountPurpose: string
    investmentSource: string
    transactionVolumes: string
    transactionFrequency: string
    bankingPartner: string
    relationWithBank: string
}

interface CompanyDocumentsFormData {
    incorporationCertificate: FileList
    memorandum: FileList
    associationArticles: FileList
    incumbencyCertificate: FileList
    directorsRegister: FileList
    shareholdersRegister: FileList
    boardResolution: FileList
    addressProof: FileList
}

// Face Detection Interfaces
interface FaceDetection {
    box: {
        x: number
        y: number
        width: number
        height: number
    }
    score: number
}

interface FaceLandmarks {
    positions: Array<{ x: number; y: number }>
    shift: { x: number; y: number }
}

interface FaceDetectionWithLandmarks {
    detection: FaceDetection
    landmarks: FaceLandmarks
}

interface TinyFaceDetectorOptions {
    inputSize?: number
    scoreThreshold?: number
}

interface DisplaySize {
    width: number
    height: number
}

interface FaceApiNets {
    tinyFaceDetector: {
        loadFromUri: (uri: string) => Promise<void>
    }
    faceLandmark68Net: {
        loadFromUri: (uri: string) => Promise<void>
    }
}

interface FaceApiDraw {
    drawDetections: (canvas: HTMLCanvasElement, detections: FaceDetectionWithLandmarks[]) => void
    drawFaceLandmarks: (canvas: HTMLCanvasElement, detections: FaceDetectionWithLandmarks[]) => void
}

interface FaceApi {
    nets: FaceApiNets
    detectAllFaces: (
        input: HTMLVideoElement,
        options: TinyFaceDetectorOptions
    ) => {
        withFaceLandmarks: () => Promise<FaceDetectionWithLandmarks[]>
    }
    TinyFaceDetectorOptions: new (options?: TinyFaceDetectorOptions) => TinyFaceDetectorOptions
    matchDimensions: (canvas: HTMLCanvasElement, displaySize: DisplaySize) => void
    resizeResults: (
        detections: FaceDetectionWithLandmarks[],
        displaySize: DisplaySize
    ) => FaceDetectionWithLandmarks[]
    draw: FaceApiDraw
}

// Extend Window interface
declare global {
    interface Window {
        faceapi: FaceApi
    }
}

type CompanyDocumentFieldName = keyof CompanyDocumentsFormData

interface AuthorizationLetterFormData {
    wolfsbergDoc?: FileList
    authorizationLetter: FileList
}

interface OwnerFormData {
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
    pep: string
    frontId: FileList
    backId: FileList
    addressProof: FileList
    selfie: FileList
    investingFund?: FileList,
    ownerUuid: string
}

interface KycPayload {
    addressProof?: File
    idProofFront?: File
    idProofBack?: File
    incorporationCertificate?: File
    memorandum?: File
    associationArticles?: File
    incumbencyCertificate?: File
    directorsRegister?: File
    shareholdersRegister?: File
    boardResolution?: File
    wolfsbergDoc?: File
    authorizationLetter?: File
    [key: string]: File | undefined
}

interface ApiResponse {
    error?: {
        error_data?: number
        error_msg?: string
    }
}

interface GetKycDataResponse {
    error?: {
        error_data?: number
        error_msg?: string
    }
    // UserDetails fields are at root level, not nested under 'data'
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

// Add this interface near the other interfaces
interface Country {
    country: string
    code: string
    dialCode: string
}

interface CountriesApiResponse {
    countries: Country[]
    error: {
        error_data: number
        error_msg: string
    }
}

// Validation Helper Functions
const validateFile = (fileList: FileList | null | undefined) => {
    if (!fileList || fileList.length === 0) return 'This file is required'
    const file = fileList[0]
    const validTypes = [
        'image/jpeg', 'image/png', 'image/jpg', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jfif', 'image/heic'
    ]
    if (!validTypes.includes(file.type)) return 'Invalid file type'
    if (file.size > 6 * 1024 * 1024) return 'MAX limit 6 MB.'
    return true
}

const validateFilePNGJPEG = (fileList: FileList | null | undefined) => {
    if (!fileList || fileList.length === 0) return 'This file is required'
    const file = fileList[0]
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) return 'Only PNG or JPEG files are allowed'
    if (file.size > 6 * 1024 * 1024) return 'MAX limit 6 MB.'
    return true
}

const allowOnlyAlphabets = (e: React.KeyboardEvent) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', ' ']
    if (!/^[a-zA-Z]$/.test(e.key) && !allowedKeys.includes(e.key)) {
        e.preventDefault()
    }
}

// Main Component
const KycContent: React.FC<KycContentProps> = ({
    userDetails: initialUserDetails,
    isLoading: externalLoading = false,
    userType: initialUserType,
    onKycComplete,
}) => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
    const [mode, setMode] = useState<'light' | 'dark'>('light')
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [userDetails, setUserDetails] = useState<UserDetails>(initialUserDetails || {})
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success')
    const [kycPayload, setKycPayload] = useState<KycPayload>({})
    const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>([])
    const [ownerDialogOpen, setOwnerDialogOpen] = useState(false)
    const [editingOwner, setEditingOwner] = useState<BeneficialOwner | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [userType, setUserType] = useState<'individual' | 'enterprise' | null>(initialUserType || null)
    const [userTypeSelected, setUserTypeSelected] = useState<boolean>(!!initialUserType)
    const [userUuid, setUserUuid] = useState<string | null>(null);
    const [forceShowSelection, setForceShowSelection] = useState<boolean>(false)

    const [countries, setCountries] = useState<Country[]>([])
    const [countriesLoading, setCountriesLoading] = useState(false)

    // Fetch countries from API
    const fetchCountries = async () => {
        try {
            setCountriesLoading(true)
            const response = await axios.get<CountriesApiResponse>(
                'https://accounts.paybito.com/api/home//getExchangeCountries/PAYB18022021121103'
            )

            if (response.data?.error?.error_data === 0) {
                // Sort countries alphabetically
                const sortedCountries = response.data.countries.sort((a, b) =>
                    a.country.localeCompare(b.country)
                )
                setCountries(sortedCountries)
            } else {
                showSnackbar('Failed to load countries', 'error')
            }
        } catch (error) {
            console.error('Failed to fetch countries', error)
            showSnackbar('Failed to load countries', 'error')
        } finally {
            setCountriesLoading(false)
        }
    }

    // Add useEffect to fetch countries on mount
    useEffect(() => {
        fetchCountries()
    }, [])



    useEffect(() => {
        const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null
        setMode(savedMode || (prefersDarkMode ? 'dark' : 'light'))
    }, [prefersDarkMode])

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: '#1e40af',
                light: '#42a5f5',
                dark: '#1e40af',
                contrastText: '#ffffff'
            },
            secondary: {
                main: '#dc004e'
            },
            background: {
                default: mode === 'light' ? '#f5f5f5' : '#121212',
                paper: mode === 'light' ? '#ffffff' : '#1e1e1e'
            },
            text: {
                primary: mode === 'light' ? '#212121' : '#ffffff',
                secondary: mode === 'light' ? '#757575' : '#b0b0b0'
            }
        },
        typography: {
            fontFamily: [
                '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
                '"Helvetica Neue"', 'Arial', 'sans-serif'
            ].join(',')
        },
        shape: { borderRadius: 8 },
        spacing: 8,
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 8,
                        fontWeight: 600
                    }
                }
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 8
                        }
                    }
                }
            }
        }
    }), [mode])

    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const individualSteps = [
        { label: 'Personal Address', icon: <PersonIcon /> },
        { label: 'Date of Birth & SSN', icon: <AssignmentIcon /> },
        { label: 'Employment Details', icon: <BusinessIcon /> },
        { label: 'Address Proof', icon: <CloudUploadIcon /> },
        { label: 'ID Document', icon: <VerifiedUserIcon /> },
        { label: 'Photo Verification', icon: <CameraAltIcon /> },
    ]

    const enterpriseSteps = [
        { label: 'Company Information', icon: <BusinessIcon /> },
        { label: 'Company Documents', icon: <CloudUploadIcon /> },
        { label: 'Authorization Letter', icon: <AssignmentIcon /> },
        { label: 'Beneficial Owners', icon: <PersonIcon /> },
    ]

    const steps = userType === 'enterprise' ? enterpriseSteps : individualSteps

    // Common TextField styles
    const textFieldStyles = {
        '& .MuiOutlinedInput-root': {
            backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)'
            },
            '&.Mui-focused': {
                backgroundColor: mode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`
            },
            '& fieldset': {
                borderColor: mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'
            },
            '&:hover fieldset': {
                borderColor: mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'
            },
            '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: 2
            }
        },
        '& .MuiInputLabel-root': {
            color: theme.palette.text.secondary,
            fontWeight: 500,
            '&.Mui-focused': {
                color: theme.palette.primary.main
            }
        }
    }

    // Responsive row styles
    const formRowStyles = {
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, sm: 2.5, md: 3 }
    }

    const formFieldStyles = {
        flex: 1,
        minWidth: { xs: '100%', md: 0 }
    }

    // Navigation handlers
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    // Snackbar helper
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
        setSnackbarMessage(message)
        setSnackbarSeverity(severity)
        setSnackbarOpen(true)
    }

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false)
    }

    // User Type Selection handler
    const handleUserTypeSelect = (type: 'individual' | 'enterprise') => {
        setUserType(type)
        setUserTypeSelected(true)
        setCurrentStep(0)
        setForceShowSelection(false)
    }

    /* Method definition for get bitohub user details */
    const getUserInfo = async () => {
        try {
            setLoading(true)
            const userInfo = await getBitoHubUserInfo();

            if (!userInfo.data.success) {
                showSnackbar(userInfo.data.message, 'error');
                return;
            }
            const resp = userInfo.data.data;
            setUserUuid(resp.uuid)

            // Fetch existing KYC details
            const response = await getUserKycDetails(resp.uuid);
            const kycData = response.data.userResult as UserDetails

            if (kycData) {
                setUserDetails(kycData)
                console.log(`KYC DATA`, kycData);

                if (kycData.userType === 2) {
                    setUserType('enterprise')
                } else if (kycData.userType === 1) {
                    setUserType('individual')
                }

                if (kycData.isKycFinished === 1) {
                    //showSnackbar('KYC already completed', 'info')
                    onKycComplete?.()
                } else if (kycData.userType) {
                    setUserTypeSelected(true)

                    if (kycData.userType === 1) {
                        if (kycData.userDocsStatus === '0') {
                            setCurrentStep(5)
                        } else if (kycData.empCategory) {
                            setCurrentStep(3)
                        } else if (kycData.dob) {
                            setCurrentStep(2)
                        } else if (kycData.address) {
                            setCurrentStep(1)
                        } else {
                            setCurrentStep(0)
                        }
                    } else {
                        if (kycData.userDocsStatus === '2') {
                            setCurrentStep(0)
                        } else {
                            if (kycData.enterpriseUser?.enterpriseOwners?.length) {
                                setCurrentStep(3)
                            } else if (kycData.enterpriseUser?.companyName) {
                                setCurrentStep(1)
                            } else {
                                setCurrentStep(0)
                            }
                        }
                    }
                }

                // Force new array reference to trigger re-render
                if (kycData.enterpriseUser?.enterpriseOwners) {
                    setBeneficialOwners([...kycData.enterpriseUser.enterpriseOwners])
                    console.log('Updated beneficial owners:', kycData.enterpriseUser.enterpriseOwners)
                } else {
                    setBeneficialOwners([])
                    console.log('No beneficial owners found')
                }
            }

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

    /* Validate all required enterprise documents */
    const validateEnterpriseDocuments = (): { isValid: boolean; missingStep: number | null; missingFields: string[] } => {
        const missingFields: string[] = []
        let missingStep: number | null = null

        // Step 1: Company Documents - 8 required files
        const companyDocuments = [
            { key: 'incorporationCertificate', label: 'Certificate of Incorporation' },
            { key: 'memorandum', label: 'Memorandum or Operating Agreement' },
            { key: 'associationArticles', label: 'Articles of Association' },
            { key: 'incumbencyCertificate', label: 'Certificate of Incumbency' },
            { key: 'directorsRegister', label: 'Register of Directors' },
            { key: 'shareholdersRegister', label: 'Register of Shareholders' },
            { key: 'boardResolution', label: 'Board Resolution' },
            { key: 'addressProof', label: 'Proof of Address' },
        ]

        for (const doc of companyDocuments) {
            if (!kycPayload[doc.key as keyof KycPayload]) {
                missingFields.push(doc.label)
                if (missingStep === null) {
                    missingStep = 1 // Company Documents Form is step 1
                }
            }
        }

        // Step 2: Authorization Letter - 1 required file
        if (!kycPayload.authorizationLetter) {
            missingFields.push('Authorization Letter')
            if (missingStep === null) {
                missingStep = 2 // Authorization Letter Form is step 2
            }
        }

        return {
            isValid: missingFields.length === 0,
            missingStep,
            missingFields
        }
    }


    /* Method to add enterprise details with documents */
    const addUserEnterpriseDetails = async () => {
        try {
            // Validate all required documents first
            const validation = validateEnterpriseDocuments()

            if (!validation.isValid) {
                const missingDocs = validation.missingFields.join(', ')
                showSnackbar(
                    `Please upload all required documents: ${missingDocs}`,
                    'error'
                )

                // Navigate to the step where files are missing
                if (validation.missingStep !== null) {
                    setCurrentStep(validation.missingStep)
                }

                return { success: false, message: 'Missing required documents' }
            }

            setLoading(true)

            const formData = new FormData()

            // Prepare enterprise user payload
            const enterpriseUserPayload = {
                companyName: userDetails?.enterpriseUser?.companyName,
                companyRegNo: userDetails?.enterpriseUser?.companyRegNo,
                incorporationCountry: userDetails?.enterpriseUser?.incorporationCountry,
                companyWebsite: userDetails?.enterpriseUser?.companyWebsite,
                companyregAddress: userDetails?.enterpriseUser?.companyregAddress,
                companyregCity: userDetails?.enterpriseUser?.companyregCity,
                companyregState: userDetails?.enterpriseUser?.companyregState,
                companyregZip: userDetails?.enterpriseUser?.companyregZip,
                companyregCountry: userDetails?.enterpriseUser?.companyregCountry,
                companyOfficeAddress: userDetails?.enterpriseUser?.companyOfficeAddress,
                companyOfficeCity: userDetails?.enterpriseUser?.companyOfficeCity,
                companyOfficeState: userDetails?.enterpriseUser?.companyOfficeState,
                companyOfficeZip: userDetails?.enterpriseUser?.companyOfficeZip,
                companyOfficeCountry: userDetails?.enterpriseUser?.companyOfficeCountry,
                businessActivity: userDetails?.enterpriseUser?.businessActivity,
                accountPurpose: userDetails?.enterpriseUser?.accountPurpose,
                investmentSource: userDetails?.enterpriseUser?.investmentSource,
                revenue: userDetails?.enterpriseUser?.revenue,
                companyNetWorth: userDetails?.enterpriseUser?.companyNetWorth,
                profit: userDetails?.enterpriseUser?.profit,
                companyAssets: userDetails?.enterpriseUser?.companyAssets,
                transactionVolumes: userDetails?.enterpriseUser?.transactionVolumes,
                transactionFrequency: userDetails?.enterpriseUser?.transactionFrequency,
                bankingPartner: userDetails?.enterpriseUser?.bankingPartner,
                corporateStructure: userDetails?.enterpriseUser?.corporateStructure,
                relationWithBank: userDetails?.enterpriseUser?.relationWithBank,
                businessDescription: userDetails?.enterpriseUser?.businessDescription,
            }

            formData.append('enterpriseUser', JSON.stringify(enterpriseUserPayload))

            // Append all document files from kycPayload
            if (kycPayload.incorporationCertificate) {
                formData.append('incorporationCertificate', kycPayload.incorporationCertificate)
            }
            if (kycPayload.memorandum) {
                formData.append('memorandum', kycPayload.memorandum)
            }
            if (kycPayload.associationArticles) {
                formData.append('associationArticles', kycPayload.associationArticles)
            }
            if (kycPayload.incumbencyCertificate) {
                formData.append('incumbencyCertificate', kycPayload.incumbencyCertificate)
            }
            if (kycPayload.directorsRegister) {
                formData.append('directorsRegister', kycPayload.directorsRegister)
            }
            if (kycPayload.shareholdersRegister) {
                formData.append('shareholdersRegister', kycPayload.shareholdersRegister)
            }
            if (kycPayload.boardResolution) {
                formData.append('boardResolution', kycPayload.boardResolution)
            }
            if (kycPayload.addressProof) {
                formData.append('addressProof', kycPayload.addressProof)
            }
            if (kycPayload.wolfsbergDoc) {
                formData.append('wolfsbergDoc', kycPayload.wolfsbergDoc)
            }
            if (kycPayload.authorizationLetter) {
                formData.append('authorizationLetter', kycPayload.authorizationLetter)
            }

            formData.append('uuid', userUuid ?? '')
            formData.append('adminUser', localStorage.getItem('uuid') ?? '')

            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/addUserEnterpriseDetails`,
                formData,
                {
                    headers: {
                        Authorization: `BEARER ${localStorage.getItem('access_token')}`
                    }
                }
            )

            if (response.data?.error?.error_data === 0) {
                return { success: true, message: 'Enterprise details added successfully' }
            } else {
                return { success: false, message: response.data?.error?.error_msg || 'Failed to add enterprise details' }
            }
        } catch (error) {
            console.error('Error adding enterprise details:', error)
            if (error instanceof Error) {
                return { success: false, message: error.message }
            }
            return { success: false, message: 'An unexpected error occurred' }
        } finally {
            setLoading(false)
        }
    }


    /* Method to add/edit enterprise owner with documents */
    const addEnterpriseOwner = async (ownerData: OwnerFormData, isEdit: boolean = false) => {
        try {
            setLoading(true)
            console.log(ownerData);
            const ownerPayload = {
                firstName: sanitizeBlockedUnicode(ownerData.firstName),
                middleName: sanitizeBlockedUnicode(ownerData.middleName || ''),
                lastName: sanitizeBlockedUnicode(ownerData.lastName),
                address: sanitizeBlockedUnicode(ownerData.address),
                city: sanitizeBlockedUnicode(ownerData.city),
                state: sanitizeBlockedUnicode(ownerData.state),
                zip: sanitizeBlockedUnicode(ownerData.zip),
                country: sanitizeBlockedUnicode(ownerData.country),
                phone: sanitizeBlockedUnicode(ownerData.phone),
                email: sanitizeBlockedUnicode(ownerData.email),
                ssn: sanitizeBlockedUnicode(ownerData.ssn),
                dob: ownerData.dob,
                birthPlace: sanitizeBlockedUnicode(ownerData.birthPlace),
                ownershipPer: ownerData.ownershipPer,
                pep: ownerData.pep === 'Yes' || ownerData.pep === '1' ? 1 : 0,
                action: isEdit ? 'UPDATE' : 'INSERT',
                ownerType: ownerData.ownerType,
                ownerUuid: ownerData?.ownerUuid
            }

            const formData = new FormData()
            formData.append('owner', JSON.stringify(ownerPayload))
            formData.append('userUuid', userUuid ?? '')
            formData.append('adminUser', localStorage.getItem('uuid') ?? '')

            // Append all required document files
            if (ownerData.frontId?.[0]) {
                formData.append('idProofFront', ownerData.frontId[0])
            }
            if (ownerData.backId?.[0]) {
                formData.append('idProofBack', ownerData.backId[0])
            }
            if (ownerData.addressProof?.[0]) {
                formData.append('addressProofDoc', ownerData.addressProof[0])
            }
            if (ownerData.selfie?.[0]) {
                formData.append('selfieDoc', ownerData.selfie[0])
            }
            if (ownerData.investingFund?.[0]) {
                formData.append('investmentProofDoc', ownerData.investingFund[0])
            }

            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/addEnterpriseOwner`,
                formData,
                {
                    headers: {
                        Authorization: `BEARER ${localStorage.getItem('access_token')}`
                    }
                }
            )

            if (response.data?.error?.error_data === 0) {
                showSnackbar(isEdit ? 'Owner updated successfully!' : 'Owner added successfully!', 'success')
                //await getUserInfo() // Refresh the owner list
                return { success: true }
            } else {
                showSnackbar(response.data?.error?.error_msg || 'Failed to save owner', 'error')
                return { success: false }
            }
        } catch (error) {
            console.error('Error saving owner:', error)
            if (error instanceof Error) {
                showSnackbar(error.message, 'error')
            } else {
                showSnackbar('An unexpected error occurred', 'error')
            }
            return { success: false }
        } finally {
            setLoading(false)
        }
    }

    /* Method to delete enterprise owner */
    const deleteEnterpriseOwner = async (owner: BeneficialOwner) => {
        try {
            setLoading(true)

            const ownerPayload = {
                ownerUuid: owner.ownerUuid,
                enterpriseId: owner.enterpriseId,
                action: 'DELETE'
            }

            const formData = new FormData()
            formData.append('userUuid', userUuid ?? '')
            formData.append('owner', JSON.stringify(ownerPayload))
            formData.append('adminUser', localStorage.getItem('uuid') ?? '')

            const response = await axios.post<ApiResponse>(
                `${API_BASE_URL}/finance-hub/deleteEnterpriseOwner`,
                formData,
                {
                    headers: {
                        Authorization: `BEARER ${localStorage.getItem('access_token')}`
                    }
                }
            )

            if (response.data?.error?.error_data === 0) {
                showSnackbar('Owner deleted successfully!', 'success')
                //await getUserInfo() // Refresh the owner list
                return { success: true }
            } else {
                showSnackbar(response.data?.error?.error_msg || 'Failed to delete owner', 'error')
                return { success: false }
            }
        } catch (error) {
            console.error('Error deleting owner:', error)
            if (error instanceof Error) {
                showSnackbar(error.message, 'error')
            } else {
                showSnackbar('An unexpected error occurred', 'error')
            }
            return { success: false }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getUserInfo();
    }, [])


    // User Type Selection Component
    // User Type Selection Component
    const UserTypeSelection = () => {
        const isKycFinished = userDetails?.isKycFinished === 1
        const userDocsStatus = userDetails?.userDocsStatus

        // Determine KYC status
        const getKycStatus = () => {
            if (forceShowSelection) {
                return 'SELECT_TYPE'
            }
            if (!isKycFinished || userDocsStatus === null) {
                return 'SELECT_TYPE' // Show type selection
            }
            if (isKycFinished && userDocsStatus === '0') {
                return 'PENDING' // Verification in process
            }
            if (isKycFinished && userDocsStatus === '1') {
                return 'VERIFIED' // KYC verified
            }
            if (isKycFinished && userDocsStatus === '2') {
                return 'REJECTED' // KYC rejected
            }
            return 'SELECT_TYPE'
        }

        const kycStatus = getKycStatus()

        // Handle resubmit for rejected KYC
        const handleResubmit = () => {
            setUserTypeSelected(false)
            setUserType(null)
            setCurrentStep(0)
            setForceShowSelection(true)
        }

        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 4, sm: 6 },
                    px: { xs: 2, sm: 3 },
                    background: mode === 'light'
                        ? 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
                        : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
                }}
            >
                <Box sx={{ maxWidth: 800, width: '100%' }}>
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 700,
                                background:
                                    kycStatus === 'VERIFIED'
                                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                        : kycStatus === 'PENDING'
                                            ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                                            : kycStatus === 'REJECTED'
                                                ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                                                : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                mb: 2
                            }}
                        >
                            KYC Verification
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{ color: 'text.secondary', fontWeight: 400 }}
                        >
                            {kycStatus === 'VERIFIED'
                                ? 'Your KYC verification has been completed successfully'
                                : kycStatus === 'PENDING'
                                    ? 'Your KYC submission is under review'
                                    : kycStatus === 'REJECTED'
                                        ? 'Your KYC verification was not approved'
                                        : 'Please select your account type to begin verification'
                            }
                        </Typography>
                    </Box>

                    {/* KYC VERIFIED - Status 1 */}
                    {kycStatus === 'VERIFIED' ? (
                        <Card
                            sx={{
                                maxWidth: 500,
                                mx: 'auto',
                                p: 5,
                                borderRadius: 3,
                                border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.background.paper,
                                textAlign: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.2)} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <CheckCircleIcon
                                    sx={{
                                        fontSize: 60,
                                        color: theme.palette.success.main
                                    }}
                                />
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: theme.palette.success.main }}>
                                KYC Verified
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Your identity has been verified successfully. You now have full access to all platform features.
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ textAlign: 'left', mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Verification Details
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Account Type</Typography>
                                    <Chip
                                        label={userDetails?.userType === 2 ? 'Enterprise' : 'Individual'}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>

                                {userDetails?.firstName && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Name</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {`${userDetails.firstName} ${userDetails.middleName || ''} ${userDetails.lastName || ''}`.trim()}
                                        </Typography>
                                    </Box>
                                )}

                                {userDetails?.country && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Country</Typography>
                                        <Typography variant="body2" fontWeight={500}>{userDetails.country}</Typography>
                                    </Box>
                                )}

                                {userDetails?.enterpriseUser?.companyName && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Company</Typography>
                                        <Typography variant="body2" fontWeight={500}>{userDetails.enterpriseUser.companyName}</Typography>
                                    </Box>
                                )}
                            </Box>

                            <Alert
                                severity="success"
                                sx={{
                                    mb: 3,
                                    '& .MuiAlert-icon': {
                                        alignItems: 'center'
                                    }
                                }}
                            >
                                Your account is fully verified and active
                            </Alert>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => {
                                    if (userDetails?.userType === 2) {
                                        setUserType('enterprise')
                                    } else {
                                        setUserType('individual')
                                    }
                                    setUserTypeSelected(true)
                                    setCurrentStep(0)
                                }}
                                sx={{
                                    py: 1.5,
                                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        background: 'linear-gradient(135deg, #047857 0%, #059669 100%)'
                                    }
                                }}
                            >
                                Continue to Update
                            </Button>
                        </Card>
                    ) : kycStatus === 'PENDING' ? (
                        /* KYC PENDING - Status 0 */
                        <Card
                            sx={{
                                maxWidth: 500,
                                mx: 'auto',
                                p: 5,
                                borderRadius: 3,
                                border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                                backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.background.paper,
                                textAlign: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.2)} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <InfoIcon
                                    sx={{
                                        fontSize: 60,
                                        color: theme.palette.warning.main
                                    }}
                                />
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: theme.palette.warning.main }}>
                                KYC Under Review
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Your KYC documents have been submitted successfully and are currently under review by our team.
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ textAlign: 'left', mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Submission Details
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Status</Typography>
                                    <Chip
                                        label="Under Review"
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Account Type</Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {userDetails?.userType === 2 ? 'Enterprise' : 'Individual'}
                                    </Typography>
                                </Box>

                                {userDetails?.firstName && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">Name</Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {`${userDetails.firstName} ${userDetails.middleName || ''} ${userDetails.lastName || ''}`.trim()}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Alert
                                severity="info"
                                sx={{
                                    mb: 3,
                                    textAlign: 'left',
                                    '& .MuiAlert-icon': {
                                        alignItems: 'center'
                                    }
                                }}
                            >
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                    What happens next?
                                </Typography>
                                <Typography variant="caption">
                                    {`Our team will review your documents within 1-3 business days. You'll receive an email notification once the review is complete.`}
                                </Typography>
                            </Alert>

                            <Button
                                variant="outlined"
                                fullWidth
                                disabled
                                sx={{
                                    py: 1.5,
                                    borderColor: theme.palette.warning.main,
                                    color: theme.palette.warning.main
                                }}
                            >
                                Verification in Progress
                            </Button>
                        </Card>
                    ) : kycStatus === 'REJECTED' ? (
                        /* KYC REJECTED - Status 2 */
                        <Card
                            sx={{
                                maxWidth: 500,
                                mx: 'auto',
                                p: 5,
                                borderRadius: 3,
                                border: `2px solid ${alpha(theme.palette.error.main, 0.3)}`,
                                backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.background.paper,
                                textAlign: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.2)} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3
                                }}
                            >
                                <CloseIcon
                                    sx={{
                                        fontSize: 60,
                                        color: theme.palette.error.main
                                    }}
                                />
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: theme.palette.error.main }}>
                                KYC Rejected
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Unfortunately, your KYC verification could not be approved. Please review the reasons below and submit again.
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ textAlign: 'left', mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                    Submission Details
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Status</Typography>
                                    <Chip
                                        label="Rejected"
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">Account Type</Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                        {userDetails?.userType === 2 ? 'Enterprise' : 'Individual'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Alert
                                severity="error"
                                sx={{
                                    mb: 3,
                                    textAlign: 'left',
                                    '& .MuiAlert-icon': {
                                        alignItems: 'center'
                                    }
                                }}
                            >
                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                    Common reasons for rejection:
                                </Typography>
                                <Typography variant="caption" component="div">
                                    • Unclear or incomplete documents<br />
                                    • Information mismatch between documents<br />
                                    • Expired identification documents<br />
                                    • Poor quality photos or scans<br />
                                    • Missing required information
                                </Typography>
                            </Alert>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleResubmit}
                                sx={{
                                    py: 1.5,
                                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)'
                                    }
                                }}
                            >
                                Resubmit KYC
                            </Button>
                        </Card>
                    ) : (
                        /* SELECT TYPE - Default state */
                        <>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    gap: 3,
                                    justifyContent: 'center'
                                }}
                            >
                                {/* Individual Card */}
                                <Card
                                    onClick={() => handleUserTypeSelect('individual')}
                                    sx={{
                                        flex: 1,
                                        maxWidth: { md: 350 },
                                        p: 4,
                                        cursor: 'pointer',
                                        borderRadius: 3,
                                        border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                        backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.background.paper,
                                        transition: 'all 0.3s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            borderColor: theme.palette.primary.main,
                                            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.2)}`
                                        }
                                    }}
                                >
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mx: 'auto',
                                                mb: 3
                                            }}
                                        >
                                            <PersonIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5 }}>
                                            Individual
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            For personal accounts and individual traders
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box sx={{ textAlign: 'left' }}>
                                            <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                Personal ID verification
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                Address proof upload
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                Employment details
                                            </Typography>
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                Photo verification
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            sx={{
                                                mt: 3,
                                                py: 1.5,
                                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                                '&:hover': { transform: 'scale(1.02)' }
                                            }}
                                        >
                                            Select Individual
                                        </Button>
                                    </Box>
                                </Card>

                                {/* Enterprise Card */}
                                <Card
                                    onClick={() => handleUserTypeSelect('enterprise')}
                                    sx={{
                                        flex: 1,
                                        maxWidth: { md: 350 },
                                        p: 4,
                                        cursor: 'pointer',
                                        borderRadius: 3,
                                        border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                        backgroundColor: mode === 'light' ? '#ffffff' : theme.palette.background.paper,
                                        transition: 'all 0.3s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            borderColor: theme.palette.primary.main,
                                            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.2)}`
                                        }
                                    }}
                                >
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mx: 'auto',
                                                mb: 3
                                            }}
                                        >
                                            <BusinessIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5 }}>
                                            Enterprise
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            For businesses and corporate accounts
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box sx={{ textAlign: 'left' }}>
                                            <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                Company information
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                Business documents
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                Authorization letter
                                            </Typography>
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                                Beneficial owners
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            sx={{
                                                mt: 3,
                                                py: 1.5,
                                                background: 'linear-gradient(135deg, #dc004e 0%, #ff4081 100%)',
                                                '&:hover': { transform: 'scale(1.02)' }
                                            }}
                                        >
                                            Select Enterprise
                                        </Button>
                                    </Box>
                                </Card>
                            </Box>

                            <Box sx={{ maxWidth: { md: 724 }, mx: 'auto', width: '100%', mt: 4 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ textAlign: 'left' }}
                                >
                                    <Box component="span" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                                        Not sure which to choose?
                                    </Box>
                                    Individual accounts are for personal use, while Enterprise accounts are for registered businesses.
                                    <br />
                                    Note: If you are a merchant seeking card payment services, you must complete Enterprise KYC verification.
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        )
    }

    // ==================== STEP COMPONENTS ====================

    // Step 1: Address Form
    const AddressForm = () => {
        const {
            register,
            handleSubmit,
            control,
            setValue,
            watch,
            reset,
            formState: { errors, isValid }
        } = useForm<AddressFormData>({
            mode: 'onChange',
            defaultValues: {
                houseNo: userDetails?.address?.split(',')[0]?.trim() || '',
                streetArea: userDetails?.address?.split(',').slice(1).join(',').trim() || '',
                city: userDetails?.city || '',
                state: userDetails?.state || '',
                country: userDetails?.country || '',
                zipCode: userDetails?.zip || ''
            }
        })
        // Reset form when userDetails changes
        useEffect(() => {
            if (userDetails) {
                reset({
                    houseNo: userDetails.address?.split(',')[0]?.trim() || '',
                    streetArea: userDetails.address?.split(',').slice(1).join(',').trim() || '',
                    city: userDetails.city || '',
                    state: userDetails.state || '',
                    country: userDetails.country || '',
                    zipCode: userDetails.zip || ''
                })
            }
        }, [userDetails, reset])

        const onSubmit = async (data: AddressFormData) => {
            setLoading(true)
            try {
                const payload = {
                    ...userDetails,
                    address: `${sanitizeBlockedUnicode(data.houseNo)},${sanitizeBlockedUnicode(data.streetArea)}`,
                    city: sanitizeBlockedUnicode(data.city),
                    state: sanitizeBlockedUnicode(data.state),
                    country: sanitizeBlockedUnicode(data.country),
                    zip: sanitizeBlockedUnicode(data.zipCode),
                    uuid: userUuid ?? undefined
                }

                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/saveUserKycData?adminUser=${localStorage.getItem('uuid')}`,
                    payload,
                    {
                        headers: {
                            Authorization: `BEARER ${localStorage.getItem('access_token')}`
                        }
                    }
                )

                if (response?.data?.error?.error_data === 0) {
                    showSnackbar('Address saved successfully', 'success')
                    setUserDetails({ ...userDetails, ...payload })
                    handleNext()
                } else {
                    showSnackbar(response?.data?.error?.error_msg || 'An error occurred', 'error')
                }
            } catch (error) {
                console.error('Failed to save address', error)
                if (error instanceof Error) {
                    showSnackbar(error.message, 'error')
                } else {
                    showSnackbar('An unexpected error occurred', 'error')
                }
            } finally {
                setLoading(false)
            }
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Address (This address should match with address proof document)
                </Typography>

                {/* Row 1: House No, Street Area, Zip Code */}
                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="House no./Apt no. *"
                            placeholder="Enter House no./Apt no."
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('houseNo', {
                                required: 'This field is required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.houseNo}
                            helperText={errors.houseNo?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Street/Area *"
                            placeholder="Enter Street/Area"
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('streetArea', {
                                required: 'This field is required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.streetArea}
                            helperText={errors.streetArea?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Zip Code *"
                            placeholder="Enter Zip Code"
                            inputProps={{ maxLength: 15 }}
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('zipCode', {
                                required: 'Zip Code is required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.zipCode}
                            helperText={errors.zipCode?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                </Box>

                {/* Row 2: Country, State, City Cascading Dropdowns */}
                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <CountryStateCityFields
                        control={control}
                        setValue={setValue}
                        watch={watch}
                        errors={errors}
                        countryName="country"
                        stateName="state"
                        cityName="city"
                        textFieldStyles={textFieldStyles}
                        formFieldStyles={formFieldStyles}
                    />
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={!isValid || loading}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5,
                            '&:hover': { transform: 'translateY(-2px)' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save and Next'}
                    </Button>
                </Box>
            </Box>
        )
    }

    // Step 2: DOB Form
    const DOBForm = () => {
        const {
            register,
            handleSubmit,
            getValues,
            control,
            reset,
            formState: { errors }
        } = useForm<DOBFormData>({
            mode: 'onChange',
            defaultValues: {
                month: userDetails?.dob?.split('-')[0] || '',
                day: userDetails?.dob?.split('-')[1] || '',
                year: userDetails?.dob?.split('-')[2] || '',
                birthPlace: userDetails?.birthPlace || '',
                ssnOrPassport: userDetails?.ssn || ''
            }
        })

        const isAtLeast18 = (month: string, day: string, year: string) => {
            if (!month || !day || !year) return true
            const dob = new Date(`${year}-${month}-${day}`)
            const today = new Date()
            let age = today.getFullYear() - dob.getFullYear()
            const m = today.getMonth() - dob.getMonth()
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
            return age >= 18
        }
        useEffect(() => {
            if (userDetails) {
                reset({
                    month: userDetails.dob?.split('-')[0] || '',
                    day: userDetails.dob?.split('-')[1] || '',
                    year: userDetails.dob?.split('-')[2] || '',
                    birthPlace: userDetails.birthPlace || '',
                    ssnOrPassport: userDetails.ssn || ''
                })
            }
        }, [userDetails, reset])

        const onSubmit = async (data: DOBFormData) => {
            setLoading(true)
            try {
                const dob = `${data.month}-${data.day}-${data.year}`
                const payload = {
                    ...userDetails,
                    dob,
                    ssn: sanitizeBlockedUnicode(data.ssnOrPassport),
                    birthPlace: sanitizeBlockedUnicode(data.birthPlace),
                    uuid: userUuid ?? undefined
                }

                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/saveUserKycData?adminUser=${localStorage.getItem('uuid')}`,
                    payload,
                    {
                        headers: {
                            Authorization: `BEARER ${localStorage.getItem('access_token')}`
                        }
                    }
                )

                if (response?.data?.error?.error_data === 0) {
                    showSnackbar('DOB saved successfully', 'success')
                    setUserDetails({ ...userDetails, ...payload })
                    handleNext()
                } else {
                    showSnackbar(response?.data?.error?.error_msg || 'An error occurred', 'error')
                }
            } catch (error) {
                console.error('Failed to save DOB', error)
                if (error instanceof Error) {
                    showSnackbar(error.message, 'error')
                } else {
                    showSnackbar('An unexpected error occurred', 'error')
                }
            } finally {
                setLoading(false)
            }
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Date of Birth and SSN / Passport No / National ID
                </Typography>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Date of Birth *</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                placeholder="MM"
                                inputProps={{ maxLength: 2 }}
                                {...register('month', {
                                    required: 'Month is required',
                                    pattern: {
                                        value: /^(0[1-9]|1[0-2])$/,
                                        message: 'Invalid month'
                                    }
                                })}
                                error={!!errors.month}
                                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    e.target.value = e.target.value.replace(/[^0-9]/g, '')
                                }}
                                sx={{ ...textFieldStyles, flex: 1 }}
                            />
                            <TextField
                                placeholder="DD"
                                inputProps={{ maxLength: 2 }}
                                {...register('day', {
                                    required: 'Day is required',
                                    pattern: {
                                        value: /^(0[1-9]|[12][0-9]|3[01])$/,
                                        message: 'Invalid day'
                                    }
                                })}
                                error={!!errors.day}
                                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    e.target.value = e.target.value.replace(/[^0-9]/g, '')
                                }}
                                sx={{ ...textFieldStyles, flex: 1 }}
                            />
                            <TextField
                                placeholder="YYYY"
                                inputProps={{ maxLength: 4 }}
                                {...register('year', {
                                    required: 'Year is required',
                                    pattern: {
                                        value: /^\d{4}$/,
                                        message: 'Invalid year'
                                    },
                                    validate: {
                                        isOldEnough: (v) =>
                                            isAtLeast18(getValues('month'), getValues('day'), v) || 'Must be 18+',
                                        minYear: (v) =>
                                            parseInt(v, 10) >= 1920 || 'Invalid year'
                                    }
                                })}
                                error={!!errors.year}
                                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    e.target.value = e.target.value.replace(/[^0-9]/g, '')
                                }}
                                sx={{ ...textFieldStyles, flex: 1 }}
                            />
                        </Box>
                        <Typography variant="caption" color="error">
                            {errors.month?.message || errors.day?.message || errors.year?.message}
                        </Typography>
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Typography sx={{ mb: 1, fontWeight: 500 }}>Place of Birth *</Typography>
                        <TextField
                            fullWidth
                            placeholder="Enter place of birth"
                            onKeyDown={(e) => {
                                handleBlockedUnicodeKeyDown(e)
                                allowOnlyAlphabets(e)
                            }}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('birthPlace', {
                                required: 'Place is required',
                                pattern: {
                                    value: /^[A-Za-z\s]+$/,
                                    message: 'Only alphabets allowed'
                                },
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.birthPlace}
                            helperText={errors.birthPlace?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                </Box>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={{ flex: 1, maxWidth: { md: '50%' } }}>
                        <Typography sx={{ mb: 1, fontWeight: 500 }}>
                            SSN / Passport Number / National ID *
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="Enter last 4 digits of SSN or complete passport number"
                            inputProps={{ maxLength: 15 }}
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('ssnOrPassport', {
                                required: 'SSN or Passport is required',
                                minLength: { value: 4, message: 'Min 4 characters' },
                                maxLength: { value: 15, message: 'Max 15 characters' },
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.ssnOrPassport}
                            helperText={errors.ssnOrPassport?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ px: 4 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save and Next'}
                    </Button>
                </Box>
            </Box>
        )
    }

    // Step 3: Employment Form
    const EmploymentForm = () => {
        const {
            register,
            handleSubmit,
            control,
            reset,
            formState: { errors }
        } = useForm<EmploymentFormData>({
            mode: 'onChange',
            defaultValues: {
                industry: userDetails?.industry || '',
                occupation: userDetails?.occupation || '',
                sourceOfFunds: userDetails?.sourcesOfFunds || '',
                monthlyTransactionVolume: userDetails?.txnVolumeId || '',
                annualIncome: userDetails?.annualIncomeId || '',
                netWorth: userDetails?.netWorthId || '',
                employmentCategory: userDetails?.empCategory || '',
                employmentType: userDetails?.empType || '',
                pepStatus: String(userDetails?.pep) || '',
                bankingPartner: userDetails?.bankingPartner || '',
                bankingDuration: userDetails?.relationWithBank || '',
                purposeAccount: userDetails?.accountPurpose?.split('-')[0]?.trim() || '',
                thirdParty: String(userDetails?.thirdParty) || ''
            }
        })

        // Reset form when userDetails changes
        useEffect(() => {
            if (userDetails) {
                reset({
                    industry: userDetails.industry || '',
                    occupation: userDetails.occupation || '',
                    sourceOfFunds: userDetails.sourcesOfFunds || '',
                    monthlyTransactionVolume: userDetails.txnVolumeId || '',
                    annualIncome: userDetails.annualIncomeId || '',
                    netWorth: userDetails.netWorthId || '',
                    employmentCategory: userDetails.empCategory || '',
                    employmentType: userDetails.empType || '',
                    pepStatus: String(userDetails.pep ?? ''),
                    bankingPartner: userDetails.bankingPartner || '',
                    bankingDuration: userDetails.relationWithBank || '',
                    purposeAccount: userDetails.accountPurpose?.split('-')[0]?.trim() || '',
                    thirdParty: String(userDetails.thirdParty ?? '')
                })
            }
        }, [userDetails, reset])

        const onSubmit = async (data: EmploymentFormData) => {
            setLoading(true)
            try {
                const payload = {
                    industry: data.industry,
                    occupation: data.occupation,
                    sourcesOfFunds: data.sourceOfFunds,
                    txnVolumeId: data.monthlyTransactionVolume,
                    annualIncomeId: data.annualIncome,
                    netWorthId: data.netWorth,
                    empCategory: data.employmentCategory,
                    empType: data.employmentType,
                    pep: data.pepStatus,
                    bankingPartner: sanitizeBlockedUnicode(data.bankingPartner),
                    relationWithBank: data.bankingDuration,
                    accountPurpose: data.purposeAccount,
                    thirdParty: data.thirdParty,
                    uuid: userUuid ?? undefined
                }

                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/saveUserKycData?adminUser=${localStorage.getItem('uuid')}`,
                    payload,
                    {
                        headers: {
                            Authorization: `BEARER ${localStorage.getItem('access_token')}`
                        }
                    }
                )

                if (response?.data?.error?.error_data === 0) {
                    showSnackbar('Employment details saved', 'success')
                    setUserDetails({ ...userDetails, ...payload })
                    handleNext()
                } else {
                    showSnackbar(response?.data?.error?.error_msg || 'An error occurred', 'error')
                }
            } catch (error) {
                console.error('Failed to save employment details', error)
                if (error instanceof Error) {
                    showSnackbar(error.message, 'error')
                } else {
                    showSnackbar('An unexpected error occurred', 'error')
                }
            } finally {
                setLoading(false)
            }
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Employment and Other Details
                </Typography>

                {/* Row 1 */}
                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="industry"
                            control={control}
                            rules={{ required: 'Industry is required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Industry *"
                                    error={!!errors.industry}
                                    helperText={errors.industry?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {Industries.map((d, i) => (
                                        <MenuItem key={i} value={d}>{d}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="occupation"
                            control={control}
                            rules={{ required: 'Occupation is required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Occupation *"
                                    error={!!errors.occupation}
                                    helperText={errors.occupation?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {Occupations.map((d, i) => (
                                        <MenuItem key={i} value={d}>{d}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="sourceOfFunds"
                            control={control}
                            rules={{ required: 'Source of funds is required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Sources of Funds *"
                                    error={!!errors.sourceOfFunds}
                                    helperText={errors.sourceOfFunds?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {Funds.map((d, i) => (
                                        <MenuItem key={i} value={d}>{d}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="monthlyTransactionVolume"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Monthly Transaction Volume *"
                                    error={!!errors.monthlyTransactionVolume}
                                    helperText={errors.monthlyTransactionVolume?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {amountOptions.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                </Box>

                {/* Row 2 */}
                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="annualIncome"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Annual Income *"
                                    error={!!errors.annualIncome}
                                    helperText={errors.annualIncome?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {amountOptions.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="netWorth"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Net Worth *"
                                    error={!!errors.netWorth}
                                    helperText={errors.netWorth?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {amountOptions.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="employmentCategory"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Employment Category *"
                                    error={!!errors.employmentCategory}
                                    helperText={errors.employmentCategory?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="Employed">Employed</MenuItem>
                                    <MenuItem value="Self Employed">Self Employed</MenuItem>
                                    <MenuItem value="Business Owner">Business Owner</MenuItem>
                                    <MenuItem value="Retired">Retired</MenuItem>
                                    <MenuItem value="Student">Student</MenuItem>
                                    <MenuItem value="Unemployed">Unemployed</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="employmentType"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Employment Type *"
                                    error={!!errors.employmentType}
                                    helperText={errors.employmentType?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="Full Time">Full Time</MenuItem>
                                    <MenuItem value="Part Time">Part Time</MenuItem>
                                    <MenuItem value="Contract">Contract</MenuItem>
                                    <MenuItem value="Freelance">Freelance</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                </Box>

                {/* Row 3 */}
                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="pepStatus"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Are you a PEP? *"
                                    error={!!errors.pepStatus}
                                    helperText={errors.pepStatus?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="1">Yes</MenuItem>
                                    <MenuItem value="0">No</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Banking Partner *"
                            placeholder="Your banking partner"
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('bankingPartner', {
                                required: 'Required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.bankingPartner}
                            helperText={errors.bankingPartner?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="bankingDuration"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Banking Relationship Duration *"
                                    error={!!errors.bankingDuration}
                                    helperText={errors.bankingDuration?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="0-1 year">0-1 year</MenuItem>
                                    <MenuItem value="1-2 year">1-2 years</MenuItem>
                                    <MenuItem value="2+ years">2+ years</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="purposeAccount"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Purpose of Account *"
                                    error={!!errors.purposeAccount}
                                    helperText={errors.purposeAccount?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="Day Trading">Day Trading</MenuItem>
                                    <MenuItem value="Investing">Investing</MenuItem>
                                    <MenuItem value="Cross-border payments">Cross-border payments</MenuItem>
                                    <MenuItem value="Domestic payments">Domestic payments</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                </Box>

                {/* Row 4 */}
                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={{ flex: 1, maxWidth: { md: '25%' } }}>
                        <Controller
                            name="thirdParty"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Acting on behalf of third party? *"
                                    error={!!errors.thirdParty}
                                    helperText={errors.thirdParty?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="1">Yes</MenuItem>
                                    <MenuItem value="0">No</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ px: 4 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Save and Next'}
                    </Button>
                </Box>
            </Box>
        )
    }

    // Step 4: Address Proof
    const AddressProofForm = () => {
        const {
            handleSubmit,
            setValue,
            trigger,
            watch,
            formState: { errors, isValid }
        } = useForm<AddressProofFormData>({ mode: 'onChange' })

        // Watch the file to display selected filename
        const addressProofFile = watch('addressProof')

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                setValue('addressProof', files, { shouldValidate: true })
            }
        }

        // Register validation manually
        useEffect(() => {
            // Register the field with validation
            trigger('addressProof')
        }, [])

        const onSubmit = async (data: AddressProofFormData) => {
            setKycPayload({ ...kycPayload, addressProof: data.addressProof[0] })
            handleNext()
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Document Upload - Address Proof
                </Typography>

                <Box sx={{ ...formRowStyles }}>
                    <Box sx={{ flex: 1, maxWidth: { md: '50%' } }}>
                        <Card
                            sx={{
                                p: 3,
                                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                }
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <CloudUploadIcon
                                    sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
                                />
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Address Proof *
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Utility Bill or Bank Account Statement from the last 3 months
                                </Typography>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.jfif,.heic"
                                    style={{ display: 'none' }}
                                    id="addressProof"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="addressProof">
                                    <Button variant="outlined" component="span">
                                        Choose File
                                    </Button>
                                </label>

                                {/* Show selected filename */}
                                {addressProofFile?.[0] && (
                                    <Typography
                                        variant="body2"
                                        color="success.main"
                                        sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                                    >
                                        ✓ {addressProofFile[0].name}
                                    </Typography>
                                )}

                                {errors.addressProof && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ display: 'block', mt: 1 }}
                                    >
                                        {errors.addressProof.message as string}
                                    </Typography>
                                )}
                            </Box>
                        </Card>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: 'block' }}
                        >
                            * Please add .JPG, .PDF, .PNG, .JPEG, .DOC, .DOCX, .JFIF, or .HEIC file. MAX limit 6 MB.
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ px: 4 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={!addressProofFile?.[0]}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>
        )
    }

    // Step 5: ID Document
    const IDDocumentForm = () => {
        const {
            handleSubmit,
            setValue,
            watch,
            formState: { errors }
        } = useForm<IDDocumentFormData>({ mode: 'onChange' })

        // Watch files to display selected filenames
        const idProofFrontFile = watch('idProofFront')
        const idProofBackFile = watch('idProofBack')

        const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                setValue('idProofFront', files, { shouldValidate: true })
            }
        }

        const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                setValue('idProofBack', files, { shouldValidate: true })
            }
        }

        const onSubmit = async (data: IDDocumentFormData) => {
            setKycPayload({
                ...kycPayload,
                idProofFront: data.idProofFront[0],
                idProofBack: data.idProofBack?.[0]
            })
            handleNext()
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Document Upload - ID Proof
                </Typography>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Card
                            sx={{
                                p: 3,
                                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02)
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <CloudUploadIcon
                                    sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
                                />
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    ID Proof Front *
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {`Government-issued ID (Driver's license, Identity Card)`}
                                </Typography>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    style={{ display: 'none' }}
                                    id="idProofFront"
                                    onChange={handleFrontFileChange}
                                />
                                <label htmlFor="idProofFront">
                                    <Button variant="outlined" component="span">
                                        Choose File
                                    </Button>
                                </label>

                                {/* Show selected filename */}
                                {idProofFrontFile?.[0] && (
                                    <Typography
                                        variant="body2"
                                        color="success.main"
                                        sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                                    >
                                        ✓ {idProofFrontFile[0].name}
                                    </Typography>
                                )}

                                {errors.idProofFront && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ display: 'block', mt: 1 }}
                                    >
                                        {errors.idProofFront.message as string}
                                    </Typography>
                                )}
                            </Box>
                        </Card>
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Card
                            sx={{
                                p: 3,
                                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02)
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <CloudUploadIcon
                                    sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
                                />
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    ID Proof Back
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Back side of your ID document
                                </Typography>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                    style={{ display: 'none' }}
                                    id="idProofBack"
                                    onChange={handleBackFileChange}
                                />
                                <label htmlFor="idProofBack">
                                    <Button variant="outlined" component="span">
                                        Choose File
                                    </Button>
                                </label>

                                {/* Show selected filename */}
                                {idProofBackFile?.[0] && (
                                    <Typography
                                        variant="body2"
                                        color="success.main"
                                        sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                                    >
                                        ✓ {idProofBackFile[0].name}
                                    </Typography>
                                )}

                                {errors.idProofBack && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ display: 'block', mt: 1 }}
                                    >
                                        {errors.idProofBack.message as string}
                                    </Typography>
                                )}
                            </Box>
                        </Card>
                    </Box>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    * Only PNG or JPEG files allowed for ID Front. MAX limit 6 MB.
                </Typography>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ px: 4 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={!idProofFrontFile?.[0]}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>
        )
    }

    // Step 6: Photo Verification
    const PhotoVerificationForm = () => {
        const {
            register,
            handleSubmit,
            setValue,
            watch,
            formState: { errors }
        } = useForm<PhotoVerificationFormData>({ mode: 'onChange' })

        const userCountry = userDetails?.country

        // Watch files
        const userPhotoFile = watch('userPhoto')
        const panCardPhotoFile = watch('panCardPhoto')

        // Webcam states
        const webcamRef = useRef<Webcam>(null)
        const canvasRef = useRef<HTMLCanvasElement>(null)
        const [showWebcam, setShowWebcam] = useState(false)
        const [faceDetected, setFaceDetected] = useState(true)
        const [lastDetectedTime, setLastDetectedTime] = useState(Date.now())
        const [modelsLoaded, setModelsLoaded] = useState(false)

        // QR Code states
        const [showQR, setShowQR] = useState(false)
        const [qrCount, setQrCount] = useState(300)
        const [twoFactorAuthKey, setTwoFactorAuthKey] = useState('')

        // Load face detection models
        const loadModels = async (): Promise<void> => {
            try {
                const MODEL_URL = '/models'
                if (window.faceapi) {
                    await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
                    await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
                    setModelsLoaded(true)
                } else {
                    console.error('face-api.js not loaded')
                }
            } catch (error) {
                console.error('Error loading face detection models:', error)
            }
        }

        // Face detection function
        const detectFace = useCallback(async (): Promise<void> => {
            if (
                webcamRef.current?.video &&
                webcamRef.current.video.readyState === 4 &&
                modelsLoaded &&
                window.faceapi
            ) {
                try {
                    const video = webcamRef.current.video
                    const detectionResult = await window.faceapi
                        .detectAllFaces(
                            video,
                            new window.faceapi.TinyFaceDetectorOptions()
                        )
                        .withFaceLandmarks()

                    const detections: FaceDetectionWithLandmarks[] = detectionResult

                    const canvas = canvasRef.current
                    if (canvas) {
                        canvas.width = video.videoWidth
                        canvas.height = video.videoHeight
                        const displaySize: DisplaySize = {
                            width: video.videoWidth,
                            height: video.videoHeight,
                        }
                        window.faceapi.matchDimensions(canvas, displaySize)
                        const resizedDetections = window.faceapi.resizeResults(
                            detections,
                            displaySize
                        )
                        const ctx = canvas.getContext('2d')
                        if (ctx) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height)
                        }
                        window.faceapi.draw.drawDetections(canvas, resizedDetections)
                        window.faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
                    }

                    if (detections.length > 0) {
                        setFaceDetected(true)
                        setLastDetectedTime(Date.now())
                    } else {
                        const timeSinceLastDetection = Date.now() - lastDetectedTime
                        if (timeSinceLastDetection > 2000) {
                            setFaceDetected(false)
                        }
                    }
                } catch (error) {
                    console.error('Error detecting face:', error)
                }
            }
        }, [lastDetectedTime, modelsLoaded])

        // Load models and start face detection when webcam opens
        useEffect(() => {
            if (showWebcam && !modelsLoaded) {
                loadModels()
            }
        }, [showWebcam, modelsLoaded])

        useEffect(() => {
            let interval: NodeJS.Timeout | undefined
            if (showWebcam && modelsLoaded) {
                interval = setInterval(detectFace, 300)
            }
            return () => {
                if (interval) clearInterval(interval)
            }
        }, [detectFace, showWebcam, modelsLoaded])

        // QR Code countdown timer
        useEffect(() => {
            if (showQR) {
                if (qrCount > 0) {
                    const timer = setInterval(() => {
                        setQrCount((prevCount) => prevCount - 1)
                    }, 1000)
                    return () => clearInterval(timer)
                }
            }
        }, [qrCount, showQR])

        // Poll for user photo when QR modal is open
        useEffect(() => {
            let interval: NodeJS.Timeout | undefined

            if (showQR) {
                interval = setInterval(getUserPhotoFromApi, 1000)
            }

            return () => {
                if (interval) clearInterval(interval)
            }
        }, [showQR])

        // Utility: Convert data URI to Blob
        const dataURItoBlob = (dataURI: string): Blob => {
            let byteString: string
            if (dataURI.split(',')[0].indexOf('base64') >= 0) {
                byteString = atob(dataURI.split(',')[1])
            } else {
                byteString = unescape(dataURI.split(',')[1])
            }
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
            const ia = new Uint8Array(byteString.length)
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i)
            }
            return new Blob([ia], { type: mimeString })
        }

        // Utility: Convert Image URL to base64
        const getBase64Image = (url: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.onload = function () {
                    const reader = new FileReader()
                    reader.onloadend = function () {
                        resolve(reader.result as string)
                    }
                    reader.onerror = reject
                    reader.readAsDataURL(xhr.response)
                }
                xhr.onerror = reject
                xhr.open('GET', url)
                xhr.responseType = 'blob'
                xhr.send()
            })
        }

        // Generate QR Code
        const generateQr = async (): Promise<void> => {
            try {
                const tokenRes = await axios.get<ScannerTokenResponse>(
                    `${API_BASE_URL}/finance-hub/getScannerToken?adminUser=${localStorage.getItem('uuid')}&uuid=${userUuid}`,
                    {
                        headers: {
                            Authorization: `BEARER ${localStorage.getItem('access_token')}`
                        }
                    }
                )

                if (tokenRes.data.error?.error_data !== 0) {
                    showSnackbar(tokenRes.data.error?.error_msg || 'Failed to generate QR code', 'error')
                } else {
                    setQrCount(300)
                    const token = tokenRes.data.token
                    const encodedKey = `${window.location.origin}/kyc/capture-photo/${btoa(userUuid || '')}/${btoa(token || '')}`
                    setTwoFactorAuthKey(encodedKey)
                    //console.log('Encoded URL => ',encodedKey);
                    setShowQR(true)
                }
            } catch (err) {
                console.error('Error generating QR:', err)
                showSnackbar('Something went wrong while generating QR code', 'error')
            }
        }

        // Get user photo from API (polling)
        const getUserPhotoFromApi = async (): Promise<void> => {
            const imageUrl = `${API_BASE_URL}/finance-hub/${userUuid}/${userDetails?.country}/file/user_photo.png?access_token=${localStorage.getItem('access_token')}`

            try {
                const base64Data = await getBase64Image(imageUrl)
                const cleanedBase64 = base64Data.replace(
                    'data:application/octet-stream;base64,',
                    ''
                )

                if (!cleanedBase64) {
                    return
                }

                setCapturedImage(base64Data)
                setShowQR(false)
                setValue('userPhoto', undefined)
            } catch (error) {
                console.error('Error fetching user photo:', error)
            }
        }

        // Close QR Modal
        const handleCloseQRModal = (): void => {
            setShowQR(false)
            setQrCount(300)
        }

        // Format countdown time
        const formatTime = (seconds: number): string => {
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            return `${mins}:${secs.toString().padStart(2, '0')}`
        }

        // Capture photo from webcam
        const capturePhoto = (): void => {
            if (webcamRef.current) {
                const imageSrc = webcamRef.current.getScreenshot()
                if (imageSrc) {
                    setCapturedImage(imageSrc)
                    setShowWebcam(false)
                }
            }
        }

        const handleUserPhotoChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
            const files = e.target.files
            if (files && files.length > 0) {
                setValue('userPhoto', files, { shouldValidate: true })
                setCapturedImage(null)
            }
        }

        const handlePanCardPhotoChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
            const files = e.target.files
            if (files && files.length > 0) {
                setValue('panCardPhoto', files, { shouldValidate: true })
            }
        }

        const onSubmit = async (data: PhotoVerificationFormData): Promise<void> => {
            setLoading(true)
            console.log('userDetails', userDetails)
            try {
                //const user = { ...userDetails, userDocsStatus: '0' }
                const user = {
                    firstName: userDetails?.firstName,
                    middleName: userDetails?.middleName,
                    lastName: userDetails?.lastName,
                    pep: userDetails?.pep,
                    thirdParty: userDetails?.thirdParty,
                    bankingPartner: userDetails?.bankingPartner,
                    accountPurpose: userDetails?.accountPurpose,
                    address: userDetails?.address,
                    annualIncomeId: userDetails?.annualIncomeId,
                    birthPlace: userDetails?.birthPlace,
                    city: userDetails?.city,
                    country: userDetails?.country,
                    dob: userDetails?.dob,
                    empCategory: userDetails?.empCategory,
                    empType: userDetails?.empType,
                    industry: userDetails?.industry,
                    netWorthId: userDetails?.netWorthId,
                    panNo: userDetails?.panNo,
                    relationWithBank: userDetails?.relationWithBank,
                    sourcesOfFunds: userDetails?.sourcesOfFunds,
                    ssn: userDetails?.ssn,
                    state: userDetails?.state,
                    txnVolumeId: userDetails?.txnVolumeId,
                    uuid: userDetails?.uuid,
                    zip: userDetails?.zip,
                    occupation: userDetails?.occupation,
                    userDocsStatus: '0'
                };

                const formData = new FormData()

                if (capturedImage) {
                    const blob = dataURItoBlob(capturedImage)
                    formData.append('userPhoto', blob, 'userPhoto.png')
                } else if (data.userPhoto?.[0]) {
                    formData.append('userPhoto', data.userPhoto[0])
                }

                if ((userCountry === 'India' || userCountry === 'IN') && data.panCardPhoto?.[0]) {
                    formData.append('panFront', data.panCardPhoto[0])
                    user.panNo = data.panNumber
                }

                if (kycPayload.addressProof) {
                    formData.append('addressProof', kycPayload.addressProof)
                }
                if (kycPayload.idProofFront) {
                    formData.append('idProofFront', kycPayload.idProofFront)
                }
                if (kycPayload.idProofBack) {
                    formData.append('idProofBack', kycPayload.idProofBack)
                }
                formData.append('adminUser', localStorage.getItem('uuid') ?? '');
                //formData.append('uuid', userUuid ?? '');
                console.log('USER JSON', JSON.stringify(user));
                formData.append('user', JSON.stringify(user))

                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/addUserKYCDetails`,
                    formData,
                    {
                        headers: {
                            Authorization: `BEARER ${localStorage.getItem('access_token')}`
                        }
                    }
                )

                if (response?.data?.error?.error_data === 0) {
                    await axios.post<ApiResponse>(
                        `${API_BASE_URL}/finance-hub/finishKyc?adminUser=${localStorage.getItem('uuid')}&uuid=${userUuid}`,
                        {},
                        {
                            headers: {
                                Authorization: `BEARER ${localStorage.getItem('access_token')}`
                            }
                        }
                    )
                    showSnackbar('KYC submitted successfully!', 'success')
                    onKycComplete?.()
                    setTimeout(() => {
                        location.reload();
                    }, 3000)
                } else {
                    showSnackbar(response?.data?.error?.error_msg || 'An error occurred', 'error')
                }
            } catch (error) {
                console.error('Failed to submit KYC', error)
                if (error instanceof Error) {
                    showSnackbar(error.message, 'error')
                } else {
                    showSnackbar('An unexpected error occurred', 'error')
                }
            } finally {
                setLoading(false)
            }
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Photo Verification
                </Typography>

                {(userCountry === 'India' || userCountry === 'IN') && (
                    <Box sx={{ ...formRowStyles, mb: 3 }}>
                        <Box sx={formFieldStyles}>
                            <TextField
                                fullWidth
                                label="PAN Number *"
                                placeholder="Enter PAN Number"
                                inputProps={{ maxLength: 10 }}
                                onKeyDown={handleBlockedUnicodeKeyDown}
                                onPaste={handleBlockedUnicodePaste}
                                {...register('panNumber', {
                                    required: 'PAN Number is required',
                                    pattern: {
                                        value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                                        message: 'Invalid PAN format'
                                    }
                                })}
                                error={!!errors.panNumber}
                                helperText={errors.panNumber?.message as string}
                                sx={textFieldStyles}
                            />
                        </Box>
                        <Box sx={formFieldStyles}>
                            <Card
                                sx={{
                                    p: 3,
                                    border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                                }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                        PAN Card Photo *
                                    </Typography>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        style={{ display: 'none' }}
                                        id="panCardPhoto"
                                        onChange={handlePanCardPhotoChange}
                                    />
                                    <label htmlFor="panCardPhoto">
                                        <Button variant="outlined" component="span">
                                            Choose File
                                        </Button>
                                    </label>

                                    {panCardPhotoFile?.[0] && (
                                        <Typography
                                            variant="body2"
                                            color="success.main"
                                            sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                                        >
                                            ✓ {panCardPhotoFile[0].name}
                                        </Typography>
                                    )}
                                </Box>
                            </Card>
                        </Box>
                    </Box>
                )}

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    {/* Upload Photo Card */}
                    <Box sx={formFieldStyles}>
                        <Card
                            sx={{
                                p: 3,
                                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                }
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <CameraAltIcon
                                    sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
                                />
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Upload Photo *
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Upload a clear photo of yourself holding your ID
                                </Typography>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    style={{ display: 'none' }}
                                    id="userPhoto"
                                    onChange={handleUserPhotoChange}
                                />
                                <label htmlFor="userPhoto">
                                    <Button variant="outlined" component="span">
                                        Choose File
                                    </Button>
                                </label>

                                {userPhotoFile?.[0] && (
                                    <Typography
                                        variant="body2"
                                        color="success.main"
                                        sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                                    >
                                        ✓ {userPhotoFile[0].name}
                                    </Typography>
                                )}
                            </Box>
                        </Card>
                    </Box>

                    {/* Captured/Webcam Photo Card */}
                    <Box sx={formFieldStyles}>
                        {capturedImage ? (
                            <Card
                                sx={{
                                    p: 2,
                                    border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                    backgroundColor: alpha(theme.palette.success.main, 0.02)
                                }}
                            >
                                <Box sx={{ position: 'relative' }}>
                                    <img
                                        src={capturedImage}
                                        alt="Captured"
                                        style={{
                                            width: '100%',
                                            borderRadius: 8,
                                            maxHeight: 250,
                                            objectFit: 'cover'
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            backgroundColor: theme.palette.success.main,
                                            borderRadius: '50%',
                                            p: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <CheckCircleIcon sx={{ color: '#fff', fontSize: 20 }} />
                                    </Box>
                                </Box>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    sx={{ mt: 2 }}
                                    onClick={() => setCapturedImage(null)}
                                    startIcon={<DeleteIcon />}
                                >
                                    Remove Photo
                                </Button>
                            </Card>
                        ) : (
                            <Card
                                sx={{
                                    p: 3,
                                    border: `2px dashed ${alpha(theme.palette.secondary.main, 0.3)}`,
                                    backgroundColor: alpha(theme.palette.secondary.main, 0.02),
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        borderColor: theme.palette.secondary.main,
                                        backgroundColor: alpha(theme.palette.secondary.main, 0.05)
                                    }
                                }}
                            >
                                <Box sx={{ textAlign: 'center' }}>
                                    <CameraAltIcon
                                        sx={{ fontSize: 48, color: theme.palette.secondary.main, mb: 2 }}
                                    />
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        OR Capture Photo
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Use your webcam or mobile device
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setShowWebcam(true)
                                                setValue('userPhoto', undefined)
                                            }}
                                            startIcon={<CameraAltIcon />}
                                            sx={{
                                                borderColor: theme.palette.primary.main,
                                                color: theme.palette.primary.main,
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                                }
                                            }}
                                        >
                                            Webcam
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={generateQr}
                                            startIcon={
                                                <Box
                                                    component="svg"
                                                    viewBox="0 0 24 24"
                                                    sx={{ width: 20, height: 20, fill: 'currentColor' }}
                                                >
                                                    <path d="M3 11h2v2H3v-2zm8-6h2v4h-2V5zm-2 6h4v4h-2v-2H9v-2zm6 0h2v2h2v-2h2v2h-2v2h2v4h-2v2h-2v-2h-4v2h-2v-4h4v-2h2v-2h-2v-2zm4 8v-4h-2v4h2zm-8 2h2v2h-2v-2zm-4 0h2v2H7v-2zm-4 0h2v2H3v-2zM3 3v6h6V3H3zm4 4H5V5h2v2zm-4 8v6h6v-6H3zm4 4H5v-2h2v2zm8-16v6h6V3h-6zm4 4h-2V5h2v2z" />
                                                </Box>
                                            }
                                            sx={{
                                                borderColor: theme.palette.secondary.main,
                                                color: theme.palette.secondary.main,
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.secondary.main, 0.1)
                                                }
                                            }}
                                        >
                                            Scan QR
                                        </Button>
                                    </Box>
                                </Box>
                            </Card>
                        )}
                    </Box>
                </Box>

                <Card sx={{ p: 2, backgroundColor: alpha(theme.palette.warning.main, 0.1), mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <InfoIcon sx={{ color: theme.palette.warning.main }} />
                        <Box>
                            <Typography variant="body2" fontWeight={600}>
                                Photo Requirements
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {`Please upload a photo without wearing any hats, masks, or glasses,
                            holding your ID Proof and a sheet of paper with the text -
                            'Only for trading cryptocurrencies'. Ensure all documents are clearly
                            visible. PNG or JPEG only, MAX 6 MB.`}
                            </Typography>
                        </Box>
                    </Box>
                </Card>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ px: 4 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading || (!userPhotoFile?.[0] && !capturedImage)}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit KYC'}
                    </Button>
                </Box>

                {/* Webcam Modal */}
                <Dialog
                    open={showWebcam}
                    onClose={() => setShowWebcam(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Capture Your Photo
                        <IconButton
                            onClick={() => setShowWebcam(false)}
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ position: 'relative', width: '100%' }}>
                            {capturedImage ? (
                                <Box>
                                    <img
                                        src={capturedImage}
                                        alt="Captured"
                                        style={{ width: '100%', borderRadius: 8 }}
                                    />
                                    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setCapturedImage(null)}
                                        >
                                            Take Another
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={() => setShowWebcam(false)}
                                            sx={{
                                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                                            }}
                                        >
                                            Use This Photo
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Box>
                                    <Box sx={{ position: 'relative' }}>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/png"
                                            videoConstraints={{ facingMode: 'user' }}
                                            style={{ width: '100%', borderRadius: 8 }}
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                            }}
                                        />
                                    </Box>

                                    {!faceDetected && (
                                        <Alert
                                            severity="warning"
                                            sx={{ mt: 2 }}
                                        >
                                            No face detected. Please adjust your position.
                                        </Alert>
                                    )}

                                    {faceDetected && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={capturePhoto}
                                            sx={{
                                                mt: 2,
                                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                                            }}
                                        >
                                            Snap Photo
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                </Dialog>

                {/* QR Code Modal */}
                <Dialog
                    open={showQR}
                    onClose={handleCloseQRModal}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            overflow: 'hidden'
                        }
                    }}
                >
                    <DialogTitle
                        sx={{
                            textAlign: 'center',
                            background: mode === 'dark'
                                ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
                                : 'linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <Box
                                component="svg"
                                viewBox="0 0 24 24"
                                sx={{ width: 24, height: 24, fill: theme.palette.primary.main }}
                            >
                                <path d="M3 11h2v2H3v-2zm8-6h2v4h-2V5zm-2 6h4v4h-2v-2H9v-2zm6 0h2v2h2v-2h2v2h-2v2h2v4h-2v2h-2v-2h-4v2h-2v-4h4v-2h2v-2h-2v-2zm4 8v-4h-2v4h2zm-8 2h2v2h-2v-2zm-4 0h2v2H7v-2zm-4 0h2v2H3v-2zM3 3v6h6V3H3zm4 4H5V5h2v2zm-4 8v6h6v-6H3zm4 4H5v-2h2v2zm8-16v6h6V3h-6zm4 4h-2V5h2v2z" />
                            </Box>
                            <Typography variant="h6" fontWeight={600}>
                                Scan QR Code
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={handleCloseQRModal}
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 4, pb: 3 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 3
                            }}
                        >
                            {/* QR Code Container */}
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    background: mode === 'dark'
                                        ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                        : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.04) 100%)',
                                    border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                    boxShadow: mode === 'dark'
                                        ? '0 8px 32px rgba(0,0,0,0.3)'
                                        : '0 8px 32px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 2,
                                        backgroundColor: '#ffffff',
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <QRCode
                                        value={twoFactorAuthKey}
                                        size={200}
                                        level="H"
                                        style={{
                                            height: 'auto',
                                            maxWidth: '100%',
                                            width: '100%'
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Timer Section */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    width: '100%'
                                }}
                            >
                                {/* Timer Display */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        p: 1.5,
                                        px: 2.5,
                                        borderRadius: 2,
                                        background: qrCount <= 60
                                            ? mode === 'dark'
                                                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)'
                                                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
                                            : mode === 'dark'
                                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%)'
                                                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 64, 175, 0.1) 100%)',
                                        border: `1px solid ${qrCount <= 60
                                            ? alpha(theme.palette.error.main, 0.3)
                                            : alpha(theme.palette.primary.main, 0.3)
                                            }`
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            backgroundColor: qrCount <= 60
                                                ? theme.palette.error.main
                                                : theme.palette.primary.main,
                                            animation: qrCount > 0 ? 'pulse 1.5s ease-in-out infinite' : 'none',
                                            '@keyframes pulse': {
                                                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                                                '50%': { opacity: 0.5, transform: 'scale(0.8)' }
                                            }
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 600,
                                            color: qrCount <= 60
                                                ? theme.palette.error.main
                                                : mode === 'dark' ? theme.palette.info.main : theme.palette.primary.main,
                                            fontFamily: 'monospace',
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        {qrCount > 0 ? formatTime(qrCount) : 'Expired'}
                                    </Typography>
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ textAlign: 'center' }}
                                >
                                    {qrCount > 0
                                        ? 'Scan this QR code with your mobile device'
                                        : 'QR code has expired'
                                    }
                                </Typography>

                                {/* Regenerate Button */}
                                {qrCount === 0 && (
                                    <Button
                                        variant="contained"
                                        onClick={generateQr}
                                        sx={{
                                            mt: 1,
                                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                            '&:hover': {
                                                transform: 'scale(1.02)',
                                                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                                            }
                                        }}
                                    >
                                        Generate New QR Code
                                    </Button>
                                )}
                            </Box>

                            {/* Instructions */}
                            <Box
                                sx={{
                                    width: '100%',
                                    p: 2,
                                    borderRadius: 2,
                                    background: alpha(theme.palette.info.main, 0.08),
                                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                    <InfoIcon sx={{ color: theme.palette.info.main, fontSize: 20, mt: 0.25 }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                            How to use
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            1. Open camera on your mobile device<br />
                                            2. Scan this QR code<br />
                                            3. Take a photo holding your ID<br />
                                            4. Photo will be uploaded automatically
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>
            </Box>
        )
    }

    // ==================== ENTERPRISE STEPS ====================

    // Company Information Form
    const CompanyInformationForm = () => {
        const {
            register,
            handleSubmit,
            watch,
            control,
            setValue,
            reset,
            formState: { errors }
        } = useForm<CompanyInfoFormData>({
            mode: 'onChange',
            defaultValues: {
                companyName: '',
                companyRegNo: '',
                companyWebsite: '',
                incorporationCountry: '',
                corporateStructure: '',
                businessActivity: '',
                companyregAddress: '',
                companyregCity: '',
                companyregState: '',
                companyregCountry: '',
                companyregZip: '',
                companyOfficeAddress: '',
                companyOfficeCity: '',
                companyOfficeState: '',
                companyOfficeCountry: '',
                companyOfficeZip: '',
                revenue: '',
                companyNetWorth : '',
                profit: '',
                companyAssets: '',
                businessDescription: '',
                // Add missing defaults
                accountPurpose: '',
                investmentSource: '',
                transactionVolumes: '',
                transactionFrequency: '',
                bankingPartner: '',
                relationWithBank: ''
            }
        })

        const [sameAddress, setSameAddress] = useState(false);

        useEffect(() => {
            if (userDetails?.enterpriseUser) {
                const eu = userDetails.enterpriseUser
                reset({
                    companyName: eu.companyName || '',
                    companyRegNo: eu.companyRegNo || '',
                    companyWebsite: eu.companyWebsite || '',
                    incorporationCountry: eu.incorporationCountry || '',
                    corporateStructure: eu.corporateStructure || '',
                    businessActivity: eu.businessActivity || '',
                    companyregAddress: eu.companyregAddress || '',
                    companyregCity: eu.companyregCity || '',
                    companyregState: eu.companyregState || '',
                    companyregCountry: eu.companyregCountry || '',
                    companyregZip: eu.companyregZip || '',
                    companyOfficeAddress: eu.companyOfficeAddress || '',
                    companyOfficeCity: eu.companyOfficeCity || '',
                    companyOfficeState: eu.companyOfficeState || '',
                    companyOfficeCountry: eu.companyOfficeCountry || '',
                    companyOfficeZip: eu.companyOfficeZip || '',
                    revenue: eu.revenue || '',
                    companyNetWorth: eu.companyNetWorth || '',
                    profit: eu.profit || '',
                    companyAssets: eu.companyAssets || '',
                    businessDescription: eu.businessDescription || '',
                    // Add missing resets
                    accountPurpose: eu.accountPurpose || '',
                    investmentSource: eu.investmentSource || '',
                    transactionVolumes: eu.transactionVolumes || '',
                    transactionFrequency: eu.transactionFrequency || '',
                    bankingPartner: eu.bankingPartner || '',
                    relationWithBank: eu.relationWithBank || ''
                })
            }
        }, [userDetails, reset])


        const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setSameAddress(e.target.checked)
            if (e.target.checked) {
                setValue('companyOfficeAddress', watch('companyregAddress'), { shouldValidate: true })
                setValue('companyOfficeCity', watch('companyregCity'), { shouldValidate: true })
                setValue('companyOfficeState', watch('companyregState'), { shouldValidate: true })
                setValue('companyOfficeCountry', watch('companyregCountry'), { shouldValidate: true })
                setValue('companyOfficeZip', watch('companyregZip'), { shouldValidate: true })
            }
        }

        const onSubmit = async (data: CompanyInfoFormData) => {
            setLoading(true)
            try {
                const sanitizedData: CompanyInfoFormData = {
                    ...data,
                    companyName: sanitizeBlockedUnicode(data.companyName),
                    companyRegNo: sanitizeBlockedUnicode(data.companyRegNo),
                    companyWebsite: sanitizeBlockedUnicode(data.companyWebsite),
                    incorporationCountry: sanitizeBlockedUnicode(data.incorporationCountry),
                    companyregAddress: sanitizeBlockedUnicode(data.companyregAddress),
                    companyregCity: sanitizeBlockedUnicode(data.companyregCity),
                    companyregState: sanitizeBlockedUnicode(data.companyregState),
                    companyregCountry: sanitizeBlockedUnicode(data.companyregCountry),
                    companyregZip: sanitizeBlockedUnicode(data.companyregZip),
                    companyOfficeAddress: sanitizeBlockedUnicode(data.companyOfficeAddress),
                    companyOfficeCity: sanitizeBlockedUnicode(data.companyOfficeCity),
                    companyOfficeState: sanitizeBlockedUnicode(data.companyOfficeState),
                    companyOfficeCountry: sanitizeBlockedUnicode(data.companyOfficeCountry),
                    companyOfficeZip: sanitizeBlockedUnicode(data.companyOfficeZip),
                    businessActivity: sanitizeBlockedUnicode(data.businessActivity),
                    revenue: sanitizeBlockedUnicode(data.revenue),
                    companyNetWorth: sanitizeBlockedUnicode(data.companyNetWorth),
                    profit: sanitizeBlockedUnicode(data.profit),
                    companyAssets: sanitizeBlockedUnicode(data.companyAssets),
                    bankingPartner: sanitizeBlockedUnicode(data.bankingPartner),
                    relationWithBank: sanitizeBlockedUnicode(data.relationWithBank),
                    businessDescription: sanitizeBlockedUnicode(data.businessDescription),
                }

                const response = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/saveEnterpriseUserInfo?adminUser=${localStorage.getItem('uuid')}&uuid=${userUuid}`,
                    sanitizedData,
                    {
                        headers: {
                            Authorization: `BEARER ${localStorage.getItem('access_token')}`
                        }
                    }
                )

                if (response.data?.error?.error_data === 0) {
                    showSnackbar('Company information saved', 'success')
                    handleNext()
                } else {
                    showSnackbar(response.data?.error?.error_msg || 'An error occurred', 'error')
                }
            } catch (error) {
                console.error('Failed to save company information', error)
                if (error instanceof Error) {
                    showSnackbar(error.message, 'error')
                } else {
                    showSnackbar('An unexpected error occurred', 'error')
                }
            } finally {
                setLoading(false)
            }
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Company Information
                </Typography>

                {/* Basic Info */}
                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Company Name *"
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('companyName', {
                                required: 'Required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.companyName}
                            helperText={errors.companyName?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Registration Number *"
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('companyRegNo', {
                                required: 'Required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.companyRegNo}
                            helperText={errors.companyRegNo?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Company Website"
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('companyWebsite', {
                                validate: validateNoBlockedUnicode
                            })}
                            sx={textFieldStyles}
                        />
                    </Box>
                </Box>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="incorporationCountry"
                            control={control}
                            rules={{ required: 'Required', validate: validateNoBlockedUnicode }}
                            render={({ field: { onChange, value } }) => (
                                <Autocomplete
                                    options={Country.getAllCountries()}
                                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name || ''}
                                    value={
                                        Country.getAllCountries().find(
                                            (c) =>
                                                c.name.toLowerCase() === (value || '').trim().toLowerCase() ||
                                                c.isoCode.toLowerCase() === (value || '').trim().toLowerCase()
                                        ) || (value ? ({ name: value } as ICountry) : null)
                                    }
                                    onChange={(_, newValue) => {
                                        const countryNameStr = typeof newValue === 'string' ? newValue : newValue?.name || ''
                                        onChange(sanitizeBlockedUnicode(countryNameStr))
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            label="Country of Incorporation *"
                                            placeholder="Search or select Country"
                                            error={!!errors.incorporationCountry}
                                            helperText={errors.incorporationCountry?.message as string}
                                            sx={textFieldStyles}
                                            inputProps={{
                                                ...params.inputProps,
                                                onKeyDown: handleBlockedUnicodeKeyDown,
                                                onPaste: handleBlockedUnicodePaste,
                                                autoComplete: 'new-password'
                                            }}
                                        />
                                    )}
                                />
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="corporateStructure"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Corporate Structure *"
                                    error={!!errors.corporateStructure}
                                    helperText={errors.corporateStructure?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Structure</MenuItem>
                                    <MenuItem value="Corporation">Corporation</MenuItem>
                                    <MenuItem value="LLC">LLC</MenuItem>
                                    <MenuItem value="Partnership">Partnership</MenuItem>
                                    <MenuItem value="Sole Proprietorship">Sole Proprietorship</MenuItem>
                                    <MenuItem value="Trust">Trust</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Business Activity *"
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('businessActivity', {
                                required: 'Required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.businessActivity}
                            helperText={errors.businessActivity?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Registered Address
                </Typography>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={{ flex: 2 }}>
                        <TextField
                            fullWidth
                            label="Address *"
                            placeholder="Enter Address"
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('companyregAddress', {
                                required: 'Required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.companyregAddress}
                            helperText={errors.companyregAddress?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Zip Code *"
                            placeholder="Enter Zip Code"
                            inputProps={{ maxLength: 15 }}
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('companyregZip', {
                                required: 'Required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.companyregZip}
                            helperText={errors.companyregZip?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                </Box>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <CountryStateCityFields
                        control={control}
                        setValue={setValue}
                        watch={watch}
                        errors={errors}
                        countryName="companyregCountry"
                        stateName="companyregState"
                        cityName="companyregCity"
                        textFieldStyles={textFieldStyles}
                        formFieldStyles={formFieldStyles}
                    />
                </Box>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={sameAddress}
                            onChange={handleCheckboxChange}
                        />
                    }
                    label="Office address same as registered address"
                    sx={{ mb: 2 }}
                />

                {!sameAddress && (
                    <>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                            Office Address
                        </Typography>

                        <Box sx={{ ...formRowStyles, mb: 3 }}>
                            <Box sx={{ flex: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Address *"
                                    placeholder="Enter Address"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('companyOfficeAddress', {
                                        required: !sameAddress && 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.companyOfficeAddress}
                                    helperText={errors.companyOfficeAddress?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Zip Code *"
                                    placeholder="Enter Zip Code"
                                    inputProps={{ maxLength: 15 }}
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('companyOfficeZip', {
                                        required: !sameAddress && 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.companyOfficeZip}
                                    helperText={errors.companyOfficeZip?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ ...formRowStyles, mb: 3 }}>
                            <CountryStateCityFields
                                control={control}
                                setValue={setValue}
                                watch={watch}
                                errors={errors}
                                countryName="companyOfficeCountry"
                                stateName="companyOfficeState"
                                cityName="companyOfficeCity"
                                disabled={sameAddress}
                                required={!sameAddress}
                                textFieldStyles={textFieldStyles}
                                formFieldStyles={formFieldStyles}
                            />
                        </Box>
                    </>
                )}

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Financial Information
                </Typography>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="revenue"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Annual Revenue *"
                                    error={!!errors.revenue}
                                    helperText={errors.revenue?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {amountOptions.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="companyNetWorth"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Company Net Worth *"
                                    error={!!errors.companyNetWorth}
                                    helperText={errors.companyNetWorth?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {amountOptions.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="profit"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Profit *"
                                    error={!!errors.profit}
                                    helperText={errors.profit?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {amountOptions.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="companyAssets"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Total Company Assets *"
                                    error={!!errors.companyAssets}
                                    helperText={errors.companyAssets?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {amountOptions.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Banking and Transaction Details
                </Typography>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="accountPurpose"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Account Purpose *"
                                    error={!!errors.accountPurpose}
                                    helperText={errors.accountPurpose?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="Trading">Trading</MenuItem>
                                    <MenuItem value="Investment">Investment</MenuItem>
                                    <MenuItem value="Payment Processing">Payment Processing</MenuItem>
                                    <MenuItem value="Treasury Management">Treasury Management</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="investmentSource"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Source of Investment *"
                                    error={!!errors.investmentSource}
                                    helperText={errors.investmentSource?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="Company Revenue">Company Revenue</MenuItem>
                                    <MenuItem value="Investor Funding">Investor Funding</MenuItem>
                                    <MenuItem value="Bank Loan">Bank Loan</MenuItem>
                                    <MenuItem value="Asset Sale">Asset Sale</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                </Box>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="transactionVolumes"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Monthly Transaction Volume *"
                                    error={!!errors.transactionVolumes}
                                    helperText={errors.transactionVolumes?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    {amountOptions.map((d) => (
                                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="transactionFrequency"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Transaction Frequency *"
                                    error={!!errors.transactionFrequency}
                                    helperText={errors.transactionFrequency?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="0-10">0-10</MenuItem>
                                    <MenuItem value="10-100">10-100</MenuItem>
                                    <MenuItem value="100-1,000">100-1,000</MenuItem>
                                    <MenuItem value="1,000 +">1,000 +</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                </Box>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <TextField
                            fullWidth
                            label="Banking Partner *"
                            placeholder="Your banking partner"
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('bankingPartner', {
                                required: 'Required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.bankingPartner}
                            helperText={errors.bankingPartner?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Controller
                            name="relationWithBank"
                            control={control}
                            rules={{ required: 'Required' }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Banking Relationship Duration *"
                                    error={!!errors.relationWithBank}
                                    helperText={errors.relationWithBank?.message as string}
                                    sx={textFieldStyles}
                                >
                                    <MenuItem value="">Select Any</MenuItem>
                                    <MenuItem value="0-1">0-1 year</MenuItem>
                                    <MenuItem value="1-2">1-2 year</MenuItem>
                                    <MenuItem value="2+">2 + years</MenuItem>
                                </TextField>
                            )}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />


                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={{ flex: 2 }}>
                        <TextField
                            fullWidth
                            label="Business Description *"
                            multiline
                            rows={3}
                            inputProps={{ maxLength: 350 }}
                            onKeyDown={handleBlockedUnicodeKeyDown}
                            onPaste={handleBlockedUnicodePaste}
                            {...register('businessDescription', {
                                required: 'Required',
                                validate: validateNoBlockedUnicode
                            })}
                            error={!!errors.businessDescription}
                            helperText={errors.businessDescription?.message as string}
                            sx={textFieldStyles}
                        />
                    </Box>
                    <Box sx={formFieldStyles} />
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Next'}
                    </Button>
                </Box>
            </Box>
        )
    }

    // Company Documents Form
    const CompanyDocumentsForm = () => {
        const {
            handleSubmit,
            setValue,
            watch,
            formState: { errors }
        } = useForm<CompanyDocumentsFormData>({ mode: 'onChange' })

        const documentFields: { name: CompanyDocumentFieldName; label: string }[] = [
            { name: 'incorporationCertificate', label: 'Certificate of Incorporation *' },
            { name: 'memorandum', label: 'Memorandum or Operating Agreement *' },
            { name: 'associationArticles', label: 'Articles of Association *' },
            { name: 'incumbencyCertificate', label: 'Certificate of Incumbency *' },
            { name: 'directorsRegister', label: 'Register of Directors *' },
            { name: 'shareholdersRegister', label: 'Register of Shareholders *' },
            { name: 'boardResolution', label: 'Board Resolution *' },
            { name: 'addressProof', label: 'Proof of Address *' },
        ]

        // Watch all file fields
        const watchedFiles = documentFields.reduce((acc, field) => {
            acc[field.name] = watch(field.name)
            return acc
        }, {} as Record<CompanyDocumentFieldName, FileList | undefined>)

        // Create onChange handlers for each field
        const handleFileChange = (fieldName: CompanyDocumentFieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                // Validate file
                const validation = validateFile(files)
                if (validation === true) {
                    setValue(fieldName, files, { shouldValidate: true })
                } else {
                    showSnackbar(validation as string, 'error')
                    e.target.value = '' // Clear the input
                }
            }
        }

        // Check if all required files are selected
        const allFilesSelected = documentFields.every(field => {
            const fileList = watchedFiles[field.name]
            return fileList && fileList.length > 0
        })

        const onSubmit = async (data: CompanyDocumentsFormData) => {
            const docs: KycPayload = {}
            documentFields.forEach(f => {
                const fileList = watchedFiles[f.name]
                if (fileList?.[0]) {
                    docs[f.name] = fileList[0]
                }
            })
            setKycPayload({ ...kycPayload, ...docs })
            handleNext()
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Company Documents Upload
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {documentFields.map((field, idx) => {
                        const selectedFile = watchedFiles[field.name]

                        return (
                            <Box
                                key={idx}
                                sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}
                            >
                                <Card
                                    sx={{
                                        p: 2,
                                        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                                        {field.label}
                                    </Typography>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.jfif,.heic"
                                        style={{ display: 'none' }}
                                        id={field.name}
                                        onChange={handleFileChange(field.name)}
                                    />
                                    <label htmlFor={field.name}>
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            size="small"
                                            startIcon={<CloudUploadIcon />}
                                        >
                                            Choose File
                                        </Button>
                                    </label>

                                    {/* Show selected filename */}
                                    {selectedFile?.[0] && (
                                        <Typography
                                            variant="body2"
                                            color="success.main"
                                            sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                                        >
                                            ✓ {selectedFile[0].name}
                                        </Typography>
                                    )}

                                    {/* Show error if file not selected */}
                                    {!selectedFile?.[0] && (
                                        <Typography
                                            variant="caption"
                                            color="error"
                                            sx={{ display: 'block', mt: 1 }}
                                        >
                                            This file is required
                                        </Typography>
                                    )}

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block', mt: 1 }}
                                    >
                                        .JPG, .PDF, .PNG, .DOC, .DOCX - MAX 6 MB
                                    </Typography>
                                </Card>
                            </Box>
                        )
                    })}
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ px: 4 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={!allFilesSelected}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>
        )
    }

    // Authorization Letter Form
    const AuthorizationLetterForm = () => {
        const {
            handleSubmit,
            setValue,
            watch,
            formState: { errors }
        } = useForm<AuthorizationLetterFormData>({ mode: 'onChange' })

        // Watch files to display selected filenames
        const wolfsbergDocFile = watch('wolfsbergDoc')
        const authorizationLetterFile = watch('authorizationLetter')

        const handleWolfsbergChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                // Validate file
                const validation = validateFile(files)
                if (validation === true) {
                    setValue('wolfsbergDoc', files, { shouldValidate: true })
                } else {
                    showSnackbar(validation as string, 'error')
                    e.target.value = '' // Clear the input
                }
            }
        }

        const handleAuthorizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                // Validate file
                const validation = validateFile(files)
                if (validation === true) {
                    setValue('authorizationLetter', files, { shouldValidate: true })
                } else {
                    showSnackbar(validation as string, 'error')
                    e.target.value = '' // Clear the input
                }
            }
        }

        const onSubmit = async (data: AuthorizationLetterFormData) => {
            setKycPayload({
                ...kycPayload,
                wolfsbergDoc: data.wolfsbergDoc?.[0],
                authorizationLetter: data.authorizationLetter?.[0]
            })
            handleNext()
        }

        return (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Authorization Letter Upload
                </Typography>

                <Box sx={{ ...formRowStyles, mb: 3 }}>
                    <Box sx={formFieldStyles}>
                        <Card
                            sx={{
                                p: 3,
                                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                Wolfsberg Questionnaire
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Download the Wolfsberg Questionnaire template, fill it and upload.
                                This is mandatory for all financial companies.
                            </Typography>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                id="wolfsbergDoc"
                                onChange={handleWolfsbergChange}
                            />
                            <label htmlFor="wolfsbergDoc">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<CloudUploadIcon />}
                                >
                                    Choose File
                                </Button>
                            </label>

                            {/* Show selected filename */}
                            {wolfsbergDocFile?.[0] && (
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                                >
                                    ✓ {wolfsbergDocFile[0].name}
                                </Typography>
                            )}

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 1 }}
                            >
                                .JPG, .PDF, .PNG, .DOC, .DOCX - MAX 6 MB
                            </Typography>
                        </Card>
                    </Box>
                    <Box sx={formFieldStyles}>
                        <Card
                            sx={{
                                p: 3,
                                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                            }}
                        >
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                Authorization Letter *
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Upload signed Authorization Letter indicating the capacity of
                                authorized persons.
                            </Typography>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                id="authorizationLetter"
                                onChange={handleAuthorizationChange}
                            />
                            <label htmlFor="authorizationLetter">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<CloudUploadIcon />}
                                >
                                    Choose File
                                </Button>
                            </label>

                            {/* Show selected filename */}
                            {authorizationLetterFile?.[0] && (
                                <Typography
                                    variant="body2"
                                    color="success.main"
                                    sx={{ display: 'block', mt: 1, fontWeight: 500 }}
                                >
                                    ✓ {authorizationLetterFile[0].name}
                                </Typography>
                            )}

                            {/* Show error if required file not selected */}
                            {!authorizationLetterFile?.[0] && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ display: 'block', mt: 1 }}
                                >
                                    This file is required
                                </Typography>
                            )}

                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 1 }}
                            >
                                .JPG, .PDF, .PNG, .DOC, .DOCX - MAX 6 MB
                            </Typography>
                        </Card>
                    </Box>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ px: 4 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={!authorizationLetterFile?.[0]}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        Next
                    </Button>
                </Box>
            </Box>
        )
    }

    // Beneficial Owners Form
    const BeneficialOwnersForm = () => {
        const [confirmDialog, setConfirmDialog] = useState(false)
        const [deleteDialog, setDeleteDialog] = useState(false)
        const [ownerToDelete, setOwnerToDelete] = useState<BeneficialOwner | null>(null)


        const handleAddOwner = () => {
            setEditingOwner(null)
            setOwnerDialogOpen(true)
        }

        const handleEditOwner = (owner: BeneficialOwner) => {
            setEditingOwner(owner)
            setOwnerDialogOpen(true)
        }

        const handleDeleteClick = (owner: BeneficialOwner) => {
            setOwnerToDelete(owner)
            setDeleteDialog(true)
        }

        const confirmDelete = async () => {
            if (ownerToDelete) {
                const result = await deleteEnterpriseOwner(ownerToDelete)
                if (result.success) {
                    setDeleteDialog(false)
                    setOwnerToDelete(null)
                }
            }
        }

        const handleFinishKYC = async () => {
            if (beneficialOwners.length === 0) {
                showSnackbar('Please add at least one beneficial owner', 'error')
                return
            }
            setConfirmDialog(true)
        }

        const confirmSubmit = async () => {
            setLoading(true)
            try {
                // Step 1: Add enterprise details with documents
                const enterpriseResult = await addUserEnterpriseDetails()

                if (!enterpriseResult.success) {
                    showSnackbar(enterpriseResult.message, 'error')
                    setLoading(false)
                    return
                }

                // Step 2: Finish KYC
                const finishKycResponse = await axios.post<ApiResponse>(
                    `${API_BASE_URL}/finance-hub/finishKyc?adminUser=${localStorage.getItem('uuid')}&uuid=${userUuid}`,
                    {},
                    {
                        headers: {
                            Authorization: `BEARER ${localStorage.getItem('access_token')}`
                        }
                    }
                )

                if (finishKycResponse.data?.error?.error_data === 0) {
                    showSnackbar('KYC submitted successfully!', 'success')
                    setConfirmDialog(false)
                    setTimeout(() => {
                        location.reload();
                    }, 3000)
                } else {
                    showSnackbar(finishKycResponse.data?.error?.error_msg || 'Failed to finish KYC', 'error')
                }
            } catch (error) {
                console.error('Failed to submit KYC', error)
                if (error instanceof Error) {
                    showSnackbar(error.message, 'error')
                } else {
                    showSnackbar('An unexpected error occurred', 'error')
                }
            } finally {
                setLoading(false)
            }
        }

        return (
            <Box>
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
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Beneficial Owners / UBO Information
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddOwner}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                        }}
                    >
                        Add Owner
                    </Button>
                </Box>

                {beneficialOwners.length > 0 ? (
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table>
                            <TableHead>
                                <TableRow
                                    sx={{
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                    }}
                                >
                                    <TableCell>Owner Type</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone</TableCell>
                                    <TableCell>Country</TableCell>
                                    <TableCell>SSN / Passport</TableCell>
                                    <TableCell>Ownership %</TableCell>
                                    <TableCell>PEP</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {beneficialOwners.map((owner, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{owner.ownerType}</TableCell>
                                        <TableCell>
                                            {`${owner.firstName} ${owner.middleName ? owner.middleName + ' ' : ''}${owner.lastName}`}
                                        </TableCell>
                                        <TableCell>{owner.email}</TableCell>
                                        <TableCell>{owner.phone}</TableCell>
                                        <TableCell>{owner.country}</TableCell>
                                        <TableCell>{owner.ssn}</TableCell>
                                        <TableCell>{owner.ownershipPer}%</TableCell>
                                        <TableCell>{owner.pep === 0 ? 'No' : 'Yes'}</TableCell>
                                        <TableCell>
                                            {owner.action || 'In Review'}
                                            {(!owner.action || owner.action === 'INSERT') && (
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditOwner(owner)}
                                                        color="primary"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteClick(owner)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Card
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            mb: 3,
                            backgroundColor: alpha(theme.palette.primary.main, 0.02)
                        }}
                    >
                        <PersonIcon
                            sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }}
                        />
                        <Typography variant="h6" color="text.secondary">
                            No Beneficial Owners Added
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {`Click "Add Owner" to add beneficial owners or authorized signatories`}
                        </Typography>
                    </Card>
                )}

                <Card
                    sx={{
                        p: 2,
                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                        mb: 3
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <InfoIcon sx={{ color: theme.palette.info.main }} />
                        <Typography variant="body2">
                            Add all beneficial owners with 25% or more ownership, directors,
                            and authorized signatories. Total ownership should add up to at least 75%.
                        </Typography>
                    </Box>
                </Card>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleBack} sx={{ px: 4 }}>
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFinishKYC}
                        disabled={beneficialOwners.length === 0 || loading}
                        sx={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            px: 4,
                            py: 1.5
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Finish KYC'}
                    </Button>
                </Box>

                {/* Confirmation Dialog for Finish KYC */}
                <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
                    <DialogTitle>Confirm Submission</DialogTitle>
                    <DialogContent>
                        <Typography>
                            {`You are about to submit your KYC information. Once submitted,
                        you won't be able to edit this information. Are you sure you
                        want to proceed?`}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
                        <Button variant="contained" onClick={confirmSubmit}>
                            Submit
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this beneficial owner?
                            This action cannot be undone.
                        </Typography>
                        {ownerToDelete && (
                            <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
                                {`${ownerToDelete.firstName} ${ownerToDelete.middleName ? ownerToDelete.middleName + ' ' : ''}${ownerToDelete.lastName}`}
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={confirmDelete}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        )
    }

    // Owner Dialog Component
    const OwnerDialog = () => {
        const {
            register,
            handleSubmit,
            control,
            reset,
            setValue,
            watch,
            formState: { errors }
        } = useForm<OwnerFormData>({
            mode: 'onChange',
            defaultValues: editingOwner
                ? {
                    ...editingOwner,
                    pep: String(editingOwner.pep),
                    // File fields will be empty for editing
                }
                : {
                    ownerType: 'Authorized signatory',
                    pep: '0',
                }
        })

        // Watch file fields
        const frontIdFile = watch('frontId')
        const backIdFile = watch('backId')
        const addressProofFile = watch('addressProof')
        const selfieFile = watch('selfie')
        const investingFundFile = watch('investingFund')

        // File change handlers
        const handleFrontIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                const validation = validateFile(files)
                if (validation === true) {
                    setValue('frontId', files, { shouldValidate: true })
                } else {
                    showSnackbar(validation as string, 'error')
                    e.target.value = ''
                }
            }
        }

        const handleBackIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                const validation = validateFile(files)
                if (validation === true) {
                    setValue('backId', files, { shouldValidate: true })
                } else {
                    showSnackbar(validation as string, 'error')
                    e.target.value = ''
                }
            }
        }

        const handleAddressProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                const validation = validateFile(files)
                if (validation === true) {
                    setValue('addressProof', files, { shouldValidate: true })
                } else {
                    showSnackbar(validation as string, 'error')
                    e.target.value = ''
                }
            }
        }

        const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                const validation = validateFile(files)
                if (validation === true) {
                    setValue('selfie', files, { shouldValidate: true })
                } else {
                    showSnackbar(validation as string, 'error')
                    e.target.value = ''
                }
            }
        }

        const handleInvestingFundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                const validation = validateFile(files)
                if (validation === true) {
                    setValue('investingFund', files, { shouldValidate: true })
                } else {
                    showSnackbar(validation as string, 'error')
                    e.target.value = ''
                }
            }
        }

        // Reset form when dialog opens or editingOwner changes
        // In the OwnerDialog component, update the useEffect that resets the form:

        useEffect(() => {
            if (ownerDialogOpen) {
                if (editingOwner) {
                    reset({
                        ownerType: editingOwner.ownerType || 'Authorized signatory',
                        firstName: editingOwner.firstName || '',
                        middleName: editingOwner.middleName || '',
                        lastName: editingOwner.lastName || '',
                        email: editingOwner.email || '',
                        phone: editingOwner.phone || '',
                        address: editingOwner.address || '',
                        city: editingOwner.city || '',
                        state: editingOwner.state || '',
                        country: editingOwner.country || '',
                        zip: editingOwner.zip || '',
                        dob: editingOwner.dob || '',
                        birthPlace: editingOwner.birthPlace || '',
                        ssn: editingOwner.ssn || '',
                        ownershipPer: editingOwner.ownershipPer || 0,
                        pep: String(editingOwner.pep) || '0',
                        ownerUuid: editingOwner.ownerUuid || ''
                    })
                } else {
                    reset({
                        ownerType: 'Authorized signatory',
                        firstName: '',
                        middleName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        address: '',
                        city: '',
                        state: '',
                        country: '',
                        zip: '',
                        dob: '',
                        birthPlace: '',
                        ssn: '',
                        ownershipPer: 0,
                        pep: '0',
                        ownerUuid: ''
                    })
                }
            }
        }, [ownerDialogOpen, editingOwner, reset])

        const onSubmit = async (data: OwnerFormData) => {
            // Call API to add/edit owner
            console.log(data);
            const sanitizedData: OwnerFormData = {
                ...data,
                firstName: sanitizeBlockedUnicode(data.firstName),
                middleName: sanitizeBlockedUnicode(data.middleName || ''),
                lastName: sanitizeBlockedUnicode(data.lastName),
                email: sanitizeBlockedUnicode(data.email),
                phone: sanitizeBlockedUnicode(data.phone),
                address: sanitizeBlockedUnicode(data.address),
                city: sanitizeBlockedUnicode(data.city),
                state: sanitizeBlockedUnicode(data.state),
                country: sanitizeBlockedUnicode(data.country),
                zip: sanitizeBlockedUnicode(data.zip),
                birthPlace: sanitizeBlockedUnicode(data.birthPlace),
                ssn: sanitizeBlockedUnicode(data.ssn),
            }
            const result = await addEnterpriseOwner(sanitizedData, !!editingOwner)
            if (result.success) {
                setOwnerDialogOpen(false)
                reset()
            }
        }

        return (
            <Dialog
                open={ownerDialogOpen}
                onClose={() => setOwnerDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    {editingOwner ? 'Edit' : 'Add'} Beneficial Owner
                    <IconButton
                        onClick={() => setOwnerDialogOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 2 }}>
                        {/* Row 1: Owner Type, First Name, Middle Name, Last Name */}
                        <Box sx={{ ...formRowStyles, mb: 2 }}>
                            <Box sx={formFieldStyles}>
                                <Controller
                                    name="ownerType"
                                    control={control}
                                    rules={{ required: 'Required' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Owner Type *"
                                            error={!!errors.ownerType}
                                            helperText={errors.ownerType?.message as string}
                                            sx={textFieldStyles}
                                        >
                                            <MenuItem value="Authorized signatory">Authorized Signatory</MenuItem>
                                            <MenuItem value="Director">Director</MenuItem>
                                            <MenuItem value="UBO">UBO</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="First Name *"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('firstName', {
                                        required: 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.firstName}
                                    helperText={errors.firstName?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Middle Name"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('middleName', {
                                        validate: validateNoBlockedUnicode
                                    })}
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Last Name *"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('lastName', {
                                        required: 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.lastName}
                                    helperText={errors.lastName?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                        </Box>

                        {/* Row 2: Email, Phone */}
                        <Box sx={{ ...formRowStyles, mb: 2 }}>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Email *"
                                    type="email"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('email', {
                                        required: 'Required',
                                        pattern: {
                                            value: /^\S+@\S+$/i,
                                            message: 'Invalid email'
                                        },
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.email}
                                    helperText={errors.email?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Phone *"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('phone', {
                                        required: 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.phone}
                                    helperText={errors.phone?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                        </Box>

                        {/* Row 3: Address, Zip */}
                        <Box sx={{ ...formRowStyles, mb: 2 }}>
                            <Box sx={{ flex: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Address *"
                                    placeholder="Enter Address"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('address', {
                                        required: 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.address}
                                    helperText={errors.address?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Zip Code *"
                                    placeholder="Enter Zip Code"
                                    inputProps={{ maxLength: 15 }}
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('zip', {
                                        required: 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.zip}
                                    helperText={errors.zip?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                        </Box>

                        {/* Row 4: Country, State, City Cascading Dropdowns */}
                        <Box sx={{ ...formRowStyles, mb: 2 }}>
                            <CountryStateCityFields
                                control={control}
                                setValue={setValue}
                                watch={watch}
                                errors={errors}
                                countryName="country"
                                stateName="state"
                                cityName="city"
                                textFieldStyles={textFieldStyles}
                                formFieldStyles={formFieldStyles}
                            />
                        </Box>

                        {/* Row 5: DOB, Birth Place, SSN */}
                        <Box sx={{ ...formRowStyles, mb: 2 }}>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Date of Birth *"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    {...register('dob', { required: 'Required' })}
                                    error={!!errors.dob}
                                    helperText={errors.dob?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Place of Birth *"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('birthPlace', {
                                        required: 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.birthPlace}
                                    helperText={errors.birthPlace?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="SSN / Passport *"
                                    onKeyDown={handleBlockedUnicodeKeyDown}
                                    onPaste={handleBlockedUnicodePaste}
                                    {...register('ssn', {
                                        required: 'Required',
                                        validate: validateNoBlockedUnicode
                                    })}
                                    error={!!errors.ssn}
                                    helperText={errors.ssn?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                        </Box>

                        {/* Row 6: Ownership %, PEP Status */}
                        <Box sx={{ ...formRowStyles, mb: 3 }}>
                            <Box sx={formFieldStyles}>
                                <TextField
                                    fullWidth
                                    label="Ownership Percentage *"
                                    type="number"
                                    inputProps={{ min: 0, max: 100 }}
                                    {...register('ownershipPer', {
                                        required: 'Required',
                                        min: { value: 0, message: 'Min 0%' },
                                        max: { value: 100, message: 'Max 100%' }
                                    })}
                                    error={!!errors.ownershipPer}
                                    helperText={errors.ownershipPer?.message as string}
                                    sx={textFieldStyles}
                                />
                            </Box>
                            <Box sx={formFieldStyles}>
                                <Controller
                                    name="pep"
                                    control={control}
                                    rules={{ required: 'Required' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="PEP Status *"
                                            error={!!errors.pep}
                                            helperText={errors.pep?.message as string}
                                            sx={textFieldStyles}
                                        >
                                            <MenuItem value="0">No</MenuItem>
                                            <MenuItem value="1">Yes</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Document Uploads
                        </Typography>

                        {/* Document Upload Row 1 */}
                        <Box sx={{ ...formRowStyles, mb: 2 }}>
                            <Box sx={formFieldStyles}>
                                <Card sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Front side of ID *
                                    </Typography>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.jfif,.heic"
                                        style={{ display: 'none' }}
                                        id="frontId"
                                        onChange={handleFrontIdChange}
                                    />
                                    <label htmlFor="frontId">
                                        <Button variant="outlined" component="span" size="small" startIcon={<CloudUploadIcon />}>
                                            Choose File
                                        </Button>
                                    </label>
                                    {frontIdFile?.[0] && (
                                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                            ✓ {frontIdFile[0].name}
                                        </Typography>
                                    )}
                                    {!frontIdFile?.[0] && !editingOwner && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                            This file is required
                                        </Typography>
                                    )}
                                </Card>
                            </Box>
                            <Box sx={formFieldStyles}>
                                <Card sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Back side of ID *
                                    </Typography>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.jfif,.heic"
                                        style={{ display: 'none' }}
                                        id="backId"
                                        onChange={handleBackIdChange}
                                    />
                                    <label htmlFor="backId">
                                        <Button variant="outlined" component="span" size="small" startIcon={<CloudUploadIcon />}>
                                            Choose File
                                        </Button>
                                    </label>
                                    {backIdFile?.[0] && (
                                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                            ✓ {backIdFile[0].name}
                                        </Typography>
                                    )}
                                    {!backIdFile?.[0] && !editingOwner && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                            This file is required
                                        </Typography>
                                    )}
                                </Card>
                            </Box>
                        </Box>

                        {/* Document Upload Row 2 */}
                        <Box sx={{ ...formRowStyles, mb: 2 }}>
                            <Box sx={formFieldStyles}>
                                <Card sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Proof of Address *
                                    </Typography>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.jfif,.heic"
                                        style={{ display: 'none' }}
                                        id="addressProof"
                                        onChange={handleAddressProofChange}
                                    />
                                    <label htmlFor="addressProof">
                                        <Button variant="outlined" component="span" size="small" startIcon={<CloudUploadIcon />}>
                                            Choose File
                                        </Button>
                                    </label>
                                    {addressProofFile?.[0] && (
                                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                            ✓ {addressProofFile[0].name}
                                        </Typography>
                                    )}
                                    {!addressProofFile?.[0] && !editingOwner && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                            This file is required
                                        </Typography>
                                    )}
                                </Card>
                            </Box>
                            <Box sx={formFieldStyles}>
                                <Card sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Selfie with ID *
                                    </Typography>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.jfif,.heic"
                                        style={{ display: 'none' }}
                                        id="selfie"
                                        onChange={handleSelfieChange}
                                    />
                                    <label htmlFor="selfie">
                                        <Button variant="outlined" component="span" size="small" startIcon={<CloudUploadIcon />}>
                                            Choose File
                                        </Button>
                                    </label>
                                    {selfieFile?.[0] && (
                                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                            ✓ {selfieFile[0].name}
                                        </Typography>
                                    )}
                                    {!selfieFile?.[0] && !editingOwner && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                            This file is required
                                        </Typography>
                                    )}
                                </Card>
                            </Box>
                        </Box>

                        {/* Document Upload Row 3 - Optional */}
                        <Box sx={{ ...formRowStyles, mb: 2 }}>
                            <Box sx={{ ...formFieldStyles, maxWidth: { md: '50%' } }}>
                                <Card sx={{ p: 2, border: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Proof of Investment Source (Optional)
                                    </Typography>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.jfif,.heic"
                                        style={{ display: 'none' }}
                                        id="investingFund"
                                        onChange={handleInvestingFundChange}
                                    />
                                    <label htmlFor="investingFund">
                                        <Button variant="outlined" component="span" size="small" startIcon={<CloudUploadIcon />}>
                                            Choose File
                                        </Button>
                                    </label>
                                    {investingFundFile?.[0] && (
                                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                            ✓ {investingFundFile[0].name}
                                        </Typography>
                                    )}
                                </Card>
                            </Box>
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                            * Accepted formats: JPG, JPEG, PNG, PDF, DOC, DOCX, JFIF, HEIC - MAX 6 MB
                        </Typography>

                        <Box
                            sx={{
                                mt: 3,
                                display: 'flex',
                                gap: 2,
                                justifyContent: 'flex-end'
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={() => setOwnerDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                type="submit"
                                disabled={
                                    loading ||
                                    (!editingOwner && (!frontIdFile?.[0] || !backIdFile?.[0] || !addressProofFile?.[0] || !selfieFile?.[0]))
                                }
                                sx={{
                                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : (editingOwner ? 'Update Owner' : 'Add Owner')}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        )
    }

    // Render current step
    const renderStepContent = () => {
        if (userType === 'individual') {
            switch (currentStep) {
                case 0:
                    return <AddressForm />
                case 1:
                    return <DOBForm />
                case 2:
                    return <EmploymentForm />
                case 3:
                    return <AddressProofForm />
                case 4:
                    return <IDDocumentForm />
                case 5:
                    return <PhotoVerificationForm />
                default:
                    return null
            }
        } else {
            switch (currentStep) {
                case 0:
                    return <CompanyInformationForm />
                case 1:
                    return <CompanyDocumentsForm />
                case 2:
                    return <AuthorizationLetterForm />
                case 3:
                    return <BeneficialOwnersForm />
                default:
                    return null
            }
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <Fragment>
                {!userTypeSelected ? (
                    <UserTypeSelection />
                ) : (
                    <Box
                        sx={{
                            minHeight: '100vh',
                            py: { xs: 2, sm: 3, md: 4 },
                            px: { xs: 2, sm: 3 },
                            background: mode === 'light'
                                ? 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
                                : 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
                        }}
                    >
                        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                            {/* Header */}
                            <Box sx={{ mb: 4 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        mb: 1,
                                        flexWrap: 'wrap'
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
                                            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
                                        }}
                                    >
                                        KYC Verification
                                    </Typography>
                                    <Chip
                                        label={userType === 'individual' ? 'Individual' : 'Enterprise'}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={() => {
                                            setUserTypeSelected(false)
                                            setCurrentStep(0)
                                        }}
                                        sx={{ ml: 'auto' }}
                                    >
                                        Change Type
                                    </Button>
                                </Box>
                                <Typography
                                    variant="body1"
                                    sx={{ color: 'text.secondary', fontWeight: 500 }}
                                >
                                    Complete your identity verification to unlock all features
                                </Typography>
                            </Box>

                            {/* Stepper */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2, sm: 3 },
                                    mb: 3,
                                    borderRadius: 3,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    backgroundColor: mode === 'light'
                                        ? '#ffffff'
                                        : theme.palette.background.paper
                                }}
                            >
                                <Stepper
                                    activeStep={currentStep}
                                    orientation={isMobile ? 'vertical' : 'horizontal'}
                                    sx={{
                                        '& .MuiStepLabel-label': {
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                        }
                                    }}
                                >
                                    {steps.map((step, index) => (
                                        <Step key={step.label}>
                                            <StepLabel
                                                StepIconComponent={() => (
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: index <= currentStep
                                                                ? theme.palette.primary.main
                                                                : alpha(theme.palette.primary.main, 0.1),
                                                            color: index <= currentStep
                                                                ? '#fff'
                                                                : theme.palette.text.secondary,
                                                            transition: 'all 0.3s'
                                                        }}
                                                    >
                                                        {index < currentStep ? (
                                                            <CheckCircleIcon fontSize="small" />
                                                        ) : (
                                                            step.icon
                                                        )}
                                                    </Box>
                                                )}
                                            >
                                                {step.label}
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </Paper>

                            {/* Main Content */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2.5, sm: 3.5, md: 4 },
                                    borderRadius: 3,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                    backgroundColor: mode === 'light'
                                        ? '#ffffff'
                                        : theme.palette.background.paper,
                                    boxShadow: mode === 'light'
                                        ? '0 4px 20px rgba(0,0,0,0.08)'
                                        : '0 4px 20px rgba(0,0,0,0.3)'
                                }}
                            >
                                {renderStepContent()}
                            </Paper>
                        </Box>
                    </Box>
                )}

                {/* Owner Dialog */}
                <OwnerDialog />

                {/* Loading Backdrop */}
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={loading || externalLoading}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>

                {/* Snackbar */}
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
        </ThemeProvider>
    )
}

export default KycContent