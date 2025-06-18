import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4">
      <div className="flex justify-center items-center space-x-4 text-xs text-muted-foreground">
        <Link to="#" className="no-underline hover:text-foreground">
          Privacy Policy
        </Link>
        <Link to="#" className="no-underline hover:text-foreground">
          Terms of Service
        </Link>
        <a href="https://orwhat.cc" className="no-underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
          © 2025 orwhat.cc
        </a>
      </div>
    </footer>
  );
};

export default Footer; 