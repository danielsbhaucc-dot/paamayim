import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { a11y, labelProgress } from '../utils/a11y';
import { colors, radii, typography } from '../theme/tokens';

type Props = {
  done: number;
  total: number;
  label?: string;
};

export function ProgressBar({ done, total, label = 'התקדמות' }: Props) {
  const ratio = total === 0 ? 0 : done / total;
  const pct = Math.round(ratio * 100);

  return (
    <View
      style={styles.wrap}
      accessibilityRole={a11y.roles.progressbar}
      accessibilityLabel={labelProgress(done, total, label)}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View style={styles.meta}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

/** עיגול התקדמות גדול — מסלול עד שבת */
export function ProgressRing({
  current,
  total,
  caption,
}: {
  current: number;
  total: number;
  caption?: string;
}) {
  return (
    <View
      style={styles.ringWrap}
      accessibilityLabel={labelProgress(current, total, caption ?? 'עליות')}
    >
      <View style={styles.ring}>
        <Text style={styles.ringNum}>
          {current}/{total}
        </Text>
        {caption ? <Text style={styles.ringCap}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  meta: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pct: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  track: {
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  ringWrap: { alignItems: 'center' },
  ring: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 10,
    borderColor: 'rgba(42, 154, 163, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  ringCap: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
