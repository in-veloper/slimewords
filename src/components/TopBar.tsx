import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

// @ts-ignore - art.js 는 순수 JS.
import { Back, Crown, Slime } from '../art';
import { C, F, jellyShadow } from '../theme';
import { Profile } from '../types/word';

interface Props {
  profile: Profile;
  showBack?: boolean;
  onBack?: () => void;
  onWho?: () => void;
  crownCount: number;
}

// semlime 의 상단바 그대로 — 뒤로가기·프로필칩·왕관(스티커 수) 알약을
// 늘어놓는다. 왕관 수가 늘어나는 순간 알약이 통통 튀어서 "받았다" 는
// 느낌을 준다.
export default function TopBar({ profile, showBack, onBack, onWho, crownCount }: Props) {
  const bump = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bump, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(bump, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 14 }),
    ]).start();
  }, [crownCount, bump]);

  const scale = bump.interpolate({ inputRange: [0, 1], outputRange: [1, 1.26] });

  return (
    <View style={styles.topbar}>
      {showBack ? (
        <Pressable style={styles.iconBtn} onPress={onBack} hitSlop={8}>
          <Back />
        </Pressable>
      ) : null}

      <Pressable style={styles.whoChip} onPress={onWho} disabled={!onWho}>
        <Slime hat={profile.hat} color={profile.color} mood="happy" size={34} />
        <Text style={styles.whoName} numberOfLines={1}>
          {profile.name}
        </Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      <Animated.View style={[styles.pill, { transform: [{ scale }] }]}>
        <Crown size={24} />
        <Text style={styles.pillNum}>{crownCount}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.sugar,
    alignItems: 'center',
    justifyContent: 'center',
    ...jellyShadow,
    shadowOpacity: 0.12,
    elevation: 3,
  },
  whoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: C.sugar,
    elevation: 3,
    maxWidth: 170,
  },
  whoName: { fontFamily: F.round, fontSize: 16, color: C.ink, flexShrink: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 9,
    paddingRight: 15,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.sugar,
    elevation: 3,
  },
  pillNum: { fontFamily: F.num, fontSize: 17, color: C.ink },
});
