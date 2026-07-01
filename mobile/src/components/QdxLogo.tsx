/**
 * QDX One brand mark + wordmark (native). The mark is three ascending rounded
 * bars — slate, mid-blue, amber — a tiny bar chart carrying the brand idea
 * ("score, don't filter"); the amber "high" bar is the only accent. Mirrors the
 * web QdxLogo, scaled from the same 34×24 proportions. Colors come from `brand`.
 */
import { View, Text } from "react-native";
import { brand } from "@/theme";

/** Bar proportions from the web SVG viewBox (height 24). */
const BARS = [
  { h: 11, color: brand.slate },
  { h: 18, color: brand.blue },
  { h: 24, color: brand.amber },
];

export function QdxMark({ height = 24 }: { height?: number }) {
  const unit = height / 24;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height, gap: 5 * unit }}>
      {BARS.map((b, i) => (
        <View
          key={i}
          style={{
            width: 8 * unit,
            height: b.h * unit,
            borderRadius: 4 * unit,
            backgroundColor: b.color,
          }}
        />
      ))}
    </View>
  );
}

export function QdxWordmark({ size = 28 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <QdxMark height={size * 0.85} />
      <Text style={{ fontSize: size, fontWeight: "900", letterSpacing: -0.5 }}>
        <Text style={{ color: brand.ink }}>QDX</Text>
        <Text style={{ color: brand.blue }}>one</Text>
      </Text>
    </View>
  );
}
