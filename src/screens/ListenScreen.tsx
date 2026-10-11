import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LINKS, YOUTUBE_PAGE, type StationPage } from '../config';
import { type LiveRadio } from '../hooks/useLiveRadio';
import { colors as c } from '../theme';
import { Button, ErrorNotice, Eyebrow, Icon, SectionHeading } from '../components/ui';
import { WaveArt } from '../components/WaveArt';

type Props = { radio: LiveRadio; openPage: (page: StationPage) => void; goArchives: () => void; external: (url: string) => void };

export default function ListenScreen({ radio, openPage, goArchives, external }: Props) {
  return <View style={s.root}>
    <View style={s.intro}>
      <View style={s.stationLine}><View style={s.dot} /><Eyebrow>ROCHESTER’S INDEPENDENT RADIO</Eyebrow></View>
      <Text style={s.headline}>A little different.<Text style={{ color: c.blue }}>{'\n'}A lot of WAYO.</Text></Text>
      <Text style={s.subtitle}>Your city. Your voices. Your kind of radio.</Text>
    </View>

    <View style={s.player}>
      <View style={s.playerTop}><View style={s.livePill}><View style={[s.dot, { backgroundColor: c.orange }]} /><Text style={s.liveText}>LIVE BROADCAST</Text></View><Icon name="radio" color="#8D9397" size={20} /></View>
      <View style={s.playerTitle}><Text style={s.wayo}>WAYO</Text><Text style={s.freq}>104.3<Text style={{ fontSize: 19 }}>FM</Text></Text></View>
      <Text style={s.playerSubtitle}>Freeform radio. Made by our community.</Text>
      <View style={s.wave}><WaveArt /></View>
      <View style={s.playerFooter}>
        <View style={{ flex: 1, gap: 5 }}><Text style={s.listenLabel}>{radio.playing ? 'ON YOUR AIRWAVES' : 'TUNE IN, TURN IT UP'}</Text><Text style={s.playStatus} accessibilityLiveRegion="polite">{radio.label}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={radio.busy ? 'Cancel connection' : radio.playing ? 'Pause live radio' : 'Play live radio'} onPress={() => void radio.toggle()}
          style={({ pressed }) => [s.play, pressed && { transform: [{ scale: 0.95 }] }]}>
          <Icon name={radio.busy ? 'x' : radio.playing ? 'pause' : 'play'} size={28} color={c.ink} />
        </Pressable>
      </View>
    </View>
    {radio.error && <ErrorNotice message={radio.error} onRetry={() => void radio.toggle()} onWebsite={() => openPage({ title: 'Listen live', url: LINKS.listen })} />}

    <View style={s.broadcastLinks}>
      <Button title="Live at WAYO" icon="headphones" kind="light" style={{ flex: 1 }} onPress={() => openPage({ title: 'Live at WAYO', url: LINKS.live })} />
      <Button title="Watch" icon="video" kind="blue" style={{ flex: 1 }} onPress={() => openPage({ title: 'Watch WAYO', url: LINKS.watch })} />
    </View>
    <Button title="Watch WAYO on YouTube" icon="youtube" kind="light" onPress={() => openPage(YOUTUBE_PAGE)} />

    <View>
      <SectionHeading title="Find your frequency" />
      <View style={s.cards}>
        <Pressable accessibilityRole="button" accessibilityLabel="Show Guide" onPress={() => openPage({ title: 'Show Guide', url: LINKS.shows })} style={[s.smallCard, { backgroundColor: c.paleBlue }]}>
          <View style={s.smallCardTop}><Icon name="disc" color={c.blue} size={26} /><Icon name="arrow-up-right" size={18} /></View>
          <Text style={s.smallCardTitle}>Show Guide</Text><Text style={s.smallCardSub}>Meet the voices of WAYO</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Today’s Schedule" onPress={() => openPage({ title: 'Schedule', url: LINKS.schedule })} style={[s.smallCard, { backgroundColor: c.paleOrange }]}>
          <View style={s.smallCardTop}><Icon name="calendar" color="#B34B0A" size={26} /><Icon name="arrow-up-right" size={18} /></View>
          <Text style={s.smallCardTitle}>The Schedule</Text><Text style={s.smallCardSub}>See what’s coming up</Text>
        </Pressable>
      </View>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Explore the archives" style={s.archiveBanner} onPress={goArchives}>
      <View style={s.archiveIcon}><Icon name="rewind" size={26} color={c.white} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.archiveTitle}>Missed it? Replay it.</Text><Text style={s.archiveSub}>Explore our Mixcloud episode archive</Text></View><Icon name="arrow-right" size={19} />
    </Pressable>

    <View style={s.contactStrip}><View style={{ gap: 5, flex: 1 }}><Eyebrow>GOT SOMETHING TO SAY?</Eyebrow><Text style={s.phone}>(585) 203-WAYO</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Call WAYO" onPress={() => external(LINKS.call)} style={s.contactIcon}><Icon name="phone" size={18} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Text WAYO" onPress={() => external(LINKS.text)} style={s.contactIcon}><Icon name="message-circle" size={18} /></Pressable></View>
  </View>;
}

const s = StyleSheet.create({
  root: { gap: 25 },
  intro: { gap: 13, paddingTop: 4 },
  stationLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.blue },
  headline: { color: c.ink, fontSize: 39, fontWeight: '900', lineHeight: 44, letterSpacing: -1.9 },
  subtitle: { color: c.muted, fontSize: 14, lineHeight: 21 },
  player: { backgroundColor: c.ink, borderRadius: 22, padding: 22, overflow: 'hidden' },
  playerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: '#41403B', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 7 },
  liveText: { color: '#F3DCC6', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  playerTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 20 },
  wayo: { color: c.white, fontSize: 50, fontWeight: '900', letterSpacing: -3 },
  freq: { color: c.orange, fontSize: 28, fontWeight: '800', letterSpacing: -1.3 },
  playerSubtitle: { color: '#AFB3B3', fontSize: 12, marginTop: 1 },
  wave: { marginHorizontal: -18, marginVertical: 0 },
  playerFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopColor: '#343638', borderTopWidth: 1, paddingTop: 16 },
  listenLabel: { color: '#8F9495', fontSize: 8, letterSpacing: 1.8, fontWeight: '800' },
  playStatus: { color: c.white, fontSize: 13, fontWeight: '600' },
  play: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: c.orange },
  broadcastLinks: { flexDirection: 'row', gap: 10, marginTop: -10 },
  cards: { flexDirection: 'row', gap: 12 },
  smallCard: { flex: 1, borderRadius: 17, padding: 17, minHeight: 143 },
  smallCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  smallCardTitle: { fontSize: 16, fontWeight: '800', color: c.ink, letterSpacing: -0.4 },
  smallCardSub: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  archiveBanner: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 17, borderRadius: 17, borderWidth: 1, borderColor: c.line, backgroundColor: c.white },
  archiveIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center' },
  archiveTitle: { fontSize: 16, color: c.ink, fontWeight: '800' },
  archiveSub: { color: c.muted, fontSize: 11, lineHeight: 16 },
  contactStrip: { flexDirection: 'row', gap: 9, alignItems: 'center', paddingTop: 2 },
  phone: { fontSize: 16, fontWeight: '800', color: c.ink, letterSpacing: -0.4 },
  contactIcon: { width: 44, height: 44, borderWidth: 1, borderColor: c.line, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
