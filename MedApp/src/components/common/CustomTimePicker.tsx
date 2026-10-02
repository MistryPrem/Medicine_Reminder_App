import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
  const [pickerMode, setPickerMode] = useState<'hour' | 'minute'>('hour');

  // Parse 24h string into 12h representation
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
    setPickerMode('hour');
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

  const display12h = `${initial.hour}:${initial.minute} ${initial.period}`;

  // Clock Dial Geometry
  const CLOCK_RADIUS = 110;
  const CENTER_X = 120;
  const CENTER_Y = 120;

  // 12 Hours
  const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  // 12 Minute markers (every 5 mins)
  const MINUTES_5 = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const getPosition = (index: number, total: number, radius = 90) => {
    // 0 index is top (-90 degrees)
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    const x = CENTER_X + radius * Math.cos(angle);
    const y = CENTER_Y + radius * Math.sin(angle);
    return { left: x - 18, top: y - 18 };
  };

  const currentMinNum = parseInt(tempMinute, 10) || 0;

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
        title={label || 'Select Time'}
        footer={
          <>
            <CustomButton
              title="Cancel"
              variant="outline"
              size="sm"
              onPress={() => setIsOpen(false)}
            />
            <CustomButton
              title="Confirm Time"
              variant="primary"
              size="sm"
              onPress={handleConfirm}
            />
          </>
        }
      >
        <View style={styles.pickerContainer}>
          {/* Digital Time Header (Switch between Hour and Minute) */}
          <View style={styles.timeHeader}>
            <View style={styles.digitsRow}>
              <TouchableOpacity
                style={[styles.digitBox, pickerMode === 'hour' && styles.digitBoxActive]}
                onPress={() => setPickerMode('hour')}
              >
                <Text style={[styles.digitText, pickerMode === 'hour' && styles.digitTextActive]}>
                  {tempHour.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.subModeText}>HOUR</Text>
              </TouchableOpacity>

              <Text style={styles.colonText}>:</Text>

              <TouchableOpacity
                style={[styles.digitBox, pickerMode === 'minute' && styles.digitBoxActive]}
                onPress={() => setPickerMode('minute')}
              >
                <Text style={[styles.digitText, pickerMode === 'minute' && styles.digitTextActive]}>
                  {tempMinute.padStart(2, '0')}
                </Text>
                <Text style={styles.subModeText}>MIN</Text>
              </TouchableOpacity>
            </View>

            {/* AM / PM Segmented Control */}
            <View style={styles.amPmContainer}>
              <TouchableOpacity
                style={[styles.amPmBtn, tempPeriod === 'AM' && styles.amPmBtnActive]}
                onPress={() => setTempPeriod('AM')}
              >
                <Text style={[styles.amPmText, tempPeriod === 'AM' && styles.amPmTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.amPmBtn, tempPeriod === 'PM' && styles.amPmBtnActive]}
                onPress={() => setTempPeriod('PM')}
              >
                <Text style={[styles.amPmText, tempPeriod === 'PM' && styles.amPmTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Prompt text */}
          <Text style={styles.hintText}>
            {pickerMode === 'hour' ? 'Tap an hour on the clock dial' : 'Tap a minute or fine-tune with stepper below'}
          </Text>

          {/* Circular Clock Dial */}
          <View style={styles.clockCircle}>
            <View style={styles.centerDot} />

            {pickerMode === 'hour'
              ? HOURS.map((h, idx) => {
                  const isSelected = tempHour === h;
                  const pos = getPosition(idx, 12, 85);
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.clockNum, pos, isSelected && styles.clockNumActive]}
                      onPress={() => {
                        setTempHour(h);
                        setPickerMode('minute'); // Auto advance to minute
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.clockNumText, isSelected && styles.clockNumTextActive]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : MINUTES_5.map((m, idx) => {
                  const mNum = parseInt(m, 10);
                  const isSelected = Math.abs(currentMinNum - mNum) < 2.5;
                  const pos = getPosition(idx, 12, 85);
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.clockNum, pos, isSelected && styles.clockNumActive]}
                      onPress={() => setTempMinute(m)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.clockNumText, isSelected && styles.clockNumTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
          </View>

          {/* Minute Quick Stepper (when in minute mode) */}
          <View style={styles.minuteStepperRow}>
            <TouchableOpacity
              style={styles.stepPill}
              onPress={() => {
                let n = (currentMinNum - 1 + 60) % 60;
                setTempMinute(n.toString().padStart(2, '0'));
              }}
            >
              <Text style={styles.stepPillText}>-1 min</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeTogglePill}
              onPress={() => setPickerMode(pickerMode === 'hour' ? 'minute' : 'hour')}
            >
              <Text style={styles.modeToggleText}>
                {pickerMode === 'hour' ? '👉 Switch to Minutes' : '👈 Switch to Hours'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepPill}
              onPress={() => {
                let n = (currentMinNum + 1) % 60;
                setTempMinute(n.toString().padStart(2, '0'));
              }}
            >
              <Text style={styles.stepPillText}>+1 min</Text>
            </TouchableOpacity>
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
    minHeight: 48,
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
    fontWeight: '800',
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
    alignItems: 'center',
    paddingVertical: 6,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  digitBox: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radii.sm,
    borderWidth: 1.5,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
  },
  digitBoxActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
  },
  digitText: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  digitTextActive: {
    color: THEME.colors.primary,
  },
  subModeText: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  colonText: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  amPmContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  amPmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.sm,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
  },
  amPmBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  amPmText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  amPmTextActive: {
    color: '#ffffff',
  },
  hintText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 12,
    textAlign: 'center',
  },
  clockCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: THEME.colors.surfaceBorder,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.primary,
  },
  clockNum: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockNumActive: {
    backgroundColor: THEME.colors.primary,
  },
  clockNumText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  clockNumTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  minuteStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  stepPill: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.radii.sm,
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  modeTogglePill: {
    flex: 1,
    backgroundColor: THEME.colors.primaryLight,
    paddingVertical: 7,
    borderRadius: THEME.radii.sm,
    alignItems: 'center',
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});
