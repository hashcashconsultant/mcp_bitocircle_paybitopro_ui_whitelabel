'use client';

import QRCode from 'react-qr-code';
import React from 'react';

interface QrCodeProps {
  value: string;
  size?: number;
}

const QrCode: React.FC<QrCodeProps> = ({ value, size = 128 }) => {
  return (
    <div style={{ height: size, width: size }}>
      <QRCode value={value} size={size} />
    </div>
  );
};

export default QrCode;
