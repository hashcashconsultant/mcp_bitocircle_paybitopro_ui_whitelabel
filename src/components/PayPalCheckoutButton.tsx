'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Collapse,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

// ============= PayPal SDK Types =============

interface PayPalAmount {
  value: string;
  currency_code: string;
}

interface PayPalPurchaseUnit {
  amount: PayPalAmount;
  description?: string;
}

interface PayPalApplicationContext {
  shipping_preference: 'NO_SHIPPING' | 'GET_FROM_FILE' | 'SET_PROVIDED_ADDRESS';
}

interface PayPalOrderRequest {
  purchase_units: PayPalPurchaseUnit[];
  application_context?: PayPalApplicationContext;
}

interface PayPalOrderActions {
  order: {
    create: (orderRequest: PayPalOrderRequest) => Promise<string>;
    capture: () => Promise<PayPalOrderDetails>;
  };
}

interface PayPalButtonData {
  orderID: string;
  payerID?: string;
  paymentID?: string;
  billingToken?: string;
  facilitatorAccessToken?: string;
}

interface PayPalButtonStyle {
  layout?: 'vertical' | 'horizontal';
  color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
  shape?: 'rect' | 'pill';
  label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment';
  height?: number;
  tagline?: boolean;
}

interface PayPalButtonConfig {
  createOrder: (data: PayPalButtonData, actions: PayPalOrderActions) => Promise<string>;
  onApprove: (data: PayPalButtonData, actions: PayPalOrderActions) => Promise<void>;
  onCancel?: (data: PayPalButtonData) => void;
  onError?: (err: Error) => void;
  style?: PayPalButtonStyle;
  fundingSource?: string;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonConfig) => {
        render: (container: HTMLElement) => Promise<void>;
      };
    };
  }
}

// ============= Component Types =============

export interface PayPalOrderDetails {
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

export interface PayPalError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PayPalCheckoutButtonProps {
  amount: number;
  currency?: string;
  clientId?: string;
  description?:string; 
  onSuccess: (details: PayPalOrderDetails) => void;
  onError: (error: PayPalError | Error) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

// ============= Component =============

const PayPalCheckoutButton: React.FC<PayPalCheckoutButtonProps> = ({
  amount,
  currency = 'USD',
  clientId: propClientId,
  description,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const paypalRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const paymentActiveRef = useRef(false);
  const renderedRef = useRef(false);

  // Store in refs to avoid stale closures
  const amountRef = useRef(amount);
  const currencyRef = useRef(currency);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onCancelRef = useRef(onCancel);

  // Update refs on prop changes
  useEffect(() => {
    amountRef.current = amount;
    currencyRef.current = currency;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onCancelRef.current = onCancel;
  });

  const clientId = propClientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Mount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load PayPal SDK
  useEffect(() => {
    if (!clientId) {
      setError('PayPal Client ID not configured');
      setIsLoading(false);
      return;
    }

    // Already loaded
    if (window.paypal) {
      setSdkReady(true);
      setIsLoading(false);
      return;
    }

    // Check existing script
    const existing = document.getElementById('paypal-sdk');
    if (existing) {
      existing.addEventListener('load', () => {
        if (mountedRef.current) {
          setSdkReady(true);
          setIsLoading(false);
        }
      });
      if (window.paypal) {
        setSdkReady(true);
        setIsLoading(false);
      }
      return;
    }

    // Load new script
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
    script.async = true;

    script.onload = () => {
      if (mountedRef.current) {
        setSdkReady(true);
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      if (mountedRef.current) {
        setError('Failed to load PayPal');
        setIsLoading(false);
      }
    };

    document.body.appendChild(script);
  }, [clientId, currency]);

  // Render buttons once SDK is ready
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalRef.current || renderedRef.current) {
      return;
    }

    renderedRef.current = true;

    const createButtonConfig = (): PayPalButtonConfig => ({
      createOrder: (_data: PayPalButtonData, actions: PayPalOrderActions) => {
        paymentActiveRef.current = true;

        // Use ref values to get latest amount
        const currentAmount = amountRef.current;
        const currentCurrency = currencyRef.current;

        return actions.order.create({
          purchase_units: [{
            amount: {
              value: currentAmount.toFixed(2),
              currency_code: currentCurrency,
            },
            description: 'BitoDollar Deposit',
          }],
          application_context: {
            shipping_preference: 'NO_SHIPPING',
          },
        });
      },

      onApprove: async (_data: PayPalButtonData, actions: PayPalOrderActions) => {
        if (!mountedRef.current) {
          paymentActiveRef.current = false;
          return;
        }

        setIsProcessing(true);
        setProcessingStep('Processing payment...');

        try {
          const details = await actions.order.capture();

          paymentActiveRef.current = false;

          if (!mountedRef.current) return;

          if (details.status === 'COMPLETED') {
            setProcessingStep('Payment successful!');
            setTimeout(() => {
              if (mountedRef.current) {
                setIsProcessing(false);
                onSuccessRef.current(details);
              }
            }, 1000);
          } else {
            throw new Error(`Status: ${details.status}`);
          }
        } catch (err) {
          paymentActiveRef.current = false;
          if (!mountedRef.current) return;

          const error = err as Error;

          // Ignore window closed errors
          if (error?.message?.includes('Window closed') || error?.message?.includes('closed before')) {
            setError('Payment window closed. Please try again.');
            setIsProcessing(false);
            return;
          }

          setError(error?.message || 'Payment failed');
          setIsProcessing(false);
          onErrorRef.current({ message: error?.message || 'Payment failed' });
        }
      },

      onCancel: (_data: PayPalButtonData) => {
        paymentActiveRef.current = false;
        if (!mountedRef.current) return;
        setError('Payment cancelled');
        onCancelRef.current?.();
      },

      onError: (err: Error) => {
        paymentActiveRef.current = false;
        if (!mountedRef.current) return;

        // Ignore window closed errors
        const errStr = String(err?.message || err);
        if (errStr.includes('Window closed') || errStr.includes('closed before')) {
          setError('Payment window closed. Please try again.');
          return;
        }

        setError('Payment error occurred');
        onErrorRef.current({ message: 'Payment error', details: err });
      },
    });

    // Render PayPal button
    try {
      window.paypal.Buttons({
        ...createButtonConfig(),
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 50,
        },
      }).render(paypalRef.current!);
    } catch (e) {
      console.error('PayPal button error:', e);
    }

    // Render Card button
    if (cardRef.current) {
      try {
        window.paypal.Buttons({
          ...createButtonConfig(),
          fundingSource: 'card',
          style: {
            layout: 'vertical',
            color: 'black',
            shape: 'rect',
            height: 50,
          },
        }).render(cardRef.current);
      } catch (e) {
        console.error('Card button error:', e);
      }
    }
  }, [sdkReady]);

  // Auto-clear errors
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  if (!clientId) {
    return <Alert severity="error">PayPal not configured</Alert>;
  }

  return (
    <Box>
      {/* Error */}
      <Collapse in={!!error}>
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)} icon={<ErrorIcon />}>
          {error}
        </Alert>
      </Collapse>

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={36} />
        </Box>
      )}

      {/* Processing */}
      {isProcessing && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
          {processingStep.includes('successful') ? (
            <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
          ) : (
            <CircularProgress size={36} />
          )}
          <Typography color="text.secondary">{processingStep}</Typography>
        </Box>
      )}

      {/* Buttons - Always render, just hide when loading/processing */}
      <Box
        sx={{
          display: isLoading || isProcessing ? 'none' : 'block',
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto'
        }}
      >
        <div ref={paypalRef} />

        {/* <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
            or pay with card
          </Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
        </Box> */}

        {/* <div ref={cardRef} /> */}
      </Box>

      {/* Amount */}
      {!isLoading && !isProcessing && (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Amount: <strong>{amount.toFixed(2)} {currency}</strong>
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1, opacity: 0.7 }}>
        🔒 Secure payment powered by PayPal
      </Typography>
    </Box>
  );
};

export default PayPalCheckoutButton;