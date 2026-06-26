import * as React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../src/ui/theme';
import { Button } from '../src/ui/components/Button';
import { openWriteReview } from '../src/native/review';
import { t } from '../src/i18n';

const CHANGE_VIDEO = require('../assets/onboarding/how-whiget2.mp4');

export default function WelcomeProScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();

  const player = useVideoPlayer(CHANGE_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
      }}
      accessibilityViewIsModal
    >
      <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: 0.2 }}>
        {s.proWelcome.title}
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '500', marginTop: spacing.sm, lineHeight: 21 }}>
        {s.proWelcome.body}
      </Text>

      <VideoView
        style={{
          flex: 1,
          marginVertical: spacing.lg,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />

      <View style={{ gap: spacing.md }}>
        <Button title={s.proWelcome.done} onPress={() => router.back()} />
        <Button title={s.proWelcome.review} variant="secondary" onPress={() => void openWriteReview()} />
      </View>
    </View>
  );
}
