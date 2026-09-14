import { Text, StyleSheet } from 'react-native';

import { Jelly } from '../Jelly';
import { C, darken, F } from '../theme';

export type AnswerFeedback = 'correct' | 'wrong' | null;

interface Props {
  label: string;
  onPress: () => void;
  feedback: AnswerFeedback;
  disabled: boolean;
  colorIndex: number;
}

const PALETTE = [C.berry, C.sky, C.tangerine, C.lime];

export default function AnswerButton({ label, onPress, feedback, disabled, colorIndex }: Props) {
  const base = PALETTE[colorIndex % PALETTE.length];
  const color = feedback === 'correct' ? C.lime : feedback === 'wrong' ? '#E4695F' : base;

  return (
    <Jelly
      color={color}
      dark={darken(color)}
      onPress={onPress}
      disabled={disabled}
      style={styles.wrap}
      inner={styles.inner}
    >
      <Text style={styles.text} numberOfLines={2} adjustsFontSizeToFit>
        {label}
      </Text>
    </Jelly>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  inner: { minHeight: 84, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  text: { fontFamily: F.round, fontSize: 22, color: '#fff', textAlign: 'center' },
});
