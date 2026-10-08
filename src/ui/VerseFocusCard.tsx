import { BookOpen, CheckCheck, Languages, Lightbulb } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { verseMark } from '../data/hebrew';
import type { PassKind, Verse, VerseProgress } from '../data/types';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { PassTile } from './PassTile';

type Props = {
  verse: Verse;
  progress: VerseProgress;
  onToggle: (kind: PassKind) => void;
};

export function VerseFocusCard({ verse, progress, onToggle }: Props) {
  const showOnkelos = progress.onkelos || progress.mikra1;
  const opacity = useRef(new Animated.Value(showOnkelos ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: showOnkelos ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [opacity, showOnkelos]);

  const long = verse.hebrew.length > 110;

  return (
    <View>
      <GlassSurface variant="strong" radius={24} contentStyle={{ padding: 22 }}>
        <Text
          style={{
            ...nw.type.verseXL,
            ...(long ? { fontSize: 26, lineHeight: 44 } : null),
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
          <PassTile
            label="מקרא"
            Icon={BookOpen}
            done={progress.mikra1}
            onPress={() => onToggle('mikra1')}
          />
          <PassTile
            label="תרגום אונקלוס"
            Icon={Languages}
            done={progress.onkelos}
            onPress={() => onToggle('onkelos')}
          />
          <PassTile
            label="עברתי פעמיים"
            Icon={CheckCheck}
            done={progress.mikra2}
            onPress={() => onToggle('mikra2')}
          />
        </View>

        {showOnkelos ? (
          <Animated.View style={{ opacity }}>
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
                color: nw.color.tealIcon,
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
                color: nw.color.inkSoft,
                textAlign: 'center',
                writingDirection: 'rtl',
                marginTop: 4,
              }}
            >
              {verse.onkelos}
            </Text>
          </Animated.View>
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
      </GlassSurface>
    </View>
  );
}
