import React from 'react';
import { View } from 'react-native';

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={{ borderWidth: 1, padding: 16, margin: 8 }}>{children}</View>
);

export default Card;