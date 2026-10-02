import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = React.useCallback((options: ToastOptions | string) => {
    const toastConfig = typeof options === 'string' ? { message: options, type: 'info' as ToastType } : options;
    setToast(toastConfig);

    const duration = toastConfig.duration || 3500;
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const hideToast = React.useCallback(() => setToast(null), []);

  const getTypeStyle = (type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        return { bg: THEME.colors.successLight, border: THEME.colors.success, text: '#14532d', icon: '✅' };
      case 'error':
        return { bg: THEME.colors.dangerLight, border: THEME.colors.danger, text: '#7f1d1d', icon: '❌' };
      case 'warning':
        return { bg: THEME.colors.warningLight, border: THEME.colors.warning, text: '#78350f', icon: '⚠️' };
      default:
        return { bg: THEME.colors.primaryLight, border: THEME.colors.primary, text: '#0c4a6e', icon: 'ℹ️' };
    }
  };

  const styleConfig = toast ? getTypeStyle(toast.type) : null;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && styleConfig && (
        <View style={styles.toastContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={hideToast}
            style={[
              styles.toastCard,
              { backgroundColor: styleConfig.bg, borderColor: styleConfig.border }
            ]}
          >
            <Text style={styles.toastIcon}>{styleConfig.icon}</Text>
            <Text style={[styles.toastText, { color: styleConfig.text }]}>
              {toast.message}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: THEME.radii.md,
    borderWidth: 1.5,
    width: '100%',
    maxWidth: 480,
    gap: 12,
    ...THEME.shadows.card,
  },
  toastIcon: {
    fontSize: 18,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});
