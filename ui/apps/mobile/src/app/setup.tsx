import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { SetupProgress } from '@/components/setup/setup-progress';
import { StepWelcome } from '@/components/setup/step-welcome';
import { StepBackendUrl } from '@/components/setup/step-backend-url';
import { StepLivekit } from '@/components/setup/step-livekit';
import { StepAudioCheck } from '@/components/setup/step-audio-check';
import { StepAccount } from '@/components/setup/step-account';
import { StepSummary } from '@/components/setup/step-summary';
import {
  getStoredSetupConfigSync,
  saveStoredSetupConfig,
  type DesktopSetupConfig,
} from '@/lib/desktop-config';
import { setApiBaseUrl } from '@/lib/api';

const TOTAL_STEPS = 6;

const WIZARD_STEPS: {
  number: number;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { number: 1, title: 'Welcome', icon: 'sparkles-outline' },
  { number: 2, title: 'Backend', icon: 'server-outline' },
  { number: 3, title: 'Voice', icon: 'radio-outline' },
  { number: 4, title: 'Audio', icon: 'mic-outline' },
  { number: 5, title: 'Account', icon: 'person-outline' },
  { number: 6, title: 'Ready', icon: 'checkmark-circle-outline' },
];

export default function SetupScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ step?: string; fromSettings?: string }>();

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const s = Number(params.step);
    return Number.isFinite(s) && s >= 1 && s <= TOTAL_STEPS ? s : 1;
  });

  const [config, setConfig] = useState<DesktopSetupConfig>(() => getStoredSetupConfigSync());

  const handleUpdateConfig = (partial: Partial<DesktopSetupConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      void saveStoredSetupConfig(partial);
      if (partial.apiUrl) {
        setApiBaseUrl(partial.apiUrl);
      }
      return next;
    });
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    } else {
      // Step 6: Complete setup
      await saveStoredSetupConfig({
        setupCompleted: true,
        setupCompletedAt: new Date().toISOString(),
      });
      router.replace('/');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const isSkippable = currentStep === 3 || currentStep === 4 || currentStep === 5;

  return (
    <ExiaScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Wizard Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <View style={[styles.dotIcon, { backgroundColor: brand.electricCyan }]} />
            <ExiaText style={styles.brandTitle}>EXIA DESKTOP SETUP</ExiaText>
          </View>

          <View style={styles.stepBadge}>
            <ExiaText variant="caption" style={{ color: brand.electricCyan, fontWeight: '600' }}>
              STEP {currentStep} OF {TOTAL_STEPS}
            </ExiaText>
          </View>
        </View>

        {/* Progress Stepper Indicator */}
        <SetupProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} steps={WIZARD_STEPS} />

        {/* Active Step Content */}
        <View style={styles.stepContent}>
          {currentStep === 1 ? <StepWelcome /> : null}
          {currentStep === 2 ? (
            <StepBackendUrl config={config} onChangeConfig={handleUpdateConfig} />
          ) : null}
          {currentStep === 3 ? (
            <StepLivekit config={config} onChangeConfig={handleUpdateConfig} />
          ) : null}
          {currentStep === 4 ? (
            <StepAudioCheck config={config} onChangeConfig={handleUpdateConfig} />
          ) : null}
          {currentStep === 5 ? (
            <StepAccount config={config} onChangeConfig={handleUpdateConfig} />
          ) : null}
          {currentStep === 6 ? <StepSummary config={config} /> : null}
        </View>

        {/* Bottom Navigation Buttons */}
        <View style={[styles.bottomBar, { borderTopColor: t.border }]}>
          <View style={styles.navLeft}>
            {currentStep > 1 ? (
              <ExiaButton
                label="Back"
                variant="secondary"
                size="md"
                onPress={handleBack}
                style={styles.navButton}
              />
            ) : null}

            {isSkippable ? (
              <ExiaButton
                label="Skip Step"
                variant="secondary"
                size="md"
                onPress={handleSkip}
                style={styles.navButton}
              />
            ) : null}
          </View>

          <View style={styles.navRight}>
            <ExiaButton
              label={
                currentStep === 1
                  ? 'Start Setup'
                  : currentStep === TOTAL_STEPS
                    ? 'Launch Exia'
                    : 'Continue'
              }
              variant="primary"
              size="md"
              onPress={handleNext}
              style={styles.navButtonPrimary}
            />
          </View>
        </View>
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dotIcon: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  stepBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(31, 213, 249, 0.3)',
    backgroundColor: 'rgba(31, 213, 249, 0.08)',
  },
  stepContent: {
    minHeight: 460,
    marginBottom: spacing.xl,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    minWidth: 90,
  },
  navButtonPrimary: {
    minWidth: 130,
  },
});
