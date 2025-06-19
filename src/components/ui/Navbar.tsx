import React from 'react';
import { Button } from './button';
import { MoreHorizontal } from 'lucide-react';
import SyncStatus from '../SyncStatus';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  return (
    <nav className="w-full border-none px-4 py-3 flex justify-between items-center">
      <div className="font-extrabold text-md">I paid it.</div>
      <div className="flex items-center space-x-2">
        <SyncStatus />
        <Button variant="ghost" size="icon" onClick={onMenuClick}>
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
};

export default Navbar; 