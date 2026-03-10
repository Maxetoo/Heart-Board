import React, { useEffect } from 'react';
import toast from 'react-hot-toast';

const SuccessNotificationPopup = ({ trigger, message = "Action successful", onClose }) => {
  useEffect(() => {
    if (trigger) {
      toast.dismiss('success-toast'); 
      // Show success toast
      toast.success(message, {
        duration: 3000,
        style: {
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          color: '#166534',
          fontWeight: 500,
          fontSize: '0.875rem',
        },
        iconTheme: {
          primary: '#16A34A',
          secondary: '#F0FDF4',
        },
      });

      // Optional callback after toast duration
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [trigger, message, onClose]);

  return null; 
};

export default SuccessNotificationPopup;