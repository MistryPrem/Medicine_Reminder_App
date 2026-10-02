import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StyleProp,
  ViewStyle
} from 'react-native';
import { CustomModal } from './CustomModal';
import { THEME } from '../../constants/theme';

export interface DropdownItem<T = string> {
  label: string;
  value: T;
  subtitle?: string;
  icon?: string;
}

export interface CustomDropdownProps<T = string> {
  label?: string;
  items: DropdownItem<T>[];
  value: T;
  onSelect: (value: T) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const CustomDropdown = <T extends string | number>({
  label,
  items,
  value,
  onSelect,
  placeholder = 'Select option...',
  containerStyle,
  disabled = false,
}: CustomDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = items.find((item) => item.value === value);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.selectBox, disabled && styles.disabled]}
        onPress={() => !disabled && setIsOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="combobox"
      >
        <Text style={[styles.selectText, !selectedItem && styles.placeholderText]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={styles.arrowText}>▼</Text>
      </TouchableOpacity>

      <CustomModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select Option'}
      >
        <View style={styles.optionsList}>
          {items.map((item) => {
            const isSelected = item.value === value;
            return (
              <TouchableOpacity
                key={String(item.value)}
                style={[styles.optionItem, isSelected && styles.optionSelected]}
                onPress={() => {
                  onSelect(item.value);
                  setIsOpen(false);
                }}
              >
                <View style={styles.optionContent}>
                  {item.icon && <Text style={styles.optionIcon}>{item.icon}</Text>}
                  <View>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>

                {isSelected && <Text style={styles.checkText}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </CustomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: THEME.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  selectText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  placeholderText: {
    color: THEME.colors.textMuted,
    fontWeight: '400',
  },
  arrowText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  disabled: {
    opacity: 0.6,
  },
  optionsList: {
    paddingVertical: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: THEME.radii.sm,
    marginBottom: 4,
  },
  optionSelected: {
    backgroundColor: THEME.colors.primaryLight,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    fontSize: 18,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  optionLabelActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  checkText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
});
