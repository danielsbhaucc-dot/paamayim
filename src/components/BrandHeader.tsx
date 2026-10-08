import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { APP_NAME } from '../theme/brand';
import { assets, colors, typography } from '../theme/tokens';

export function BrandMark({ size = 56 }: { size?: number }) {
  return (
    <Image
      source={assets.icon}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      accessibilityLabel={APP_NAME}
      resizeMode="cover"
    />
  );
}

export function BrandHeader({
  subtitle,
  large,
}: {
  subtitle?: string;
  large?: boolean;
}) {
  return (
    <View style={[styles.header, large && styles.headerLarge]} accessibilityRole="header">
      <BrandMark size={large ? 72 : 44} />
      <View style={styles.textCol}>
        <Text style={[styles.name, large && styles.nameLarge]}>{APP_NAME}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  headerLarge: {
    flexDirection: 'column',
    gap: 14,
  },
  textCol: {
    alignItems: 'flex-end',
  },
  name: {
    ...typography.brand,
    fontSize: 24,
    color: colors.text,
  },
  nameLarge: {
    fontSize: 28,
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
