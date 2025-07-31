import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function InfoPopup({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'info', 'warning', 'success'
}) {
  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    success: <CheckCircle className="w-6 h-6 text-green-500" />,
    info: <CheckCircle className="w-6 h-6 text-blue-500" />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {icons[type]}
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="py-4">
          {message}
        </DialogDescription>
        <DialogFooter>
           <Button onClick={onClose}>Verstanden</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}