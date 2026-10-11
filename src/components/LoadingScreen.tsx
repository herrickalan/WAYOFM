import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { branding } from '../branding';
import { colors as c } from '../theme';

export default function LoadingScreen({ label = 'Loading WAYO…', compact = false }: { label?: string; compact?: boolean }) {
  return <View style={[s.root, compact && s.compact]}>
    {branding.splash && <Image accessibilityLabel="WAYO rocket loading image" source={branding.splash} style={[s.image, compact && s.smallImage]} resizeMode="contain" />}
    <ActivityIndicator color={c.blue} />
    <Text style={s.label} accessibilityLiveRegion="polite">{label}</Text>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: c.white, padding: 24 },
  compact: { flex: 0, paddingVertical: 30, backgroundColor: 'transparent', gap: 16 },
  image: { width: 260, height: 164 },
  smallImage: { width: 180, height: 114 },
  label: { color: c.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
