import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LINKS, STATION, YOUTUBE_PAGE, type StationPage } from '../config';
import { colors as c } from '../theme';
import { Button, Eyebrow, Icon, LinkRow, SectionHeading } from '../components/ui';

export default function CommunityScreen({ external, openPage }: { external: (url: string) => void; openPage: (page: StationPage) => void }) {
  return <View style={s.root}>
    <Eyebrow>POWERED BY PEOPLE LIKE YOU</Eyebrow>
    <Text style={s.title}>Your station.{ '\n' }<Text style={{ color: c.blue }}>Your community.</Text></Text>
    <Text style={s.description}>Keep independent voices on the air. There’s a place for you at WAYO.</Text>
    <View style={s.donate}>
      <View style={s.donateTop}><Icon name="heart" size={32} /><Eyebrow>SUPPORT LOCAL RADIO</Eyebrow></View>
      <Text style={s.donateTitle}>A little love.{ '\n' }A lot of possibility.</Text>
      <Text style={s.donateCopy}>Help keep WAYO 104.3FM on the air.</Text>
      <Button title="Donate to WAYO" icon="arrow-up-right" onPress={() => external(LINKS.donate)} />
    </View>
    <View><SectionHeading title="Get involved" /><View style={s.list}>
      <LinkRow title="Volunteer" description="Share your time and talents" icon="users" external onPress={() => external(LINKS.volunteer)} />
      <LinkRow title="Be a DJ" description="Bring your voice to the airwaves" icon="mic" external onPress={() => external(LINKS.dj)} />
      <LinkRow title="Subscribe" description="Sign up for updates from WAYO" icon="mail" external onPress={() => external(LINKS.subscribe)} />
      <LinkRow title="Our supporters" description="Meet the people who make it possible" icon="heart" onPress={() => openPage({ title: 'Supporters', url: LINKS.supporters })} />
    </View></View>
    <View><SectionHeading title="Say hello" /><View style={s.list}>
      <LinkRow title="Call WAYO" description={STATION.phoneDisplay} icon="phone" onPress={() => external(LINKS.call)} />
      <LinkRow title="Text WAYO" description={STATION.phoneDisplay} icon="message-circle" onPress={() => external(LINKS.text)} />
      <LinkRow title="Email us" description={STATION.email} icon="mail" onPress={() => external(LINKS.email)} />
      <LinkRow title="Media inquiries" description="communications@wayofm.org" icon="file-text" onPress={() => external(LINKS.mediaEmail)} />
      <LinkRow title="Music inquiries" description="music@wayofm.org" icon="music" onPress={() => external(LINKS.musicEmail)} />
      <LinkRow title="Contact information" description="All the ways to reach the station" icon="info" onPress={() => openPage({ title: 'Contact WAYO', url: LINKS.contact })} />
      <Pressable accessibilityRole="button" accessibilityLabel="Get directions to WAYO" style={s.address} onPress={() => external(LINKS.map)}>
        <Icon name="map-pin" color={c.blue} size={23} /><View style={{ flex: 1, gap: 5 }}><Text style={s.addressName}>WAYO 104.3FM</Text><Text style={s.addressText}>{STATION.address}</Text><Text style={s.directions}>Get directions ↗</Text></View>
      </Pressable>
      <View style={s.mailing}><Text style={s.addressName}>Studio & mailing information</Text><Text style={s.addressText}>The WAYO studio is at Fedder Industrial Park, between Culver and Goodman.</Text><Text style={s.addressText}>Records, cassettes, and CDs can be mailed to the studio address above. You can include a show or programmer’s name, plus information about yourself or your band. Email music files and links to music@wayofm.org.</Text></View>
    </View></View>
    <View><SectionHeading title="Stay connected" /><View style={s.socials}>
      {[{ name: 'YouTube', icon: 'youtube' as const, url: LINKS.youtube }, { name: 'Facebook', icon: 'facebook' as const, url: LINKS.facebook }, { name: 'Instagram', icon: 'instagram' as const, url: LINKS.instagram }].map(social => <Pressable accessibilityRole="button" accessibilityLabel={social.name} key={social.name} style={s.social} onPress={() => social.name === 'YouTube' ? openPage(YOUTUBE_PAGE) : external(social.url)}><Icon name={social.icon} size={23} /><Text style={s.socialLabel}>{social.name}</Text></Pressable>)}
    </View></View>
    <Text style={s.signoff}>INDEPENDENT RADIO. ROCHESTER, NEW YORK.{ '\n' }WAYO 104.3FM</Text>
  </View>;
}

const s = StyleSheet.create({
  root: { gap: 20, paddingTop: 4 },
  title: { color: c.ink, fontSize: 37, fontWeight: '900', lineHeight: 43, letterSpacing: -1.7 },
  description: { color: c.muted, fontSize: 14, lineHeight: 23 },
  donate: { backgroundColor: c.orange, borderRadius: 20, padding: 23, gap: 18, marginBottom: 4 },
  donateTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  donateTitle: { color: c.ink, fontSize: 28, lineHeight: 33, fontWeight: '900', letterSpacing: -0.8 },
  donateCopy: { color: '#592C0B', fontSize: 13, lineHeight: 20 },
  list: { backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.line, overflow: 'hidden' },
  address: { flexDirection: 'row', padding: 20, gap: 16, alignItems: 'flex-start', backgroundColor: c.paleBlue },
  addressName: { color: c.ink, fontSize: 15, fontWeight: '800' },
  addressText: { color: c.muted, fontSize: 13, lineHeight: 21 },
  directions: { fontSize: 12, fontWeight: '800', color: c.blue, marginTop: 7 },
  mailing: { padding: 20, gap: 12 },
  socials: { flexDirection: 'row', gap: 12 },
  social: { flex: 1, backgroundColor: c.white, paddingVertical: 22, borderWidth: 1, borderColor: c.line, borderRadius: 15, alignItems: 'center', gap: 12 },
  socialLabel: { color: c.ink, fontSize: 11, fontWeight: '700' },
  signoff: { color: c.muted, textAlign: 'center', fontWeight: '700', fontSize: 9, letterSpacing: 1.5, lineHeight: 20, paddingTop: 14 },
});
