/**
 * Form controls for the "Models & Provider Credentials" screen — ported
 * from the legacy model-selection-view's selects, sliders, and toggles,
 * rebuilt with native mobile patterns:
 * - SelectField  → bottom-sheet option picker (no HTML <select>)
 * - StepperRow   → −/+ stepper (replaces range sliders)
 * - ToggleRow    → labeled Switch
 * - SectionCard  → titled card with optional badge
 */
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExiaCard, ExiaText, useTheme } from '@exia/shared-ui';

export interface SelectOption {
  value: string;
  label: string;
  /** Optional secondary line shown under the label (e.g. latency or help). */
  hint?: string;
}

// ---------------------------------------------------------------------------
// SectionCard
// ---------------------------------------------------------------------------

export function SectionCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <ExiaCard style={styles.section}>
      <View style={styles.sectionHeader}>
        <ExiaText style={styles.sectionTitle}>{title}</ExiaText>
        {badge ? <BadgePill label={badge} /> : null}
      </View>
      {children}
    </ExiaCard>
  );
}

/** Small uppercase badge (legacy "ZERO RETENTION (ZDR)" style chips). */
export function BadgePill({
  label,
  tone = 'info',
}: {
  label: string;
  tone?: 'info' | 'muted' | 'ok';
}) {
  const t = useTheme();
  const palette = {
    info: { bg: 'rgba(31, 213, 249, 0.14)', fg: t.primary },
    muted: { bg: t.muted, fg: t.mutedForeground },
    ok: { bg: 'rgba(16, 185, 129, 0.16)', fg: brand.liveEmerald },
  } as const;
  const c = palette[tone];
  return (
    <View style={[styles.badgePill, { backgroundColor: c.bg }]}>
      <ExiaText style={[styles.badgeText, { color: c.fg }]}>{label}</ExiaText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SelectField — tap to open a bottom-sheet option picker
// ---------------------------------------------------------------------------

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const t = useTheme();
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.field}>
      <ExiaText variant="caption">{label}</ExiaText>
      <OptionPickerModal
        title={label}
        options={options}
        value={value}
        onSelect={onChange}
        trigger={(open) => (
          <Pressable
            accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
            accessibilityRole="button"
            onPress={open}
            style={({ pressed }) => [
              styles.selectTrigger,
              { backgroundColor: t.input, borderColor: t.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ExiaText numberOfLines={1} style={styles.selectValue}>
              {selected?.label ?? placeholder}
            </ExiaText>
            <Ionicons name="chevron-down" size={16} color={t.mutedForeground} />
          </Pressable>
        )}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// OptionPickerModal — bottom-sheet single-select (SpeakerPickerModal pattern)
// ---------------------------------------------------------------------------

export function OptionPickerModal({
  title,
  options,
  value,
  onSelect,
  trigger,
}: {
  title: string;
  options: SelectOption[];
  value: string;
  onSelect: (value: string) => void;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  return (
    <>
      {trigger(() => setVisible(true))}
      <Modal animationType="slide" onRequestClose={() => setVisible(false)} transparent visible={visible}>
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss option picker"
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: t.card,
                borderColor: t.border,
                paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xs,
              },
            ]}
          >
            {/* Sheet Handle Grabber */}
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: t.mutedForeground }]} />
            </View>

            <ExiaText style={styles.modalTitle}>{title}</ExiaText>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    accessibilityLabel={`Select ${item.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onSelect(item.value);
                      setVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      active && { backgroundColor: t.input },
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View style={styles.optionText}>
                      <ExiaText numberOfLines={2}>{item.label}</ExiaText>
                      {item.hint ? (
                        <ExiaText variant="caption" numberOfLines={1}>
                          {item.hint}
                        </ExiaText>
                      ) : null}
                    </View>
                    {active ? <Ionicons name="checkmark" size={18} color={t.primary} /> : null}
                  </Pressable>
                );
              }}
            />
            <Pressable
              accessibilityLabel={`Close ${title} picker`}
              accessibilityRole="button"
              onPress={() => setVisible(false)}
              style={({ pressed }) => [
                styles.modalClose,
                { backgroundColor: t.input, borderColor: t.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <ExiaText style={styles.modalCloseText}>Done</ExiaText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// StepperRow — − / value / + (replaces legacy range sliders)
// ---------------------------------------------------------------------------

export function StepperRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Formats the displayed value (e.g. `0.7` → `0.70`, seconds → `1.0s`). */
  format?: (value: number) => string;
  hint?: string;
}) {
  const t = useTheme();
  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next * 100) / 100));
  const decDisabled = value <= min;
  const incDisabled = value >= max;

  return (
    <View style={styles.stepper}>
      <View style={styles.stepperText}>
        <ExiaText variant="caption">{label}</ExiaText>
        {hint ? (
          <ExiaText variant="caption" numberOfLines={2}>
            {hint}
          </ExiaText>
        ) : null}
      </View>
      <View style={styles.stepperControl}>
        <Pressable
          accessibilityLabel={`Decrease ${label}`}
          accessibilityRole="button"
          disabled={decDisabled}
          onPress={() => onChange(clamp(value - step))}
          style={({ pressed }) => [
            styles.stepperButton,
            { backgroundColor: t.input, opacity: decDisabled ? 0.35 : pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="remove" size={18} color={t.foreground} />
        </Pressable>
        <ExiaText variant="mono" style={styles.stepperValue}>
          {format ? format(value) : String(value)}
        </ExiaText>
        <Pressable
          accessibilityLabel={`Increase ${label}`}
          accessibilityRole="button"
          disabled={incDisabled}
          onPress={() => onChange(clamp(value + step))}
          style={({ pressed }) => [
            styles.stepperButton,
            { backgroundColor: t.input, opacity: incDisabled ? 0.35 : pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="add" size={18} color={t.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ToggleRow — label + optional description + Switch
// ---------------------------------------------------------------------------

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.toggle}>
      <View style={styles.toggleText}>
        <ExiaText>{label}</ExiaText>
        {description ? <ExiaText variant="caption">{description}</ExiaText> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: t.input, true: t.primary }}
        thumbColor={value ? t.primaryForeground : t.mutedForeground}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginBottom: spacing.md },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  sectionTitle: { fontWeight: '600' },
  badgePill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  field: { gap: spacing.xs },
  selectTrigger: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  selectValue: { flex: 1 },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '80%',
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.35,
  },
  modalTitle: { fontWeight: '600', marginBottom: spacing.md, fontSize: 16 },
  optionRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
  },
  optionText: { flex: 1, gap: 2 },
  modalClose: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalCloseText: {
    fontWeight: '600',
    fontSize: 15,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  stepperText: { flex: 1, gap: 2 },
  stepperControl: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  stepperButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 44,
    width: 44,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  stepperValue: { minWidth: 56, textAlign: 'center' },
  toggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  toggleText: { flex: 1, gap: 2 },
});
