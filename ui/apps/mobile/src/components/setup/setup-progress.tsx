import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaText, useTheme } from '@exia/shared-ui';

export interface SetupProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: {
    number: number;
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
  }[];
  onSelectStep?: (step: number) => void;
}

export function SetupProgress({ currentStep, steps }: SetupProgressProps) {
  const t = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((s, index) => {
          const isCurrent = s.number === currentStep;
          const isCompleted = s.number < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={s.number}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isCurrent
                        ? brand.electricCyan
                        : isCompleted
                          ? brand.liveEmerald
                          : t.muted,
                      borderColor: isCurrent
                        ? brand.electricCyan
                        : isCompleted
                          ? brand.liveEmerald
                          : t.border,
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color="#090909" />
                  ) : (
                    <ExiaText
                      style={[
                        styles.stepNum,
                        {
                          color: isCurrent ? '#090909' : t.mutedForeground,
                          fontWeight: isCurrent ? '700' : '500',
                        },
                      ]}
                    >
                      {s.number}
                    </ExiaText>
                  )}
                </View>
                <ExiaText
                  variant="caption"
                  numberOfLines={1}
                  style={[
                    styles.stepLabel,
                    {
                      color: isCurrent
                        ? brand.electricCyan
                        : isCompleted
                          ? t.foreground
                          : t.mutedForeground,
                      fontWeight: isCurrent ? '600' : '400',
                    },
                  ]}
                >
                  {s.title}
                </ExiaText>
              </View>

              {!isLast ? (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: isCompleted ? brand.liveEmerald : t.border,
                    },
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  stepItem: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 68,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    marginBottom: 16,
    minWidth: 12,
  },
});
