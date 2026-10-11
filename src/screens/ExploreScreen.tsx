import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LINKS, type StationPage } from '../config';
import { colors as c } from '../theme';
import { Eyebrow, Icon, LinkRow, SectionHeading, type IconName } from '../components/ui';

const pages: { title: string; description: string; icon: IconName; url: string }[] = [
  { title: 'Live at WAYO', description: 'The live broadcast and show information', icon: 'radio', url: LINKS.live },
  { title: 'Show Guide', description: 'Discover the shows and the people behind them', icon: 'disc', url: LINKS.shows },
  { title: 'Schedule', description: 'Browse the daily lineup', icon: 'calendar', url: LINKS.schedule },
  { title: 'News', description: 'The latest from the station', icon: 'file-text', url: LINKS.news },
  { title: 'About WAYO', description: 'Get to know your community radio station', icon: 'info', url: LINKS.about },
  { title: 'Supporters', description: 'The people who keep WAYO on the air', icon: 'heart', url: LINKS.supporters },
];

export default function ExploreScreen({ openPage }: { openPage: (page: StationPage) => void }) {
  return <View style={s.root}>
    <Eyebrow>FREEFORM. LOCAL. INDEPENDENT.</Eyebrow>
    <Text style={s.title}>There’s a whole{ '\n' }world on <Text style={{ color: c.blue }}>WAYO.</Text></Text>
    <Text style={s.description}>Find a new favorite show. Catch up with the station. Get to know the voices in your community.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Browse the schedule" onPress={() => openPage({ title: 'Schedule', url: LINKS.schedule })} style={s.feature}>
      <View style={s.featureTop}><Text style={s.featureEyebrow}>ON THE AIRWAVES</Text><Icon name="arrow-up-right" color={c.white} /></View>
      <Icon name="calendar" size={46} color={c.white} /><Text style={s.featureTitle}>Make time for{ '\n' }something different.</Text><Text style={s.featureSub}>Explore the daily schedule →</Text>
    </Pressable>
    <View><SectionHeading title="Around the station" /><View style={s.list}>{pages.map(page => <LinkRow key={page.title} {...page} onPress={() => openPage(page)} />)}</View></View>
  </View>;
}

const s = StyleSheet.create({
  root: { gap: 17, paddingTop: 4 },
  title: { fontSize: 37, lineHeight: 43, fontWeight: '900', color: c.ink, letterSpacing: -1.7 },
  description: { color: c.muted, fontSize: 14, lineHeight: 23, marginBottom: 7 },
  feature: { backgroundColor: c.blue, padding: 23, borderRadius: 20, gap: 19, marginBottom: 10 },
  featureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureEyebrow: { color: '#E0ECFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  featureTitle: { color: c.white, fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -1 },
  featureSub: { color: c.white, fontSize: 13, fontWeight: '600' },
  list: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 18, overflow: 'hidden' },
});
