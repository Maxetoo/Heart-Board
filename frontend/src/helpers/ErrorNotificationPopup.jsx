import { useEffect } from 'react';
import toast from 'react-hot-toast';

const ErrorNotificationPopup = ({ trigger, message = "An error occurred" }) => {
  useEffect(() => {
    if (trigger) {
      toast.dismiss('error-toast'); 
      toast.error(message, {
        id: 'error-toast',
        duration: 3000,
        style: {
          border: '1px solid #FECACA',
          background: '#FEF2F2',
          color: '#991B1B',
          fontWeight: 500,
        },
        iconTheme: {
          primary: '#DC2626',
          secondary: '#FEF2F2',
        },
      });
    }
  }, [trigger, message]);

  return null;
};

export default ErrorNotificationPopup;