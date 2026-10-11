import React, { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors as c } from '../theme';
import { Icon } from './ui';

export default function PageFrame({ title, backLabel, onBack, onHome, video, live, player, picker, website = false, tools }: {
  title: string; backLabel: string; onBack: () => void; onHome: () => void;
  video: boolean; live: boolean; player: ReactNode; picker?: ReactNode; website?: boolean; tools?: ReactNode;
}) {
  return <View style={s.root}>
    <View style={s.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${backLabel}`} onPress={onBack} style={s.back}>
        <Icon name="chevron-left" size={19} color={c.blue} /><Text style={s.actionLabel}>Back to {backLabel}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Home" onPress={onHome} style={s.home}>
        <Icon name="home" size={17} color={c.blue} /><Text style={s.actionLabel}>Home</Text>
      </Pressable>
    </View>
    {website ? <>
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      {tools}
      <View style={s.website}>{player}</View>
    </> : <ScrollView style={s.scroll} nestedScrollEnabled contentContainerStyle={s.content}>
      <Text style={s.title}>{title}</Text>
      <View style={[s.player, video ? s.video : live ? s.live : s.audio]}>{player}</View>
      {picker}
    </ScrollView>}
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: c.paper },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: c.line },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 4 },
  home: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, paddingHorizontal: 13, borderRadius: 14, backgroundColor: c.paleBlue },
  actionLabel: { color: c.blue, fontSize: 12, fontWeight: '800' },
  scroll: { flex: 1, minHeight: 0 },
  content: { paddingBottom: 12 },
  title: { color: c.ink, fontSize: 18, lineHeight: 25, fontWeight: '800', paddingHorizontal: 20, paddingVertical: 15 },
  player: { width: '100%', overflow: 'hidden', backgroundColor: c.ink },
  website: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: c.white },
  video: { aspectRatio: 16 / 9, minHeight: 200 },
  audio: { height: 280 },
  live: { height: 420 },
});
