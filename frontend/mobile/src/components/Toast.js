import React, { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar } from 'react-native-paper';
import { colors } from '../theme/colors';

const ToastContext = createContext(() => {});

// Usage: const showToast = useToast(); showToast('Estoque recebido');
export const useToast = () => useContext(ToastContext);

// Thin wrapper over react-native-paper's (already-installed, previously unused)
// Snackbar — avoids pulling in a separate toast library.
export const ToastProvider = ({ children }) => {
  const [state, setState] = useState({ visible: false, message: '' });

  const showToast = useCallback((message) => setState({ visible: true, message }), []);
  const hide = () => setState((s) => ({ ...s, visible: false }));

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Snackbar
        visible={state.visible}
        onDismiss={hide}
        duration={2600}
        style={{ backgroundColor: colors.primary, borderRadius: 10, marginBottom: 8 }}
      >
        {state.message}
      </Snackbar>
    </ToastContext.Provider>
  );
};
