import { BookOpen, Languages, Lightbulb, Repeat, Sparkles } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { alignmentFor, TYPE_LABEL } from '../data/alignment';
import { aramaicTokens, hebrewTokens } from '../data/alignTokens';
import { useAppStore } from '../store/useAppStore';
import { StyleSheet, Text, View } from 'react-native';
import { MikraText } from '../reading/MikraText';
import { verseMark } from '../data/hebrew';
import type { PassKind, Verse, VerseProgress } from '../data/types';
import { nw, passHue } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { PassTile } from './PassTile';
import { PrimaryButton } from './PrimaryButton';
import { Divider, SectionHeader } from './Section';

type Props = {
  verse: Verse;
  progress: VerseProgress;
  onToggle: (kind: PassKind) => void;
  /** ״קראתי שניים ואחד״ — מסמן את שלושת המעברים ועובר לפסוק הבא */
  onCompleteNext?: () => void;
  /** web רחב: טקסט גדול יותר */
  large?: boolean;
};

export function VerseFocusCard({
  verse,
  progress,
  onToggle,
  onCompleteNext,
  large = false,
}: Props) {
  const long = verse.hebrew.length > 110;
  const alignMode = useAppStore((st) => st.alignMode ?? 'changes');
  const alignDrafts = useAppStore((st) => st.alignDrafts ?? false);
  const pairs = useMemo(() => alignmentFor(verse.id, alignMode, alignDrafts), [verse.id, alignMode, alignDrafts]);
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => setActive(null), [verse.id]);
  const marks = pairs.map((p, i) => ({ key: String(i), from: p.he[0], to: p.he[1], deviant: p.type !== 'literal' }));
  const ap = active != null ? pairs[active] : null;
  const arToks = aramaicTokens(verse.onkelos);
  const heToks = ap ? hebrewTokens(verse.hebrew, false) : [];
  const allDone = progress.mikra1 && progress.mikra2 && progress.onkelos;

  return (
    <View>
      <GlassSurface reading variant="strong" radius={24} contentStyle={{ padding: 22 }}>
        <MikraText
          text={verse.hebrew}
          brk={verse.brk}
          phrases={marks}
          activePhrase={active != null ? String(active) : null}
          onPhrase={(k) => setActive(active === Number(k) ? null : Number(k))}
          style={{
            ...nw.type.verseXL,
            lineHeight: 64,
            ...(long ? { fontSize: 26, lineHeight: 54 } : null),
            ...(large
              ? long
                ? { fontSize: 30, lineHeight: 62 }
                : { fontSize: 36, lineHeight: 74 }
              : null),
            color: nw.color.ink,
            textAlign: rtl.textRight,
            writingDirection: 'rtl',
          }}
        />
        <Text
          style={{
            ...nw.type.verseRef,
            color: nw.color.inkSoft,
            textAlign: rtl.textRight,
            writingDirection: 'rtl',
            marginTop: 6,
          }}
        >
          {`(${verseMark(verse.chapter)}, ${verseMark(verse.verse)})`}
        </Text>

        {ap ? (
          <GlassSurface variant="card" radius={18} style={{ marginTop: 12 }} contentStyle={{ padding: 14, gap: 6 }}>
            <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 8 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: ap.type === 'literal' ? 'rgba(31,158,140,0.12)' : 'rgba(183,121,43,0.14)' }}>
                <Text style={{ fontFamily: fonts.uiBold, fontSize: 13, color: ap.type === 'literal' ? nw.color.tealText : '#8A5A1C' }}>{TYPE_LABEL[ap.type]}</Text>
              </View>
              {ap.status === 'draft' ? <Text style={{ fontFamily: fonts.ui, fontSize: 12, color: nw.color.inkSoft }}>טיוטה</Text> : null}
              <View style={{ flex: 1 }} />
              <Pressable accessibilityRole="button" accessibilityLabel="סגירה" onPress={() => setActive(null)} hitSlop={10}>
                <Text style={{ fontSize: 18, color: nw.color.inkSoft }}>×</Text>
              </Pressable>
            </View>
            <Text style={{ fontFamily: fonts.uiSemi, fontSize: 17, lineHeight: 26, color: nw.color.ink, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
              {`${heToks.slice(ap.he[0], ap.he[1] + 1).join(' ')}  ←  ${arToks.slice(ap.ar[0], ap.ar[1] + 1).join(' ')}`}
            </Text>
            {ap.note ? (
              <Text style={{ fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: nw.color.inkSoft, textAlign: rtl.textRight, writingDirection: 'rtl' }}>{ap.note}</Text>
            ) : null}
          </GlassSurface>
        ) : null}

        <View
          style={{
            flexDirection: rtl.row,
            gap: 10,
            marginTop: 22,
          }}
        >
          {/* הסדר הקלאסי: שניים מקרא ואחד תרגום */}
          <PassTile
            label="מקרא א׳"
            hue={passHue.mikra1}
            Icon={BookOpen}
            done={progress.mikra1}
            onPress={() => onToggle('mikra1')}
          />
          <PassTile
            label="מקרא ב׳"
            hue={passHue.mikra2}
            Icon={Repeat}
            done={progress.mikra2}
            onPress={() => onToggle('mikra2')}
          />
          <PassTile
            label="תרגום"
            hue={passHue.onkelos}
            Icon={Languages}
            done={progress.onkelos}
            onPress={() => onToggle('onkelos')}
          />
        </View>

        {/* התרגום תמיד גלוי — קוראים פסוק, פסוק שוב, ותרגום, בלי לחיצות מיותרות */}
        <View>
          <Divider label="תרגום אונקלוס" color={passHue.onkelos.ink} style={{ marginTop: 18, marginBottom: 6 }} spacing={0} />
          <Text
            style={{
              ...nw.type.onkelos,
              ...(large ? { fontSize: 24, lineHeight: 42 } : null),
              color: nw.color.targumInk,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginTop: 4,
            }}
          >
            {ap
              ? arToks.map((w, i) => {
                  const on = i >= ap.ar[0] && i <= ap.ar[1];
                  return (
                    <Text key={i} style={on ? { backgroundColor: ap.type === 'literal' ? 'rgba(31,158,140,0.18)' : 'rgba(183,121,43,0.2)', borderRadius: 6 } : undefined}>
                      {w + (i < arToks.length - 1 ? ' ' : '')}
                    </Text>
                  );
                })
              : verse.onkelos}
          </Text>
        </View>

        {onCompleteNext ? (
          <PrimaryButton
            variant="solid"
            icon="arrow"
            title={allDone ? 'לפסוק הבא' : 'קראתי שניים ואחד · לפסוק הבא'}
            style={{ marginTop: 18 }}
            onPress={onCompleteNext}
          />
        ) : null}
      </GlassSurface>

      <GlassSurface
        reading
        variant="card"
        radius={22}
        style={{ marginTop: 14 }}
        contentStyle={{ padding: 18 }}
      >
        <SectionHeader
          title="מה אונקלוס עשה כאן?"
          icon={<Lightbulb size={20} color={nw.color.tealIcon} strokeWidth={1.75} />}
          size="sm"
          style={{ marginTop: 0, marginBottom: 4 }}
        />
        {verse.onkelosExplanation ? (
          // הסבר שנכתב במערכת התוכן ופורסם — גובר על ההסבר האוטומטי
          <Text
            style={{
              ...nw.type.body,
              color: nw.color.inkSoft,
              marginTop: 8,
              textAlign: rtl.textRight,
              writingDirection: 'rtl',
              lineHeight: 28,
            }}
          >
            {verse.onkelosExplanation}
          </Text>
        ) : (
          <Text
            style={{
              marginTop: 8,
              textAlign: rtl.textRight,
              writingDirection: 'rtl',
              lineHeight: 28,
            }}
          >
            <Text style={{ ...nw.type.bodyStrong, color: nw.color.ink }}>
              {verse.onkelosNote.plain}.{' '}
            </Text>
            <Text style={{ ...nw.type.body, color: nw.color.inkSoft }}>
              {`${verse.onkelosNote.did}. ${verse.onkelosNote.why}.`}
            </Text>
          </Text>
        )}
      </GlassSurface>

      {verse.chidushim?.length ? (
        <GlassSurface
          reading
          variant="card"
          radius={22}
          style={{ marginTop: 14 }}
          contentStyle={{ padding: 18 }}
        >
          <View style={{ flexDirection: rtl.row, gap: 8, alignItems: 'center' }}>
            <Sparkles size={20} color={nw.color.tealIcon} strokeWidth={1.75} />
            <Text
              style={{
                fontFamily: fonts.uiBold,
                fontSize: 16,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              {verse.chidushim.length > 1 ? 'חידושים בפסוק' : 'חידוש בפסוק'}
            </Text>
          </View>
          {verse.chidushim.map((c, i) => (
            <View
              key={i}
              style={
                i > 0
                  ? {
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: nw.color.divider,
                    }
                  : { marginTop: 8 }
              }
            >
              {c.title ? (
                <Text style={[styles.rtlText, { ...nw.type.bodyStrong, color: nw.color.ink }]}>
                  {c.title}
                </Text>
              ) : null}
              {c.text ? (
                <Text
                  style={[
                    styles.rtlText,
                    {
                      ...nw.type.body,
                      color: nw.color.inkSoft,
                      lineHeight: 28,
                      marginTop: c.title ? 2 : 0,
                    },
                  ]}
                >
                  {c.text}
                </Text>
              ) : null}
              {c.source ? (
                <Text
                  style={[
                    styles.rtlText,
                    {
                      ...nw.type.caption,
                      color: nw.color.tealText,
                      marginTop: 4,
                    },
                  ]}
                >
                  {c.source}
                </Text>
              ) : null}
            </View>
          ))}
        </GlassSurface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rtlText: { textAlign: rtl.textRight, writingDirection: 'rtl' },
});
