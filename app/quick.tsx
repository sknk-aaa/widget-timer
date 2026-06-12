import * as React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTimersStore } from '../src/store/timers';
import { useTheme } from '../src/ui/theme';
import { Dial } from '../src/ui/components/Dial';
import { Button } from '../src/ui/components/Button';
import { SheetHeader } from '../src/ui/components/common';
import { t } from '../src/i18n';

const QUICK_ICON = 'timer';
const QUICK_COLOR = 'orange';

export default function QuickScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing } = useTheme();
  const s = t();
  const [durationSec, setDurationSec] = React.useState(300);

  const onStart = async () => {
    if (durationSec <= 0) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await useTimersStore.getState().start({
      presetId: null,
      icon: QUICK_ICON,
      color: QUICK_COLOR,
      durationSec,
      source: 'quick',
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgElevated }} accessibilityViewIsModal>
      <View
        style={{
          flex: 1,
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
      >
        <SheetHeader title={s.quick.title} onClose={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Dial valueSec={durationSec} onChange={setDurationSec} />
        </View>
        <Button title={s.quick.start} onPress={onStart} disabled={durationSec <= 0} />
      </View>
    </View>
  );
}
