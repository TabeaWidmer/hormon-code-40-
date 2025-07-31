import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Trotzdem hinzufügen",
  cancelText = "Abbrechen",
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white rounded-2xl shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-text-primary">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-text-secondary pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} className="rounded-xl">{cancelText}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={() => { onConfirm(); onClose(); }} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">{confirmText}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}