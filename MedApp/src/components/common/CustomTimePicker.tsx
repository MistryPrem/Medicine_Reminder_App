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

export interface CustomTimePickerProps {
  label?: string;
  value: string; // "HH:MM" 24h format e.g. "08:00" or "20:30"
  onChange: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  label,
  value,
  onChange,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial 24h string into 12h representation
  const parseTime = (timeStr: string) => {
    const parts = (timeStr || '08:00').split(':');
    const h24 = parseInt(parts[0], 10) || 8;
    const m = parts[1] || '00';
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return { hour: h12, minute: m, period };
  };

  const initial = parseTime(value);
  const [tempHour, setTempHour] = useState<number>(initial.hour);
  const [tempMinute, setTempMinute] = useState<string>(initial.minute);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(initial.period as 'AM' | 'PM');

  const openPicker = () => {
    const current = parseTime(value);
    setTempHour(current.hour);
    setTempMinute(current.minute);
    setTempPeriod(current.period as 'AM' | 'PM');
    setIsOpen(true);
  };

  const handleConfirm = () => {
    let h24 = tempHour;
    if (tempPeriod === 'PM' && tempHour < 12) h24 += 12;
    if (tempPeriod === 'AM' && tempHour === 12) h24 = 0;

    const formattedH24 = h24.toString().padStart(2, '0');
    onChange(`${formattedH24}:${tempMinute}`);
    setIsOpen(false);
  };

  // 12-hour display string
  const display12h = `${initial.hour}:${initial.minute} ${initial.period}`;

  const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const MINUTES = ['00', '15', '30', '45'];

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.timeBox}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <View style={styles.timeInfo}>
          <Text style={styles.clockIcon}>🕒</Text>
          <Text style={styles.timeText}>{display12h}</Text>
        </View>
        <Text style={styles.badgeText}>IST</Text>
      </TouchableOpacity>

      <CustomModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={label || 'Select Dose Time (IST)'}
        footer={
          <>
            <CustomButton
              title="Cancel"
              variant="outline"
              size="sm"
              onPress={() => setIsOpen(false)}
            />
            <CustomButton
              title="Set Time"
              variant="primary"
              size="sm"
              onPress={handleConfirm}
            />
          </>
        }
      >
        <View style={styles.pickerContainer}>
          {/* AM / PM Toggle */}
          <View style={styles.periodRow}>
            <TouchableOpacity
              style={[styles.periodBtn, tempPeriod === 'AM' && styles.periodBtnActive]}
              onPress={() => setTempPeriod('AM')}
            >
              <Text style={[styles.periodText, tempPeriod === 'AM' && styles.periodTextActive]}>
                AM (Morning)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodBtn, tempPeriod === 'PM' && styles.periodBtnActive]}
              onPress={() => setTempPeriod('PM')}
            >
              <Text style={[styles.periodText, tempPeriod === 'PM' && styles.periodTextActive]}>
                PM (Evening)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hour Selector Grid */}
          <Text style={styles.sectionHeader}>Hour</Text>
          <View style={styles.grid}>
            {HOURS.map((h) => {
              const isSelected = tempHour === h;
              return (
                <TouchableOpacity
                  key={h}
                  style={[styles.gridCell, isSelected && styles.gridCellActive]}
                  onPress={() => setTempHour(h)}
                >
                  <Text style={[styles.cellText, isSelected && styles.cellTextActive]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Minute Selector */}
          <Text style={styles.sectionHeader}>Minute</Text>
          <View style={styles.grid}>
            {MINUTES.map((m) => {
              const isSelected = tempMinute === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.gridCell, isSelected && styles.gridCellActive]}
                  onPress={() => setTempMinute(m)}
                >
                  <Text style={[styles.cellText, isSelected && styles.cellTextActive]}>
                    :{m}
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
  timeBox: {
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
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clockIcon: {
    fontSize: 18,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.full,
  },
  pickerContainer: {
    paddingVertical: 4,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  periodBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  periodTextActive: {
    color: THEME.colors.textLight,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: THEME.colors.textMuted,
    marginBottom: 8,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  gridCell: {
    width: '22%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  gridCellActive: {
    backgroundColor: THEME.colors.primaryLight,
    borderColor: THEME.colors.primary,
  },
  cellText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  cellTextActive: {
    color: THEME.colors.primary,
  },
});
