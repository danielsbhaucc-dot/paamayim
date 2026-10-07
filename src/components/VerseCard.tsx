import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PassKind, Verse, VerseProgress } from '../data/types';
import { fonts } from '../theme/fonts';
import { colors, radii } from '../theme/tokens';
import { GlassCard } from './GlassCard';
import { PassToggles } from './PassToggles';

type Props = {
  verse: Verse;
  progress: VerseProgress;
  onToggle: (kind: PassKind) => void;
};

export function VerseCard({ verse, progress, onToggle }: Props) {
  const ref = `${verse.chapter}:${verse.verse}`;

  return (
    <View style={styles.wrap}>
      <GlassCard strong round="xl" accessibilityLabel={`פסוק ${ref}`}>
        <View style={styles.header}>
          <Text style={styles.book}>בראשית</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{ref}</Text>
          </View>
        </View>

        <Text style={styles.hebrew} accessibilityLabel={`מקרא: ${verse.hebrew}`}>
          {verse.hebrew}
        </Text>

        <PassToggles progress={progress} onToggle={onToggle} />

        {(progress.onkelos || progress.mikra1) && (
          <View style={styles.onkelosBox} accessibilityLabel={`תרגום אונקלוס: ${verse.onkelos}`}>
            <Text style={styles.onkelosTitle}>תרגום אונקלוס</Text>
            <Text style={styles.onkelosText}>{verse.onkelos}</Text>
          </View>
        )}
      </GlassCard>

      <GlassCard round="lg">
        <View style={styles.insightHeader}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={styles.insightTitle}>מה אונקלוס עשה כאן?</Text>
        </View>
        <Text style={styles.insightLine}>
          <Text style={styles.insightStrong}>{verse.onkelosNote.plain}. </Text>
          {verse.onkelosNote.did}. {verse.onkelosNote.why}.
        </Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18, gap: 10 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  book: {
    fontFamily: fonts.uiSemi,
    fontSize: 12,
    color: colors.textMuted,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(42, 168, 176, 0.35)',
  },
  badgeText: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.primary,
  },
  hebrew: {
    fontFamily: fonts.verse,
    fontSize: 28,
    lineHeight: 46,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  onkelosBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(20,56,63,0.12)',
  },
  onkelosTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.primary,
    marginBottom: 6,
    textAlign: 'right',
  },
  onkelosText: {
    fontFamily: fonts.verseRegular,
    fontSize: 17,
    lineHeight: 28,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  insightHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: colors.primary,
  },
  insightLine: {
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  insightStrong: {
    fontFamily: fonts.uiBold,
    color: colors.text,
  },
});
