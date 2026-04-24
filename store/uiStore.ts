import { create } from 'zustand';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  isOpen: boolean;
  message: string;
  type: AlertType;
  title: string;
  onConfirm?: (inputValue?: string) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  showInput?: boolean;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  showAlert: (config: { 
    message: string; 
    type?: AlertType; 
    title?: string; 
    onConfirm?: (inputValue?: string) => void;
    onCancel?: () => void;
    showCancel?: boolean;
    showInput?: boolean;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
  }) => void;
  closeAlert: () => void;
}

export const useUIStore = create<AlertState>((set) => ({
  isOpen: false,
  message: '',
  type: 'info',
  title: '',
  onConfirm: undefined,
  onCancel: undefined,
  showCancel: false,
  showInput: false,
  placeholder: '',
  defaultValue: '',
  confirmText: 'Dismiss',
  cancelText: 'Cancel',
  showAlert: ({ 
    message, type = 'info', title = '', onConfirm, onCancel, 
    showCancel = false, showInput = false, placeholder = '', defaultValue = '',
    confirmText = 'Dismiss', cancelText = 'Cancel' 
  }) => 
    set({ 
      isOpen: true, message, type, title, onConfirm, onCancel, 
      showCancel, showInput, placeholder, defaultValue,
      confirmText, cancelText 
    }),
  closeAlert: () => set({ isOpen: false, onConfirm: undefined, onCancel: undefined, showInput: false }),
}));
