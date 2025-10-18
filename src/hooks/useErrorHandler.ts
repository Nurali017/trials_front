import { useCallback } from 'react';
import { useSnackbar } from 'notistack';

interface ErrorHandlerOptions {
  showSnackbar?: boolean;
  logToConsole?: boolean;
  customMessage?: string;
}

export const useErrorHandler = () => {
  const { enqueueSnackbar } = useSnackbar();

  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showSnackbar = true,
      logToConsole = true,
      customMessage,
    } = options;

    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Произошла неизвестная ошибка';

    const displayMessage = customMessage || errorMessage;

    if (logToConsole) {
      console.error('Error caught by useErrorHandler:', error);
    }

    if (showSnackbar) {
      enqueueSnackbar(displayMessage, {
        variant: 'error',
        autoHideDuration: 5000,
      });
    }

    return errorMessage;
  }, [enqueueSnackbar]);

  return { handleError };
};

