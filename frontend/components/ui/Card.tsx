import { StyleSheet, View, type ViewProps } from 'react-native';
import { Components, Shadows } from '@/constants/designSystem';

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: Components.card.radius,
    padding: Components.card.padding,
    ...Shadows.md,
  },
});
