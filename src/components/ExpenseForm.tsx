import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Trash2 } from 'lucide-react';
import CoinIcon from './CoinIcon';

interface Participant {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  newExpense: {
    description: string;
    amount: string;
    paidBy: string;
    sharedBy: string[];
  };
  onExpenseChange: (expense: {
    description: string;
    amount: string;
    paidBy: string;
    sharedBy: string[];
  }) => void;
  participants: Participant[];
  onToggleParticipant: (participantName: string) => void;
  isEditMode?: boolean;
}

// Custom hook for measuring text width
const useTextWidth = () => {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    canvas.current = document.createElement('canvas');
    return () => {
      canvas.current = null;
    };
  }, []);
  
  return (text: string, font: string = '18px bold sans-serif'): number => {
    if (!canvas.current) return 0;
    const context = canvas.current.getContext('2d');
    if (!context) return 0;
    
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  };
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
  newExpense,
  onExpenseChange,
  participants,
  onToggleParticipant,
  isEditMode = false
}) => {
  const [splitType, setSplitType] = useState<'equally' | 'custom'>(
    newExpense.sharedBy.length === participants.length ? 'equally' : 'custom'
  );
  const measureText = useTextWidth();
  
  // Refs for measuring content
  const paidByRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const splitTypeRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (isEditMode && onUpdate) {
      onUpdate();
    } else {
      onAdd();
    }
  };

  const handleSplitTypeChange = (value: string) => {
    if (value === 'equally') {
      // Select all participants
      const allParticipantNames = participants.map(p => p.name);
      onExpenseChange({ ...newExpense, sharedBy: allParticipantNames });
      setSplitType('equally');
    } else {
      setSplitType('custom');
    }
  };

  // Calculate width based on content with minimum width
  const getWidthForContent = (content: string, minWidth: number = 80): string => {
    const width = Math.max(measureText(content) + 32, minWidth); // Add padding
    return `${width}px`;
  };

  // Common styles for text elements
  const textStyle = "text-lg font-bold";
  const inputStyle = "h-10 text-center border-0 border-b border-dashed border-gray-300 focus:ring-0 focus:border-gray-400 bg-transparent rounded-none text-lg font-bold";
  const selectTriggerStyle = "h-10 px-2 inline-flex border-0 border-b border-dashed border-gray-300 bg-transparent rounded-none focus:ring-0 focus:border-gray-400 text-lg font-bold";

  // Custom placeholder with coin icon
  const AmountPlaceholder = () => (
    <div className="flex items-center justify-center gap-1">
      <CoinIcon size={18} />
      <span>0.00</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6">
        <div className="space-y-10 py-6">
          <div className="text-center font-bold leading-relaxed space-y-8">
            <div className="flex items-center justify-center gap-3 flex-nowrap">
              <div ref={paidByRef} style={{ display: 'inline-block' }}>
                <Select 
                  value={newExpense.paidBy} 
                  onValueChange={(value) => onExpenseChange({ ...newExpense, paidBy: value })}
                >
                  <SelectTrigger 
                    className={selectTriggerStyle}
                    style={{ 
                      width: getWidthForContent(newExpense.paidBy || 'Who?')
                    }}
                  >
                    <SelectValue placeholder="Who?" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map(participant => (
                      <SelectItem key={participant.id} value={participant.name} className="text-lg">
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <span className={textStyle}>paid</span>
              
              <div ref={amountRef} style={{ display: 'inline-block' }}>
                <div className="relative">
                  <Input
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => onExpenseChange({ ...newExpense, amount: e.target.value })}
                    className={`${inputStyle} pl-7`}
                    style={{ 
                      width: getWidthForContent(newExpense.amount || '0.00') + 24
                    }}
                  />
                  <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
                    <CoinIcon size={18} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-1">
              <span className={textStyle}>for</span>
            </div>
            
            <div className="w-full px-4 mb-1">
              <Input
                placeholder="item or service"
                value={newExpense.description}
                onChange={(e) => onExpenseChange({ ...newExpense, description: e.target.value })}
                className={inputStyle}
              />
            </div>

            <div className="flex items-center justify-center gap-3 mt-2">
              <span className={textStyle}>and it's split</span>
              
              <div ref={splitTypeRef} style={{ display: 'inline-block' }}>
                <Select 
                  value={splitType} 
                  onValueChange={handleSplitTypeChange}
                >
                  <SelectTrigger 
                    className={selectTriggerStyle}
                    style={{ 
                      width: getWidthForContent(splitType === 'equally' ? 'equally' : 'between')
                    }}
                  >
                    <SelectValue placeholder="How?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equally" className="text-lg">equally</SelectItem>
                    <SelectItem value="custom" className="text-lg">between</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {splitType === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-8 pt-4 border-t border-gray-100 text-center">
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center justify-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newExpense.sharedBy.includes(participant.name)}
                    onChange={() => onToggleParticipant(participant.name)}
                    className="w-5 h-5"
                  />
                  <span className="text-base">{participant.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 justify-center pt-6 border-t border-gray-100">
            {isEditMode && onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                size="sm"
                className="px-3 h-9"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              size="sm"
              className="px-3 h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!newExpense.description.trim() || !newExpense.amount.trim() || !newExpense.paidBy || newExpense.sharedBy.length === 0}
              variant="primary"
              size="sm"
              className="px-3 h-9"
            >
              <Check className="h-4 w-4 mr-1" />
              {isEditMode ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
