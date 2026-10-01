import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import apiService from '../services/api';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/colors';

// A magazine cover/page, fetched through the API (session cookie) and cached by path.
// `path` is relative to /revistas, e.g. "12/capa" or "12/paginas/3".
const RevistaImagem = ({ path, style, resizeMode = 'cover', label }) => {
  const { colors } = useTheme();
  const [state, setState] = useState({ path: null, uri: null, failed: false });

  useEffect(() => {
    let cancelled = false;
    apiService
      .getRevistaImagem(path)
      .then((uri) => !cancelled && setState({ path, uri, failed: false }))
      .catch(() => !cancelled && setState({ path, uri: null, failed: true }));
    return () => {
      cancelled = true;
    };
  }, [path]);

  const loaded = state.path === path;
  if (loaded && state.uri) {
    return <Image source={{ uri: state.uri }} style={style} resizeMode={resizeMode} accessibilityLabel={label} />;
  }
  return (
    <View style={[style, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
      {loaded && state.failed ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
          Não foi possível carregar
        </Text>
      ) : (
        <ActivityIndicator color={colors.secondaryDark} />
      )}
    </View>
  );
};

export default RevistaImagem;
