import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';

type Props = {
  label: string;
  done: boolean;
  inProgress: boolean;
  caption?: string;
  last?: boolean;
};

export function CheckRow({ label, done, inProgress, caption, last }: Props) {
  return (
    <View
      style={{
        minHeight: 64,
        flexDirection: rtl.row,
        alignItems: 'center',
        gap: 14,
        paddingVertical: 10,
        ...(!last
          ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: nw.color.divider }
          : null),
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? nw.color.tealBright : 'rgba(255,255,255,0.6)',
          borderWidth: done ? 0 : 1.5,
          borderColor: 'rgba(11,42,74,0.18)',
        }}
      >
        {done ? <Check size={18} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...nw.type.bodyStrong,
            color: nw.color.ink,
            textAlign: rtl.textRight,
            writingDirection: 'rtl',
          }}
        >
          {label}
        </Text>
        {caption ? (
          <Text
            style={{
              ...nw.type.caption,
              color: nw.color.inkMuted,
              textAlign: rtl.textRight,
              writingDirection: 'rtl',
            }}
          >
            {caption}
          </Text>
        ) : null}
      </View>

      <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
        {done ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: nw.color.tealSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: nw.color.tealBright,
              }}
            />
          </View>
        ) : inProgress ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: nw.color.tealSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: nw.color.teal,
              }}
            />
          </View>
        ) : (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: nw.color.radioOff,
            }}
          />
        )}
      </View>
    </View>
  );
}
