import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export interface JellyProps {
  color: string;
  dark: string;
  radius?: number;
  lip?: number;
  style?: StyleProp<ViewStyle>;
  inner?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  gloss?: boolean;
  [key: string]: any;
}

export function Jelly(props: JellyProps): JSX.Element;
