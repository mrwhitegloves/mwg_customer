import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

const Button = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={{ backgroundColor: 'blue', padding: 10 }}>
    <Text style={{ color: 'white' }}>{title}</Text>
  </TouchableOpacity>
);

export default Button;