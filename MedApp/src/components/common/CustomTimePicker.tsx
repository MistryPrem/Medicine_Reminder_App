import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
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

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')); // "00" to "59"
const PERIODS = ['AM', 'PM'] as const;

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  label,
  value,
  onChange,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse 24h string into 12h representation
  const parseTime = (timeStr: string) => {
    const parts = (timeStr || '08:00').split(':');
    const h24 = parseInt(parts[0], 10) || 8;
    const rawMin = parseInt(parts[1], 10);
    const m = isNaN(rawMin) ? '00' : Math.min(59, Math.max(0, rawMin)).toString().padStart(2, '0');
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return { hour: h12, minute: m, period: period as 'AM' | 'PM' };
  };

  const initial = parseTime(value);
  const [selectedHour, setSelectedHour] = useState<number>(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState<string>(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initial.period);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  const openPicker = () => {
    const current = parseTime(value);
    setSelectedHour(current.hour);
    setSelectedMinute(current.minute);
    setSelectedPeriod(current.period);
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const hIdx = HOURS.indexOf(selectedHour);
        if (hIdx >= 0 && hourScrollRef.current) {
          hourScrollRef.current.scrollTo({ y: hIdx * ITEM_HEIGHT, animated: false });
        }
        const mIdx = MINUTES.indexOf(selectedMinute);
        if (mIdx >= 0 && minuteScrollRef.current) {
          minuteScrollRef.current.scrollTo({ y: mIdx * ITEM_HEIGHT, animated: false });
        }
        const pIdx = PERIODS.indexOf(selectedPeriod);
        if (pIdx >= 0 && periodScrollRef.current) {
          periodScrollRef.current.scrollTo({ y: pIdx * ITEM_HEIGHT, animated: false });
        }
      }, 50);
    }
  }, [isOpen]);

  const handleHourScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(HOURS.length - 1, index));
    setSelectedHour(HOURS[clamped]);
    hourScrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  const handleMinuteScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(MINUTES.length - 1, index));
    setSelectedMinute(MINUTES[clamped]);
    minuteScrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  const handlePeriodScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(PERIODS.length - 1, index));
    setSelectedPeriod(PERIODS[clamped]);
    periodScrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  const handleConfirm = () => {
    let h24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour < 12) h24 += 12;
    if (selectedPeriod === 'AM' && selectedHour === 12) h24 = 0;

    const formattedH24 = h24.toString().padStart(2, '0');
    const formattedMin = selectedMinute.padStart(2, '0');
    onChange(`${formattedH24}:${formattedMin}`);
    setIsOpen(false);
  };

  const displayTime = `${initial.hour}:${initial.minute} ${initial.period}`;

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
          <Text style={styles.timeText}>{displayTime}</Text>
        </View>
        <Text style={styles.badgeText}>Select</Text>
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
          {/* Header Preview */}
          <View style={styles.headerPreview}>
            <Text style={styles.previewLabel}>Time</Text>
            <Text style={styles.previewValue}>
              {selectedHour}:{selectedMinute} {selectedPeriod}
            </Text>
          </View>

          {/* Drum Roll / Wheel Picker Container */}
          <View style={styles.wheelsContainer}>
            {/* Center Selection Highlight Bar */}
            <View style={styles.selectionHighlight} pointerEvents="none" />

            {/* Hours Column */}
            <View style={styles.wheelColumn}>
              <ScrollView
                ref={hourScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleHourScrollEnd}
                onScrollEndDrag={handleHourScrollEnd}
                nestedScrollEnabled
                contentContainerStyle={styles.scrollContent}
              >
                {HOURS.map((h) => {
                  const isSelected = selectedHour === h;
                  return (
                    <TouchableOpacity
                      key={`hour-${h}`}
                      style={styles.wheelItem}
                      onPress={() => {
                        setSelectedHour(h);
                        const idx = HOURS.indexOf(h);
                        hourScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Minute Column (00 - 59) */}
            <View style={styles.wheelColumn}>
              <ScrollView
                ref={minuteScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMinuteScrollEnd}
                onScrollEndDrag={handleMinuteScrollEnd}
                nestedScrollEnabled
                contentContainerStyle={styles.scrollContent}
              >
                {MINUTES.map((m) => {
                  const isSelected = selectedMinute === m;
                  return (
                    <TouchableOpacity
                      key={`min-${m}`}
                      style={styles.wheelItem}
                      onPress={() => {
                        setSelectedMinute(m);
                        const idx = MINUTES.indexOf(m);
                        minuteScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* AM / PM Column */}
            <View style={styles.wheelColumn}>
              <ScrollView
                ref={periodScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handlePeriodScrollEnd}
                onScrollEndDrag={handlePeriodScrollEnd}
                nestedScrollEnabled
                contentContainerStyle={styles.scrollContent}
              >
                {PERIODS.map((p) => {
                  const isSelected = selectedPeriod === p;
                  return (
                    <TouchableOpacity
                      key={`period-${p}`}
                      style={styles.wheelItem}
                      onPress={() => {
                        setSelectedPeriod(p);
                        const idx = PERIODS.indexOf(p);
                        periodScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
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
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
  },
  pickerContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  headerPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    marginBottom: 10,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  previewValue: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  wheelsContainer: {
    flexDirection: 'row',
    height: WHEEL_HEIGHT,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 8,
    right: 8,
    height: ITEM_HEIGHT,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    zIndex: 0,
  },
  wheelColumn: {
    flex: 1,
    height: WHEEL_HEIGHT,
    zIndex: 1,
  },
  scrollContent: {
    paddingVertical: ITEM_HEIGHT * 2, // 2 items padding above & below to center first/last
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontSize: 17,
    fontWeight: '500',
    color: THEME.colors.textMuted,
    opacity: 0.5,
  },
  wheelTextSelected: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.text,
    opacity: 1,
  },
});
