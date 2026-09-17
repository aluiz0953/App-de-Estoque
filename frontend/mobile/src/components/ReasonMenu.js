import React, { useState } from 'react';
import { View } from 'react-native';
import { Menu } from 'react-native-paper';
import { colors, fonts } from '../theme/colors';

// Anchors a required-reason picker to whatever trigger is passed as children.
// Used anywhere a stock entry/withdrawal happens, since the backend now rejects
// any /estoque/entrada or /estoque/saida/* call with no `motivo`.
const ReasonMenu = ({ options, onSelect, children, disabled }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={children({ open: () => !disabled && setVisible(true) })}
        contentStyle={{ backgroundColor: colors.surface }}
      >
        {options.map((opt) => (
          <Menu.Item
            key={opt.value}
            title={opt.label}
            titleStyle={{ fontFamily: fonts.sans, fontSize: 13, color: colors.text }}
            onPress={() => {
              setVisible(false);
              onSelect(opt.value);
            }}
          />
        ))}
      </Menu>
    </View>
  );
};

export default ReasonMenu;
