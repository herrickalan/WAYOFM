import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Decorative station artwork, not a measurement of the audio signal.
export function WaveArt() {
  return <Svg width="100%" height="154" viewBox="0 0 400 154" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Defs><LinearGradient id="wave" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#FF7A25" /><Stop offset="1" stopColor="#FFA160" /></LinearGradient></Defs>
    {[24, 76, 128, 180, 232, 284, 336, 388].map(x => <Path key={`v${x}`} d={`M${x} 0V154`} stroke="#FFFFFF" strokeOpacity={0.06} />)}
    {[25, 77, 129].map(y => <Path key={`h${y}`} d={`M0 ${y}H400`} stroke="#FFFFFF" strokeOpacity={0.06} />)}
    <Circle cx="200" cy="77" r="60" stroke="#FF7A25" strokeOpacity={0.22} fill="none" />
    <Circle cx="200" cy="77" r="74" stroke="#FF7A25" strokeOpacity={0.1} fill="none" />
    {Array.from({ length: 43 }, (_, i) => {
      const height = 10 + Math.abs(Math.sin(i * 0.77) * Math.cos(i * 0.26)) * (i > 10 && i < 34 ? 104 : 40);
      return <Rect key={i} x={8 + i * 9} y={(154 - height) / 2} width={4} height={height} rx={2} fill="url(#wave)" opacity={i > 10 && i < 34 ? 1 : 0.48} />;
    })}
  </Svg>;
}
