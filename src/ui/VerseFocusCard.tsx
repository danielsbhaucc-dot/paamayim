import { BookOpen, Languages, Lightbulb, Repeat, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { verseMark } from '../data/hebrew';
import type { PassKind, Verse, VerseProgress } from '../data/types';
import { nw, passHue } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { PassTile } from './PassTile';
import { PrimaryButton } from './PrimaryButton';

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
  const allDone = progress.mikra1 && progress.mikra2 && progress.onkelos;

  return (
    <View>
      <GlassSurface variant="strong" radius={24} contentStyle={{ padding: 22 }}>
        <Text
          style={{
            ...nw.type.verseXL,
            ...(long ? { fontSize: 26, lineHeight: 44 } : null),
            ...(large
              ? long
                ? { fontSize: 30, lineHeight: 52 }
                : { fontSize: 36, lineHeight: 62 }
              : null),
            color: nw.color.ink,
            textAlign: rtl.textRight,
            writingDirection: 'rtl',
          }}
        >
          {verse.hebrew}
        </Text>
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
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: nw.color.divider,
              marginTop: 18,
            }}
          />
          <Text
            style={{
              ...nw.type.caption,
              color: passHue.onkelos.ink,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginTop: 12,
            }}
          >
            תרגום אונקלוס
          </Text>
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
            {verse.onkelos}
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
        variant="card"
        radius={22}
        style={{ marginTop: 14 }}
        contentStyle={{ padding: 18 }}
      >
        <View style={{ flexDirection: rtl.row, gap: 8, alignItems: 'center' }}>
          <Lightbulb size={22} color={nw.color.tealIcon} strokeWidth={1.75} />
          <Text
            style={{
              fontFamily: fonts.uiBold,
              fontSize: 16,
              color: nw.color.ink,
              textAlign: rtl.textRight,
              writingDirection: 'rtl',
            }}
          >
            מה אונקלוס עשה כאן?
          </Text>
        </View>
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
