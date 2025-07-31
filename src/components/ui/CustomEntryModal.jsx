import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function CustomEntryModal({
  isOpen,
  onClose,
  onSave,
  title,
  description,
  inputLabel,
  isLoading,
  validationFn, // Optional: (value) => { isValid: boolean, message: string }
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (validationFn) {
      const { isValid, message } = validationFn(value);
      if (!isValid) {
        setError(message);
        return;
      }
    }
    setError('');
    onSave(value);
    setValue('');
  };

  const handleClose = () => {
    setValue('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            id="custom-entry"
            label={inputLabel}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={inputLabel}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !value}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}