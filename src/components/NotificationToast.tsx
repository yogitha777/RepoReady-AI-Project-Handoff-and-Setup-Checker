import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface NotificationToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="toast-notification">
      <div className="toast-content">
        <CheckCircle2 size={16} className="text-success" />
        <span className="toast-text">{message}</span>
      </div>
      <button onClick={onDismiss} className="toast-close-btn">
        <X size={14} />
      </button>
    </div>
  );
};
