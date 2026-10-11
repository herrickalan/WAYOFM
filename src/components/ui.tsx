import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors as c } from '../theme';
import { branding } from '../branding';

export type IconName = keyof typeof Feather.glyphMap;
export const Icon = ({ name, size = 20, color = c.ink }: { name: IconName; size?: number; color?: string }) =>
  <Feather name={name} size={size} color={color} />;

export function Wordmark({ large = false }: { large?: boolean }) {
  if (branding.logo) return <Image source={branding.logo} resizeMode="contain" style={{ width: large ? 270 : 168, height: large ? 50 : 32 }} accessibilityLabel="WAYO 104.3FM" />;
  return <View style={ui.wordmark} accessibilityLabel="WAYO 104.3FM">
    <Text style={[ui.word, large && { fontSize: 45 }]}>WAYO</Text>
    <View style={ui.frequency}><Text style={ui.frequencyText}>104.3<Text style={{ fontSize: 10 }}>FM</Text></Text></View>
  </View>;
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <Text style={[ui.eyebrow, light && { color: '#B9C0C4' }]}>{children}</Text>;
}

export function SectionHeading({ title, label, onPress }: { title: string; label?: string; onPress?: () => void }) {
  return <View style={ui.headingRow}><Text style={ui.sectionTitle}>{title}</Text>{label && onPress && <Pressable accessibilityRole="button" onPress={onPress} style={ui.inlineLink}><Text style={ui.linkLabel}>{label}</Text><Icon name="arrow-up-right" size={15} /></Pressable>}</View>;
}

export function Button({ title, onPress, icon, kind = 'dark', disabled = false, busy = false, style }: {
  title: string; onPress: () => void; icon?: IconName; kind?: 'dark' | 'orange' | 'light' | 'blue'; disabled?: boolean; busy?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const lightText = kind === 'dark' || kind === 'blue';
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, { backgroundColor: kind === 'dark' ? c.ink : kind === 'orange' ? c.orange : kind === 'blue' ? c.blue : c.white, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}>
    {busy ? <ActivityIndicator size="small" color={lightText ? c.white : c.ink} /> : icon && <Icon name={icon} size={18} color={lightText ? c.white : c.ink} />}
    <Text style={[ui.buttonText, { color: lightText ? c.white : c.ink }]}>{title}</Text>
  </Pressable>;
}

export function LinkRow({ title, description, icon, onPress, external = false }: {
  title: string; description?: string; icon: IconName; onPress: () => void; external?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [ui.linkRow, pressed && { backgroundColor: c.paleOrange }]}>
    <View style={ui.rowIcon}><Icon name={icon} size={19} /></View>
    <View style={{ flex: 1, gap: 3 }}><Text style={ui.rowTitle}>{title}</Text>{description && <Text style={ui.rowDescription}>{description}</Text>}</View>
    <Icon name={external ? 'arrow-up-right' : 'chevron-right'} size={18} color={c.muted} />
  </Pressable>;
}

export function ErrorNotice({ message, onRetry, onWebsite }: { message: string; onRetry?: () => void; onWebsite?: () => void }) {
  return <View style={ui.notice} accessibilityRole="alert"><Icon name="wifi-off" color={c.muted} size={23} /><Text style={ui.noticeText}>{message}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{onRetry && <Button title="Try again" icon="refresh-cw" onPress={onRetry} />}{onWebsite && <Button title="Open website" kind="light" icon="arrow-up-right" onPress={onWebsite} />}</View></View>;
}

export const ui = StyleSheet.create({
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  word: { fontSize: 29, letterSpacing: -1.8, fontWeight: '900', color: c.ink },
  frequency: { backgroundColor: c.blue, paddingHorizontal: 5, paddingVertical: 3, transform: [{ rotate: '-3deg' }] },
  frequencyText: { color: c.white, fontWeight: '900', fontSize: 16, letterSpacing: -0.7 },
  eyebrow: { color: c.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  sectionTitle: { fontSize: 23, fontWeight: '800', color: c.ink, letterSpacing: -0.7 },
  inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  linkLabel: { fontWeight: '700', fontSize: 12, color: c.ink },
  button: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, minHeight: 48 },
  buttonText: { fontWeight: '800', fontSize: 13 },
  linkRow: { flexDirection: 'row', alignItems: 'center', padding: 16, minHeight: 68, gap: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  rowIcon: { width: 37, height: 37, borderRadius: 10, backgroundColor: c.paper, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontWeight: '700', color: c.ink, fontSize: 15 },
  rowDescription: { fontSize: 12, color: c.muted, lineHeight: 18 },
  notice: { padding: 20, gap: 13, borderRadius: 16, backgroundColor: c.paleOrange, borderWidth: 1, borderColor: '#FFD5B8' },
  noticeText: { fontSize: 14, lineHeight: 21, color: c.ink },
});
