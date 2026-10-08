import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MenuButton } from '../components/MenuButton';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';

type Props = {
  title: string;
  subtitle?: string;
  titleIcon?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  endSlot?: React.ReactNode;
  light?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  titleIcon,
  showBack,
  onBack,
  endSlot,
  light,
}: Props) {
  const router = useRouter();
  const canBack = showBack ?? router.canGoBack();
  const handleBack = onBack ?? (() => router.back());
  const ink = light ? '#FFFFFF' : nw.color.ink;
  const soft = light ? 'rgba(255,255,255,0.9)' : nw.color.inkSoft;

  return (
    <View
      style={{
        minHeight: 56,
        paddingHorizontal: nw.space.screenX,
        flexDirection: rtl.row,
        alignItems: 'center',
      }}
    >
      <View style={{ width: 88, alignItems: rtl.alignRight }}>
        <MenuButton light={light} />
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ flexDirection: rtl.row, gap: 8, alignItems: 'center' }}>
          {titleIcon}
          <Text
            numberOfLines={1}
            style={{
              ...nw.type.screenTitle,
              color: ink,
              textAlign: 'center',
              writingDirection: 'rtl',
            }}
          >
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text
            style={{
              ...nw.type.bodySm,
              color: soft,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          width: 88,
          flexDirection: rtl.row,
          alignItems: 'center',
          justifyContent: rtl.alignLeft,
          gap: 4,
        }}
      >
        {endSlot}
        {canBack ? (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="חזרה"
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={26} color={ink} strokeWidth={1.75} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
