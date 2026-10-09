'use client';

import React, { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Paper,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Divider,
  CircularProgress,
  ThemeProvider,
  Snackbar,
  Alert,
  useMediaQuery,
  createTheme,
  Backdrop,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  alpha,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SecurityIcon from '@mui/icons-material/Security';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = 'https://account.paybito.com/accountviewer';
const SECRET_KEY_STORAGE = 'hcx_secret_key'; // localStorage key for secret key

interface ApiResponse {
  statusCode: string,
  message: string,
  privKey: string,
  pubKey: string,
  balance: string,
}

interface AllAssets {
  assetCode: string,
  issuer: string,
  balance: string
}

/**
 * FinanceHubCreateTokenContent Component
 * Main component for managing HCX wallet operations including key generation,
 * asset creation, and transaction management
 * 
 * @component
 * @returns {JSX.Element} The rendered finance hub interface
 */
const FinanceHubCreateTokenContent: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAccountActive, setIsAccountActive] = useState<boolean>(false);
  const [showGenerateKeys, setShowGenerateKeys] = useState(false);
  const [keys, setKeys] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [secretInput, setSecretInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hcxBalance, setHcxBalance] = useState<string>('0');
  const [selectedAssetBalance, setSelectedAssetBalance] = useState<string>('0');
  const [addAssetDialogOpen, setAddAssetDialogOpen] = useState(false);
  const [hcxSendAddress, setHcxSendAddress] = useState<string>('')
  const [hcxSendAmount, setHcxSendAmount] = useState<string>('');
  const [hcxSendMemo, setHcxSendMemo] = useState<string>('');
  const [supplyForCreateAsset, setSupplyForCreateAsset] = useState<number>(5);
  const [assetCodeForCreateAsset, setAssetCodeForCreateAsset] = useState<string>('');
  const [otherSendAddress, setOtherSendAddress] = useState<string>('')
  const [otherSendAmount, setOtherSendAmount] = useState<string>('');
  const [otherSendMemo, setOtherSendMemo] = useState<string>('');
  const [otherSendAsset, setOtherSendAsset] = useState<string>('');
  const [otherAssets, setOtherAssets] = useState<AllAssets[]>([]);
  const [selectedOtherAssetCode, setSelectedOtherAssetCode] = useState<string>('');
  const [selectedOtherAssetIssuer, setSelectedOtherAssetIssuer] = useState<string>('');
  const [addedAssets, setAddedAssets] = useState<AllAssets[]>([]);
  // Loading and notification states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');


  /**
   * Initialize theme mode from localStorage or system preference
   * Runs once on component mount
   */
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

  /**
   * Check for stored secret key on component mount and auto-login
   * This effect runs once when the component is mounted
   */
  useEffect(() => {
    const checkStoredCredentials = async () => {
      setInitialLoading(true);
      try {
        const storedSecretKey = localStorage.getItem(SECRET_KEY_STORAGE);

        if (storedSecretKey) {
          // Auto-login with stored secret key
          setSecretInput(storedSecretKey);
          await performSignIn(storedSecretKey);
        }
      } catch (error) {
        console.error('Error during auto-login:', error);
        // Clear invalid stored credentials
        localStorage.removeItem(SECRET_KEY_STORAGE);
      } finally {
        setInitialLoading(false);
      }
    };

    checkStoredCredentials();
  }, []);

  /**
   * Creates and memoizes Material-UI theme based on current mode
   * Theme includes custom colors, typography, and component overrides
   * 
   * @returns {Theme} Material-UI theme object
   */
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1e40af',
            light: '#3b82f6',
            dark: '#1e3a8a',
          },
          secondary: {
            main: '#dc2626',
          },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#0f0f11',
            paper: mode === 'light' ? '#ffffff' : '#1a1a1d',
          },
          text: {
            primary: mode === 'light' ? '#1e293b' : '#f1f5f9',
            secondary: mode === 'light' ? '#64748b' : '#94a3b8',
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
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 10,
                padding: '10px 24px',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 10,
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  /**
   * Toggles between light and dark theme modes
   * Saves preference to localStorage for persistence
   * 
   * @returns {void}
   */
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newMode }));
  };

  /**
   * Displays a snackbar notification with a message
   * 
   * @param {string} message - The message to display in the snackbar
   * @param {'success' | 'error' | 'info'} severity - The severity level of the notification
   * @returns {void}
   */
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  /**
   * Closes the snackbar notification
   * 
   * @returns {void}
   */
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  /**
   * Copies a value to the clipboard and shows a success notification
   * 
   * @param {string} label - Label identifier for the copied value (e.g., 'public', 'secret')
   * @param {string} value - The actual value to copy to clipboard
   * @returns {void}
   */
  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(label);
    showSnackbar('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  /**
   * Logs out the user and resets all state to initial values
   * Clears keys, balances, authentication status, and removes secret key from localStorage
   * 
   * @returns {void}
   */
  const handleLogout = () => {
    setIsLoggedIn(false);
    setKeys(null);
    setSecretInput('');
    setHcxBalance('0');
    setIsAccountActive(false);

    // Clear secret key from localStorage
    localStorage.removeItem(SECRET_KEY_STORAGE);

    showSnackbar('Logged out successfully', 'info');
  };

  /**
   * Generates a new public/private key pair via API
   * Uses stored access token for authentication
   * Updates state with generated keys on success
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {Error} If API request fails or returns error status
   */
  const handleGenerateKeys = async () => {
    setLoading(true);
    try {
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/keygeneration`, {},
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );
      const statusCode = response.data.statusCode;
      if (statusCode !== '1') {
        showSnackbar(response.data.message, 'error');
        return;
      }
      const publicKey = response.data.pubKey;
      const secretKey = response.data.privKey;
      setKeys({
        publicKey: publicKey,
        secretKey: secretKey,
      });
      showSnackbar('Keys generated successfully!', 'success');
    } catch (error) {
      console.error('Failed to generate keys', error);
      if (error instanceof Error) {
        showSnackbar(error.message, 'error');
      } else {
        showSnackbar('An unexpected error occurred', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Core sign-in logic that can be reused for both manual and auto-login
   * Validates input, authenticates via API, and retrieves account information
   * 
   * @async
   * @param {string} secretKey - The secret key to sign in with
   * @returns {Promise<void>}
   * @throws {Error} If authentication fails or API returns error
   */
  const performSignIn = async (secretKey: string) => {
    if (!secretKey) {
      showSnackbar('Please enter your secret key to sign in.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = { "privKey": secretKey };
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/signin`, payload,
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );
      const statusCode = response.data.statusCode;
      if (statusCode !== '1') {
        showSnackbar(response.data.message, 'error');
        // Clear invalid stored credentials
        localStorage.removeItem(SECRET_KEY_STORAGE);
        return;
      }

      showSnackbar(response.data.message, 'success');
      setIsLoggedIn(true);
      setKeys({
        publicKey: response.data.pubKey,
        secretKey: secretKey,
      });

      // Store secret key in localStorage for persistence
      localStorage.setItem(SECRET_KEY_STORAGE, secretKey);

      await getAssetStatus(response.data.pubKey);
    } catch (error) {
      console.error('Failed to sign in', error);
      if (error instanceof Error) {
        showSnackbar(error.message, 'error');
      } else {
        showSnackbar('An unexpected error occurred', 'error');
      }
      // Clear invalid stored credentials
      localStorage.removeItem(SECRET_KEY_STORAGE);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signs in the user using their secret key
   * Wrapper around performSignIn for manual login
   * 
   * @async
   * @returns {Promise<void>}
   */
  const handleSignIn = async () => {
    await performSignIn(secretInput);
  };

  /**
   * Retrieves the HCX balance for a given public key
   * Updates account active status and balance state
   * 
   * @async
   * @param {string} publicKey - The public key to check balance for
   * @returns {Promise<void>}
   * @throws {Error} If API request fails
   */
  const getBalance = async (publicKey: string) => {
    try {
      const payload = { pubKey: publicKey };
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/balance`, payload,
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );
      const statusCode = response.data.statusCode;
      setIsAccountActive(statusCode === '1' ? true : false);
      setHcxBalance(response.data.balance);
      await getAllAssets();
    } catch (error) {
      console.error('Failed to get balance', error);
      if (error instanceof Error) {
        showSnackbar(error.message, 'error');
      } else {
        showSnackbar('An unexpected error occurred', 'error');
      }
    }
  };

  /**
   * Checks the asset status for a given public key
   * If account is active, retrieves balance information
   * 
   * @async
   * @param {string} publicKey - The public key to check asset status for
   * @returns {Promise<void>}
   * @throws {Error} If API request fails
   */
  const getAssetStatus = async (publicKey: string) => {
    try {
      const payload = { pubKey: publicKey };
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/checkAssetStatus`, payload,
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );
      const statusCode = response.data.statusCode;
      setIsAccountActive(statusCode === '1' ? true : false);
      if (statusCode === '1') {
        await getBalance(publicKey);
      }
    } catch (error) {
      console.error('Failed to check asset status', error);
      if (error instanceof Error) {
        showSnackbar(error.message, 'error');
      } else {
        showSnackbar('An unexpected error occurred', 'error');
      }
    }
  };

  /**
 * Handles the validation of HCX amount entered 
 * for send
 
 * 
 * @returns {void}
 */
  const handleHcxSendAmount = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // ✅ Allow empty value (Backspace to clear)
    if (value === '') {
      setHcxSendAmount('')
      return;
    }

    // ✅ Only then clean unwanted characters
    const cleanedValue = value
      .replace(/[^0-9.]/g, '')     // allow only numbers and dot
      .replace(/(\.).*?\./g, '$1'); // ensure only one dot

    event.target.value = cleanedValue;
    setHcxSendAmount(cleanedValue)

  }

  /**
   * Handles sending HCX to an address
   * Memo is now optional
   *
   * @returns {void}
   */
  /**
 * Handles sending HCX to an address
 * Memo is now optional
 * Validates balance before sending
 *
 * @returns {void}
 */
  const handleSendHcx = async () => {
    // Check if balance is 0
    if (parseFloat(hcxBalance) === 0) {
      showSnackbar('Insufficient HCX balance', 'error');
      return;
    }

    // Memo is now optional - only validate address and amount
    if (hcxSendAddress === '' || hcxSendAmount === '') {
      showSnackbar('Please provide an address and valid amount', 'error');
      return;
    }

    // Check if send amount is greater than available balance
    if (parseFloat(hcxSendAmount) > parseFloat(hcxBalance)) {
      showSnackbar('Insufficient HCX balance', 'error');
      return;
    }

    // Check if amount is valid (greater than 0)
    if (parseFloat(hcxSendAmount) <= 0) {
      showSnackbar('Amount must be greater than 0', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        "privKey": keys?.secretKey,
        "pubKey": hcxSendAddress,
        "amount": hcxSendAmount,
        "option": "1",
        "memo": hcxSendMemo || '' // Send empty string if memo is not provided
      }
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/send`, payload,
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );

      const statusCode = response.data.statusCode;
      if (statusCode !== '1') {
        showSnackbar(`${response.data.message}`, 'error');
        return;
      }
      showSnackbar('HCXs sent successfully!', 'success');
      setHcxSendAddress('');
      setHcxSendAmount('');
      setHcxSendMemo('');
      if (keys?.publicKey) {
        await getAssetStatus(keys.publicKey);
      }
    } catch (error) {
      console.error('Error during transaction:', error);
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
   * Handles creating an asset with supply & asset code 
   * 
   *  @returns {void}
    */

  const handleCreateAsset = async () => {
    if (supplyForCreateAsset === 0) {
      showSnackbar('Supply should be greater than 0', 'error');
      return;
    } else if (assetCodeForCreateAsset === '') {
      showSnackbar('please provide an asset code', 'error');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        "privKey": keys?.secretKey,
        "supply": supplyForCreateAsset,
        "assetCode": assetCodeForCreateAsset,
      }
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/createUserAsset`, payload,
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );

      const statusCode = response.data.statusCode;
      if (statusCode !== '1') {
        showSnackbar(response.data.message, 'error');
        return;
      }
      showSnackbar('Asset created successfully!', 'success');
      setAssetCodeForCreateAsset('');
      setSupplyForCreateAsset(0);
      if (keys?.publicKey) {
        await getUserAddedAssets();
      }
    } catch (error) {
      console.error('Failed to create asset', error);
      if (error instanceof Error) {
        showSnackbar(error.message, 'error');
      } else {
        showSnackbar('An unexpected error occurred', 'error');
      }
    } finally {
      setLoading(false)
    }
  }

  const getUserAddedAssets = async () => {
    try {
      const response = await axios.post<AllAssets[]>(
        `${API_BASE_URL}/afterAssetStatus`, { pubKey: keys?.publicKey },
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );
      setAddedAssets(response.data || []);


    } catch (error) {
      console.error('Failed to get user added assets', error);
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
   * Method defination to get all assets
   * 
   * @returns {void}
   */
  const getAllAssets = async () => {
    try {
      const response = await axios.post<AllAssets[]>(
        `${API_BASE_URL}/allAsset`, {},
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );
      setOtherAssets(response.data || []);

    } catch (error) {
      console.error('Failed to get all assets', error);
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
   * Method defination to get issuer of an asset
   * @returns {void}
   */
  const generateIssuer = async (assetCode: string) => {
    const asset = otherAssets.find((asset: AllAssets) => asset.assetCode === assetCode);
    const issuer = asset?.issuer || '';
    setSelectedOtherAssetCode(assetCode);
    setSelectedOtherAssetIssuer(issuer);

  }




  /**
   * Handles sending other assets to another address
   * Memo is now optional
   * 
   * @returns {void}
   */
  const handleSendOther = async () => {
    if (otherSendAsset === '') {
      showSnackbar('Please select an asset', 'error');
      return;
    } else if (otherSendAddress === '' || otherSendAmount === '') {
      // Memo is now optional - only validate address and amount
      showSnackbar('Please provide an address and valid amount', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        "privKey": keys?.secretKey,
        "pubKey": otherSendAddress,
        "amount": otherSendAmount,
        "option": "1",
        "memo": otherSendMemo || '', // Send empty string if memo is not provided
        "assetCode": otherSendAsset,
      }
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/sendToken`, payload,
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );

      const statusCode = response.data.statusCode;
      if (statusCode !== '1') {
        showSnackbar(`Failed to send ${otherSendAmount} ${otherSendAsset}`, 'error');
        return;
      }
      showSnackbar('Asset sent successfully!', 'success');
      setOtherSendAddress('');
      setOtherSendAmount('');
      setOtherSendMemo('');

      if (keys?.publicKey) {
        await getAssetStatus(keys.publicKey);
        await getSelectedAssetBalance(otherSendAsset);
      }
    } catch (error) {
      console.error('Failed to send asset', error);
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
   * Method defination to set & handle other assets
   */
  const handleOtherAssetForSend = async (assetCode: string) => {
    setOtherSendAsset(assetCode);
    await getSelectedAssetBalance(assetCode);
  }
  /**
   * Opens the Add Asset dialog
   * 
   * @returns {void}
   */
  const handleOpenAddAssetDialog = async () => {
    await getAllAssets();
    setAddAssetDialogOpen(true);
  };

  /**
   * Closes the Add Asset dialog
   * 
   * @returns {void}
   */
  const handleCloseAddAssetDialog = () => {
    setAddAssetDialogOpen(false);
  };

  /**
   * Handles adding an asset from other issuers
   * 
   * @returns {void}
   */
  const handleAddAsset = async () => {
    if (selectedOtherAssetCode === '') {
      showSnackbar('Please select an asset code', 'error');
      return;
    } else if (selectedOtherAssetIssuer === '') {
      showSnackbar('Please select an asset code to get issuer', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        "privKey": keys?.secretKey,
        "assetCode": selectedOtherAssetCode,
        "issuer": selectedOtherAssetIssuer
      }
      const response = await axios.post<ApiResponse>(
        `${API_BASE_URL}/addAsset`, payload,
        {
          headers: {
            //authorization: `bearer ${localStorage.getItem('access_token_us')}`,
          }
        }
      );
      const statusCode = response.data.statusCode;
      if (statusCode !== '1') {
        showSnackbar(response.data.message, 'error');
        return;
      }
      showSnackbar('Asset added successfully!', 'success');
      setAddAssetDialogOpen(false);
      setSelectedOtherAssetIssuer('');
      setSelectedOtherAssetCode('');
    } catch (error) {
      console.error('Failed to add asset', error);
      if (error instanceof Error) {
        showSnackbar(error.message, 'error');
      } else {
        showSnackbar('An unexpected error occurred', 'error');
      }
    } finally {
      setLoading(false);
    }


  };

  /**
   * Method defination for getting selected asset balance
   * 
   * @returns {void}
   */
  const getSelectedAssetBalance = async (assetCode: string) => {
    const asset = addedAssets.find((asset: AllAssets) => asset.assetCode === assetCode);
    setSelectedAssetBalance(asset?.balance || '0');
  }

  // Show loading backdrop during initial authentication check
  if (initialLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Backdrop
          sx={{
            color: '#fff',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backdropFilter: 'blur(4px)',
            background: mode === 'light'
              ? 'linear-gradient(to bottom, #f8fafc 0%, #e0e7ff 100%)'
              : 'linear-gradient(to bottom, #0f0f11 0%, #1a1a1d 100%)',
          }}
          open={true}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress color="inherit" size={50} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading your wallet...
            </Typography>
          </Box>
        </Backdrop>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: mode === 'light'
            ? 'linear-gradient(to bottom, #f8fafc 0%, #e0e7ff 100%)'
            : 'linear-gradient(to bottom, #0f0f11 0%, #1a1a1d 100%)',
          py: { xs: 4, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          {/* Header with Logout */}
          {isLoggedIn && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  HCX Wallet Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Manage your assets securely
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          )}

          <Stack spacing={3}>
            {/* --- Login Section --- */}
            {!isLoggedIn && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 4, md: 5 },
                  borderRadius: 3,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: mode === 'light'
                    ? '0 4px 20px rgba(0,0,0,0.06)'
                    : '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.15)})`,
                      mb: 2,
                    }}
                  >
                    <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    Access Your Wallet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sign in with your secret key or generate new credentials
                  </Typography>
                </Box>

                <Stack spacing={3}>
                  <TextField
                    label="Secret Key"
                    variant="outlined"
                    fullWidth
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    placeholder="Enter your secret key"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKeyIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<VpnKeyIcon />}
                    onClick={handleSignIn}
                    disabled={!secretInput || loading}
                    sx={{
                      py: 1.5,
                      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                  </Button>

                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>

                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={handleGenerateKeys}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    Generate New Keys
                  </Button>

                  {keys && (
                    <Card
                      sx={{
                        mt: 3,
                        background: mode === 'light'
                          ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(59, 130, 246, 0.08) 100%)'
                          : 'linear-gradient(135deg, rgba(66, 165, 245, 0.08) 0%, rgba(30, 64, 175, 0.12) 100%)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SecurityIcon sx={{ color: 'warning.main', mr: 1 }} />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: 'warning.main',
                            }}
                          >
                            Keep your secret key safe and offline!
                          </Typography>
                        </Box>

                        <Stack spacing={2}>
                          {/* Public Key */}
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1, mr: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 0.5 }}
                                >
                                  Public Key
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all',
                                    fontWeight: 500,
                                  }}
                                >
                                  {keys.publicKey}
                                </Typography>
                              </Box>
                              <Tooltip title={copiedKey === 'public' ? 'Copied!' : 'Copy'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopy('public', keys.publicKey)}
                                  sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                                    },
                                  }}
                                >
                                  {copiedKey === 'public' ? (
                                    <CheckCircleIcon color="success" fontSize="small" />
                                  ) : (
                                    <ContentCopyIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          {/* Secret Key */}
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1, mr: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 0.5 }}
                                >
                                  Secret Key
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    wordBreak: 'break-all',
                                    fontWeight: 500,
                                  }}
                                >
                                  {keys.secretKey}
                                </Typography>
                              </Box>
                              <Tooltip title={copiedKey === 'secret' ? 'Copied!' : 'Copy'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopy('secret', keys.secretKey)}
                                  sx={{
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                                    },
                                  }}
                                >
                                  {copiedKey === 'secret' ? (
                                    <CheckCircleIcon color="success" fontSize="small" />
                                  ) : (
                                    <ContentCopyIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Stack>

                        {/* Security Tips */}
                        <Card
                          sx={{
                            mt: 3,
                            bgcolor: mode === 'light' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(66, 165, 245, 0.08)',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                              <InfoOutlinedIcon sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Security Best Practices
                              </Typography>
                            </Box>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Box component="span" sx={{ mr: 1 }}>•</Box>
                                Store your secret key securely offline
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Box component="span" sx={{ mr: 1 }}>•</Box>
                                Never share your secret key with anyone
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Box component="span" sx={{ mr: 1 }}>•</Box>
                                Use hardware wallets for enhanced security
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Box component="span" sx={{ mr: 1 }}>•</Box>
                                Always verify recipient addresses
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </Paper>
            )}

            {/* --- Logged In Sections --- */}
            {isLoggedIn && (
              <Fragment>
                {/* HCX Wallet Section */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    borderRadius: 3,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: mode === 'light'
                      ? '0 4px 20px rgba(0,0,0,0.06)'
                      : '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        HCX Wallet
                      </Typography>
                      <Chip
                        label={`${hcxBalance} HCX`}
                        sx={{
                          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          px: 2,
                          py: 2.5,
                        }}
                      />
                    </Box>

                    {/* Public Key Display */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 0.5 }}
                          >
                            Your Public Key
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                              fontWeight: 500,
                            }}
                          >
                            {keys?.publicKey}
                          </Typography>
                        </Box>
                        <Tooltip title={copiedKey === 'public' ? 'Copied!' : 'Copy'}>
                          <IconButton
                            size="small"
                            onClick={() => keys?.publicKey && handleCopy('public', keys.publicKey)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            {copiedKey === 'public' ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <ContentCopyIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {!isAccountActive && (
                      <Alert
                        severity="info"
                        icon={<InfoOutlinedIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        This account is currently inactive. Send at least 5 HCX to activate it using the public key shown above.
                      </Alert>
                    )}
                  </Box>

                  <Stack spacing={2.5}>
                    <TextField
                      label="Recipient Public Key or Address"
                      fullWidth
                      variant="outlined"
                      placeholder="Enter recipient address"
                      value={hcxSendAddress}
                      onChange={(e) => setHcxSendAddress(e.target.value)}
                    />
                    <TextField
                      label="Amount to Send (HCX)"
                      type="number"
                      fullWidth
                      variant="outlined"
                      placeholder="0.00"
                      value={hcxSendAmount}
                      onChange={(e) => handleHcxSendAmount(e as React.ChangeEvent<HTMLInputElement>)}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <TextField label="Memo ID" value="Memo_Text" disabled fullWidth variant="outlined" placeholder="Optional" />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Enter Memo (Optional)"
                          fullWidth
                          variant="outlined"
                          placeholder="Optional memo"
                          value={hcxSendMemo}
                          onChange={(e) => setHcxSendMemo(e.target.value)}
                        />
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<SendIcon />}
                      disabled={loading}
                      onClick={handleSendHcx}
                      sx={{
                        py: 1.5,
                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                        },
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Send HCX'}
                    </Button>
                  </Stack>
                </Paper>

                {isAccountActive && <Fragment>
                  {/* Create Asset Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, sm: 4 },
                      borderRadius: 3,
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: mode === 'light'
                        ? '0 4px 20px rgba(0,0,0,0.06)'
                        : '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Create Asset
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={handleOpenAddAssetDialog}
                        sx={{
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                          },
                        }}
                      >
                        Add from others asset
                      </Button>
                    </Box>

                    <Stack spacing={2.5}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <TextField type="number" label="Supply" fullWidth variant="outlined" placeholder="Enter supply amount" value={supplyForCreateAsset} onChange={(e) => setSupplyForCreateAsset(Number(e.target.value))} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <TextField label="Asset Code" fullWidth variant="outlined" placeholder="Enter asset code"
                            value={assetCodeForCreateAsset} onChange={(e) => setAssetCodeForCreateAsset(e.target.value)} />
                        </Box>
                      </Box>

                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<AddIcon />}
                        disabled={loading}
                        onClick={handleCreateAsset}
                        sx={{
                          py: 1.5,
                          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)',
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Asset'}
                      </Button>
                    </Stack>
                  </Paper>

                  {/* Asset Wallet Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, sm: 4 },
                      borderRadius: 3,
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: mode === 'light'
                        ? '0 4px 20px rgba(0,0,0,0.06)'
                        : '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Asset Wallet
                      </Typography>
                      {otherSendAsset && <Chip
                        label={`${selectedAssetBalance} ${otherSendAsset}`}
                        sx={{
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          px: 2,
                          py: 2.5,
                        }}
                      />}
                    </Box>

                    <Stack spacing={2.5}>
                      <TextField
                        label="Recipient Public Key or Address"
                        fullWidth
                        value={otherSendAddress}
                        onChange={(e) => setOtherSendAddress(e.target.value)}
                        variant="outlined"
                        placeholder="Enter recipient address"
                      />
                      <TextField
                        label="Amount to Send"
                        type="number"
                        value={otherSendAmount}
                        onChange={(e) => setOtherSendAmount(e.target.value)}
                        fullWidth
                        variant="outlined"
                        placeholder="0.00"
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <FormControl fullWidth>
                            <Select
                              value={otherSendAsset}
                              onChange={(e) => handleOtherAssetForSend(e.target.value)}
                              displayEmpty
                              sx={{
                                backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: 'none',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  border: 'none',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  border: `2px solid ${theme.palette.primary.main}`,
                                },
                              }}
                            >
                              <MenuItem value="" disabled>
                                <Typography sx={{ color: theme.palette.text.secondary }}>
                                  Select Asset
                                </Typography>
                              </MenuItem>
                              {addedAssets.map((asset: AllAssets) => (
                                <MenuItem value={asset.assetCode} key={asset.assetCode}>
                                  <Typography sx={{ color: theme.palette.text.secondary }}>
                                    {asset.assetCode}
                                  </Typography>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <TextField
                            label="Enter Memo (Optional)"
                            fullWidth
                            variant="outlined"
                            placeholder="Optional memo"
                            value={otherSendMemo}
                            onChange={(e) => setOtherSendMemo(e.target.value)}
                          />
                        </Box>
                      </Box>

                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<SendIcon />}
                        disabled={loading}
                        onClick={handleSendOther}
                        sx={{
                          py: 1.5,
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Asset'}
                      </Button>
                    </Stack>
                  </Paper>
                </Fragment>}
              </Fragment>
            )}
          </Stack>

          {/* Add Asset Dialog */}
          <Dialog
            open={addAssetDialogOpen}
            onClose={handleCloseAddAssetDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                backgroundColor: theme.palette.background.paper,
              },
            }}
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Add Asset
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleCloseAddAssetDialog}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2.5} sx={{ mt: 2 }}>
                <FormControl fullWidth>
                  <Select
                    displayEmpty
                    value={selectedOtherAssetCode}
                    onChange={(e) => { generateIssuer(e.target.value as string) }}
                    sx={{
                      backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: `2px solid ${theme.palette.primary.main}`,
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ color: theme.palette.text.secondary }}>
                        Select Asset
                      </Typography>
                    </MenuItem>
                    {otherAssets.map((asset: AllAssets) => (
                      <MenuItem value={asset.assetCode} key={asset.assetCode}>
                        <Typography sx={{ color: theme.palette.text.secondary }}>
                          {asset.assetCode}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField label="Issuer" fullWidth variant="outlined" placeholder="Enter issuer address" value={selectedOtherAssetIssuer} />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCloseAddAssetDialog}
                sx={{
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={loading}
                onClick={handleAddAsset}
                sx={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Add from others asset'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Loading Backdrop */}
          <Backdrop
            sx={{
              color: '#fff',
              zIndex: (theme) => theme.zIndex.drawer + 1,
              backdropFilter: 'blur(4px)',
            }}
            open={loading}
          >
            <CircularProgress color="inherit" size={50} />
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
              sx={{
                width: '100%',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              variant="filled"
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default FinanceHubCreateTokenContent;