import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  CustomButton,
  CustomTextInput,
  CustomDropdown,
  CustomTimePicker,
  CustomDatePicker,
  CustomCard,
} from '../components/common';
import { THEME } from '../constants/theme';
import * as medicationService from '../services/medicationService';

const DOSAGE_UNITS = [
  { label: 'Tablet', value: 'tablet' as const },
  { label: 'Capsule', value: 'capsule' as const },
  { label: 'mg (Milligrams)', value: 'mg' as const },
  { label: 'ml (Milliliters)', value: 'ml' as const },
  { label: 'Drops', value: 'drop' as const },
  { label: 'Patch', value: 'patch' as const },
];

const FREQUENCY_OPTIONS = [
  { label: 'Once Daily', value: 'daily' as const },
  { label: 'Twice Daily (Morning & Night)', value: 'twice_daily' as const },
  { label: 'Three Times a Day', value: 'thrice_daily' as const },
  { label: 'Weekly', value: 'weekly' as const },
  { label: 'As Needed (SOS)', value: 'as_needed' as const },
];

export const AddMedicationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, elderlyProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('1');
  const [dosageUnit, setDosageUnit] = useState<'tablet' | 'capsule' | 'mg' | 'ml' | 'drop' | 'patch'>('tablet');
  const [instructions, setInstructions] = useState('Take after breakfast');
  const [currentStock, setCurrentStock] = useState('30');
  const [refillThreshold, setRefillThreshold] = useState('7');

  // Schedule States
  const [frequency, setFrequency] = useState<'daily' | 'twice_daily' | 'thrice_daily' | 'weekly' | 'as_needed'>('daily');
  const [time1, setTime1] = useState('08:00');
  const [time2, setTime2] = useState('20:00');
  const [time3, setTime3] = useState('14:00');
  const [startDate, setStartDate] = useState(new Date());

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast({ message: 'Medication name is required.', type: 'warning' });
      return;
    }
    if (!dosage.trim()) {
      showToast({ message: 'Dosage is required.', type: 'warning' });
      return;
    }

    const targetElderlyId = user?.role === 'elderly' ? user._id : elderlyProfile?._id || user?._id;
    if (!targetElderlyId) {
      showToast({ message: 'User identifier not found.', type: 'error' });
      return;
    }

    let scheduledTimes = [time1];
    if (frequency === 'twice_daily') {
      scheduledTimes = [time1, time2];
    } else if (frequency === 'thrice_daily') {
      scheduledTimes = [time1, time3, time2];
    }

    try {
      setIsSubmitting(true);
      await medicationService.createMedication({
        elderlyId: targetElderlyId,
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        dosage: dosage.trim(),
        dosageUnit,
        instructions: instructions.trim() || undefined,
        currentStock: parseInt(currentStock, 10) || 30,
        refillThreshold: parseInt(refillThreshold, 10) || 7,
        schedule: {
          frequencyType: frequency === 'as_needed' ? 'as_needed' : frequency,
          scheduledTimes,
          startDate: startDate.toISOString().split('T')[0],
          alarmSound: 'gentle_bell',
          isAlarmEnabled: true,
          vibrate: true,
        },
      });

      showToast({ message: `"${name}" schedule added successfully!`, type: 'success' });
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to create medication:', error);
      const msg = error.response?.data?.message || 'Failed to save medication. Check backend connection.';
      showToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerTitle}>Add Medication</Text>
        <Text style={styles.headerSubtitle}>Set up a new reminder & dose schedule</Text>

        {/* Basic Info Card */}
        <CustomCard style={styles.card}>
          <Text style={styles.sectionHeader}>Medicine Details</Text>
          <CustomTextInput
            label="Medicine Name"
            placeholder="e.g. Metformin, Amlodipine"
            value={name}
            onChangeText={setName}
          />

          <CustomTextInput
            label="Generic Name (Optional)"
            placeholder="e.g. Paracetamol"
            value={genericName}
            onChangeText={setGenericName}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <CustomTextInput
                label="Dosage"
                placeholder="e.g. 500 or 1"
                value={dosage}
                onChangeText={setDosage}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex1}>
              <CustomDropdown
                label="Unit"
                items={DOSAGE_UNITS}
                value={dosageUnit}
                onSelect={(val) => setDosageUnit(val)}
              />
            </View>
          </View>

          <CustomTextInput
            label="Instructions"
            placeholder="e.g. Take with warm water after dinner"
            value={instructions}
            onChangeText={setInstructions}
          />
        </CustomCard>

        {/* Schedule & Timing Card */}
        <CustomCard style={styles.card}>
          <Text style={styles.sectionHeader}>Schedule & Frequency</Text>

          <CustomDropdown
            label="Frequency"
            items={FREQUENCY_OPTIONS}
            value={frequency}
            onSelect={(val) => setFrequency(val)}
          />

          <CustomDatePicker
            label="Start Date"
            value={startDate}
            onChange={(d: Date) => setStartDate(d)}
            containerStyle={styles.pickerField}
          />

          {frequency !== 'as_needed' && (
            <View style={styles.timePickersContainer}>
              <Text style={styles.timePickerLabel}>Dose Timings:</Text>
              <CustomTimePicker
                label="Dose 1 Time"
                value={time1}
                onChange={(t: string) => setTime1(t)}
                containerStyle={styles.pickerField}
              />

              {frequency === 'thrice_daily' && (
                <CustomTimePicker
                  label="Afternoon Time"
                  value={time3}
                  onChange={(t: string) => setTime3(t)}
                  containerStyle={styles.pickerField}
                />
              )}

              {(frequency === 'twice_daily' || frequency === 'thrice_daily') && (
                <CustomTimePicker
                  label="Evening / Night Time"
                  value={time2}
                  onChange={(t: string) => setTime2(t)}
                  containerStyle={styles.pickerField}
                />
              )}
            </View>
          )}
        </CustomCard>

        {/* Stock & Refills Card */}
        <CustomCard style={styles.card}>
          <Text style={styles.sectionHeader}>Pill Inventory & Alerts</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <CustomTextInput
                label="Initial Stock"
                placeholder="30"
                value={currentStock}
                onChangeText={setCurrentStock}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex1}>
              <CustomTextInput
                label="Low Stock Warning"
                placeholder="7"
                value={refillThreshold}
                onChangeText={setRefillThreshold}
                keyboardType="numeric"
              />
            </View>
          </View>
        </CustomCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <CustomButton
            title="Save Medication"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            onPress={handleSubmit}
          />
          <CustomButton
            title="Cancel"
            variant="ghost"
            size="md"
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: THEME.spacing.lg,
    paddingBottom: 50,
  },
  headerTitle: {
    ...THEME.typography.headerLarge,
    fontSize: 26,
    color: THEME.colors.text,
  },
  headerSubtitle: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
  },
  card: {
    marginBottom: THEME.spacing.lg,
    padding: THEME.spacing.lg,
  },
  sectionHeader: {
    ...THEME.typography.headerSmall,
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  timePickersContainer: {
    marginTop: THEME.spacing.sm,
  },
  timePickerLabel: {
    ...THEME.typography.caption,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.xs,
    fontWeight: '600',
  },
  pickerField: {
    marginBottom: THEME.spacing.md,
  },
  actionButtons: {
    marginTop: THEME.spacing.sm,
    gap: 12,
  },
  cancelBtn: {
    marginTop: 4,
  },
});
