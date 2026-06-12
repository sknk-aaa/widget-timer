import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProStore } from '../src/store/pro';
import { usePresetsStore } from '../src/store/presets';
import { listLaunchHistory } from '../src/db/repo';
import { nowMs, formatDurationShort } from '../src/domain/format';
import { useTheme } from '../src/ui/theme';
import { SheetHeader } from '../src/ui/components/common';
import { Button } from '../src/ui/components/Button';
import { PresetTileVisual } from '../src/ui/components/PresetTile';
import { LockIcon } from '../src/ui/icons/ui';
import { t } from '../src/i18n';

type Period = 'week' | 'month' | 'total';

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();

  const isPro = useProStore((st) => st.isPro);
  const presets = usePresetsStore((st) => st.presets);
  const [period, setPeriod] = React.useState<Period>('week');

  const since =
    period === 'week'
      ? nowMs() - 7 * 86400_000
      : period === 'month'
        ? nowMs() - 30 * 86400_000
        : undefined;

  const stats = React.useMemo(() => {
    const rows = listLaunchHistory(since);
    const totalCount = rows.length;
    const totalTimeSec = rows.reduce((sum, r) => sum + r.durationSec, 0);
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = r.presetId ?? '__quick__';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const byPreset = [...counts.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
    return { totalCount, totalTimeSec, byPreset };
  }, [since, isPro]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} accessibilityViewIsModal>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
      >
        <SheetHeader title={s.analytics.title} onClose={() => router.back()} />

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: c.surfaceAlt,
            borderRadius: radius.md,
            padding: 3,
            marginBottom: spacing.xl,
          }}
        >
          {(['week', 'month', 'total'] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: period === p }}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: period === p ? c.surface : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: period === p ? c.textPrimary : c.textSecondary,
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                {p === 'week' ? s.analytics.week : p === 'month' ? s.analytics.month : s.analytics.total}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ position: 'relative' }}>
          <View style={{ opacity: isPro ? 1 : 0.25 }} pointerEvents={isPro ? 'auto' : 'none'}>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
              <StatCard
                label={s.analytics.totalCount}
                value={isPro ? `${stats.totalCount}` : '—'}
                suffix="回"
              />
              <StatCard
                label={s.analytics.totalTime}
                value={isPro ? formatDurationShort(stats.totalTimeSec) : '—'}
              />
            </View>

            <Text
              style={{
                color: c.textSecondary,
                fontSize: 13,
                fontWeight: '700',
                marginBottom: spacing.md,
              }}
            >
              {s.analytics.countByPreset}
            </Text>
            <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md }}>
              {(isPro ? stats.byPreset : PLACEHOLDER).slice(0, 8).map((row, i) => {
                const preset = presets.find((p) => p.id === row.key);
                const icon = preset?.icon ?? 'timer';
                const color = preset?.color ?? 'teal';
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, overflow: 'hidden' }}>
                      <PresetTileVisual icon={icon} color={color} size={38} glow={false} />
                    </View>
                    <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.surfaceAlt }}>
                      <View
                        style={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: c.accent,
                          width: `${barWidth(row.count, isPro ? stats.byPreset : PLACEHOLDER)}%`,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        color: c.textPrimary,
                        fontSize: 15,
                        fontWeight: '700',
                        fontVariant: ['tabular-nums'],
                        width: 36,
                        textAlign: 'right',
                      }}
                    >
                      {isPro ? row.count : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {!isPro && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.xl,
              }}
            >
              <View
                style={{
                  backgroundColor: c.surface,
                  borderRadius: radius.lg,
                  padding: spacing.xl,
                  alignItems: 'center',
                  gap: spacing.md,
                  width: '100%',
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: c.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LockIcon color={c.textSecondary} size={26} />
                </View>
                <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '800' }}>
                  {s.analytics.lockedTitle}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
                  {s.analytics.lockedBody}
                </Text>
                <View style={{ width: '100%', marginTop: spacing.sm }}>
                  <Button title={s.pro.cta} onPress={() => router.push('/paywall')} />
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const PLACEHOLDER = [
  { key: 'a', count: 12 },
  { key: 'b', count: 8 },
  { key: 'c', count: 5 },
  { key: 'd', count: 3 },
];

function barWidth(count: number, rows: { count: number }[]): number {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 1);
  return Math.max(6, Math.round((count / max) * 100));
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  const { c, spacing, radius } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.lg }}>
      <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: spacing.sm }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Text style={{ color: c.textPrimary, fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
        {suffix && <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '700' }}>{suffix}</Text>}
      </View>
    </View>
  );
}
