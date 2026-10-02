import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle
} from 'react-native';
import { CustomModal } from './CustomModal';
import { CustomButton } from './CustomButton';
import { THEME } from '../../constants/theme';

export interface CustomDatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  containerStyle?: StyleProp<ViewStyle>;
  minDate?: Date;
  maxDate?: Date;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(new Date(value));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(value));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Days in current view month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const next = new Date(year, month, day);
    setSelectedDate(next);
  };

  const handleConfirm = () => {
    onChange(selectedDate);
    setIsOpen(false);
  };

  const formattedDisplay = value.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.dateBox}
        onPress={() => {
          setViewDate(new Date(value));
          setSelectedDate(new Date(value));
          setIsOpen(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.dateInfo}>
          <Text style={styles.calIcon}>📅</Text>
          <Text style={styles.dateText}>{formattedDisplay}</Text>
        </View>
        <Text style={styles.changeAction}>Select</Text>
      </TouchableOpacity>

      <CustomModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select Date'}
        footer={
          <>
            <CustomButton
              title="Cancel"
              variant="outline"
              size="sm"
              onPress={() => setIsOpen(false)}
            />
            <CustomButton
              title="Set Date"
              variant="primary"
              size="sm"
              onPress={handleConfirm}
            />
          </>
        }
      >
        <View style={styles.calendarContainer}>
          {/* Month & Year header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <Text style={styles.navText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthNames[month]} {year}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Text style={styles.navText}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {daysOfWeek.map((d, idx) => (
              <Text key={idx} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <View key={`blank-${i}`} style={styles.dayCellBlank} />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayCell, isSelected && styles.dayCellActive]}
                  onPress={() => handleSelectDay(day)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  dateBox: {
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
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calIcon: {
    fontSize: 18,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  changeAction: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  calendarContainer: {
    paddingVertical: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
  },
  navText: {
    fontSize: 16,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    paddingBottom: 6,
  },
  weekDayText: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellBlank: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radii.full,
    marginVertical: 2,
  },
  dayCellActive: {
    backgroundColor: THEME.colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  dayTextActive: {
    color: THEME.colors.textLight,
    fontWeight: '800',
  },
});
