import React from 'react';

interface CoinIconProps {
  size?: number;
  className?: string;
}

const CoinIcon: React.FC<CoinIconProps> = ({ size = 16, className = '' }) => {
  return (
    <img 
      src="/coin.gif" 
      alt="Coin" 
      style={{ width: size, height: size, verticalAlign: 'middle' }} 
      className={`inline-block ${className}`}
    />
  );
};

export default CoinIcon; 