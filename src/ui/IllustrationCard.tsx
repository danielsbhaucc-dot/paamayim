import { Image } from 'expo-image';
import React from 'react';
import { View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  aspectRatio?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function IllustrationCard({
  source,
  aspectRatio = 16 / 10,
  radius = 16,
  style,
}: Props) {
  return (
    <View
      style={[
        {
          width: '100%',
          aspectRatio,
          borderRadius: radius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Image
        source={source}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
