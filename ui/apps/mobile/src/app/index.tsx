import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import {
  ExiaButton,
  ExiaCard,
  ExiaScreen,
  ExiaText,
  useTheme,
} from '@exia/shared-ui';
import { formatDuration } from '@exia/shared-logic';

/**
 * Landing screen — proves the shared-package wiring end to end
 * (design-tokens -> shared-ui -> shared-logic) and links to the ported
 * sign-in screen. Real screens replace this as the legacy web UI is ported
 * (Milestones 3-4 of ui/README.md).
 */
export default function Home() {
  const t = useTheme();

  return (
    <ExiaScreen>
      <View style={styles.header}>
        <ExiaText variant="title">Exia</ExiaText>
        <ExiaText variant="caption">Your private home AI assistant</ExiaText>
      </View>

      <ExiaCard>
        <ExiaText>Shared foundation is wired:</ExiaText>
        <ExiaText variant="mono">@exia/design-tokens · @exia/shared-ui · @exia/shared-logic</ExiaText>
        <ExiaText variant="mono">formatDuration(3725) = {formatDuration(3725)}</ExiaText>
      </ExiaCard>

      <ExiaButton label="Sign in" onPress={() => router.push('/login')} />
      <ExiaButton label="Start voice session (later)" variant="secondary" onPress={() => {}} />

      <ExiaText variant="caption" style={styles.footer}>
        Screen canvas: {t.background}
      </ExiaText>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
    marginBottom: 24,
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
  },
});
