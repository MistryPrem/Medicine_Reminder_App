import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  StyleProp,
  ViewStyle
} from 'react-native';
import { THEME } from '../../constants/theme';

export interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  dismissable?: boolean;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
  contentStyle,
  dismissable = true,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissable ? onClose : undefined}
    >
      <TouchableWithoutFeedback onPress={dismissable ? onClose : undefined}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.dialogContainer, contentStyle]}>
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  {dismissable && (
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>

              {footer && <View style={styles.footer}>{footer}</View>}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  dialogContainer: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radii.lg,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    overflow: 'hidden',
    ...THEME.shadows.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surfaceSubtle,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
