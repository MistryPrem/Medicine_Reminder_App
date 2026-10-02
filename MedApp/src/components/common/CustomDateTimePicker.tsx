import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle
} from 'react-native';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';
import { CustomModal } from './CustomModal';
import { CustomButton } from './CustomButton';
import { THEME } from '../../constants/theme';

export interface CustomDateTimePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  label,
  value,
  onChange,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date(value));

  const handleTimeChange = (timeStr: string) => {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    const next = new Date(tempDate);
    next.setHours(hours, minutes, 0, 0);
    setTempDate(next);
  };

  const handleDateChange = (newDate: Date) => {
    const next = new Date(tempDate);
    next.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    setTempDate(next);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setIsOpen(false);
  };

  const formattedTime24 = `${tempDate.getHours().toString().padStart(2, '0')}:${tempDate.getMinutes().toString().padStart(2, '0')}`;

  const formattedDisplay = value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.box}
        onPress={() => {
          setTempDate(new Date(value));
          setIsOpen(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.info}>
          <Text style={styles.icon}>🗓️</Text>
          <Text style={styles.displayText}>{formattedDisplay} (IST)</Text>
        </View>
        <Text style={styles.actionText}>Change</Text>
      </TouchableOpacity>

      <CustomModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select Date & Time'}
        footer={
          <>
            <CustomButton
              title="Cancel"
              variant="outline"
              size="sm"
              onPress={() => setIsOpen(false)}
            />
            <CustomButton
              title="Confirm"
              variant="primary"
              size="sm"
              onPress={handleConfirm}
            />
          </>
        }
      >
        <View style={styles.content}>
          <CustomDatePicker
            label="Schedule Date"
            value={tempDate}
            onChange={handleDateChange}
          />

          <CustomTimePicker
            label="Dose Time"
            value={formattedTime24}
            onChange={handleTimeChange}
          />
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
  box: {
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
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 18,
  },
  displayText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  content: {
    paddingVertical: 4,
  },
});
