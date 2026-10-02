import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { CustomModal } from './CustomModal';
import { CustomButton } from './CustomButton';
import { THEME } from '../../constants/theme';

export interface CustomTimePickerProps {
  label?: string;
  value: string; // "HH:MM" 24h format e.g. "08:00" or "15:39"
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
    const rawMin = parseInt(parts[1], 10);
    const m = isNaN(rawMin) ? '00' : Math.min(59, Math.max(0, rawMin)).toString().padStart(2, '0');
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

    let validMin = parseInt(tempMinute, 10);
    if (isNaN(validMin) || validMin < 0) validMin = 0;
    if (validMin > 59) validMin = 59;

    const formattedH24 = h24.toString().padStart(2, '0');
    const formattedMin = validMin.toString().padStart(2, '0');
    onChange(`${formattedH24}:${formattedMin}`);
    setIsOpen(false);
  };

  const adjustMinute = (delta: number) => {
    const current = parseInt(tempMinute, 10) || 0;
    let next = (current + delta) % 60;
    if (next < 0) next += 60;
    setTempMinute(next.toString().padStart(2, '0'));
  };

  const handleCustomMinuteChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean === '') {
      setTempMinute('');
      return;
    }
    const num = parseInt(clean, 10);
    if (num > 59) {
      setTempMinute('59');
    } else {
      setTempMinute(clean.slice(0, 2));
    }
  };

  // 12-hour display string
  const display12h = `${initial.hour}:${initial.minute} ${initial.period}`;

  const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const QUICK_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerContainer}>
          {/* Big Time Preview & Exact Minute Editor */}
          <View style={styles.previewBox}>
            <Text style={styles.previewTimeText}>
              {tempHour}:{tempMinute ? tempMinute.padStart(2, '0') : '00'}{' '}
              <Text style={styles.previewPeriodText}>{tempPeriod}</Text>
            </Text>
            <Text style={styles.previewSubtext}>Indian Standard Time (IST)</Text>
          </View>

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

          {/* Exact Minute Stepper & Manual Input */}
          <Text style={styles.sectionHeader}>Minute (Type Any 00–59 or Use + / -)</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => adjustMinute(-5)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => adjustMinute(-1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>-1</Text>
            </TouchableOpacity>

            <View style={styles.minuteInputBox}>
              <Text style={styles.minuteInputColon}>:</Text>
              <TextInput
                style={styles.minuteInput}
                keyboardType="numeric"
                maxLength={2}
                value={tempMinute}
                onChangeText={handleCustomMinuteChange}
                placeholder="00"
                placeholderTextColor={THEME.colors.textMuted}
                selectTextOnFocus
              />
            </View>

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => adjustMinute(1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => adjustMinute(5)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>+5</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Minute Preset Chips */}
          <Text style={[styles.sectionHeader, { marginTop: 12 }]}>Quick Minute Presets</Text>
          <View style={styles.quickMinutesGrid}>
            {QUICK_MINUTES.map((m) => {
              const isSelected = tempMinute === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.quickMinuteChip, isSelected && styles.quickMinuteChipActive]}
                  onPress={() => setTempMinute(m)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    :{m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
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
    paddingBottom: 16,
  },
  previewBox: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  previewTimeText: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  previewPeriodText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  previewSubtext: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
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
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  gridCell: {
    width: '23%',
    paddingVertical: 9,
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
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    padding: 8,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  stepBtn: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radii.sm,
  },
  stepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  minuteInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    borderRadius: THEME.radii.sm,
    paddingHorizontal: 8,
    minWidth: 70,
    justifyContent: 'center',
  },
  minuteInputColon: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  minuteInput: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.text,
    paddingVertical: 4,
    textAlign: 'center',
    width: 36,
  },
  quickMinutesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickMinuteChip: {
    width: '23%',
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  quickMinuteChipActive: {
    backgroundColor: THEME.colors.primaryLight,
    borderColor: THEME.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  chipTextActive: {
    color: THEME.colors.primary,
  },
});
