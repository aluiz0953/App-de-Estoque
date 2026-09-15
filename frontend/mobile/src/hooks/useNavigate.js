import { useCallback } from 'react';
// Esta é uma implementação simplificada - em um app real, você usaria
// react-navigation's useNavigation hook
const useNavigate = () => {
  // Em um app real com react-navigation:
  // const navigation = useNavigation();
  // return useCallback((name, params) => navigation.navigate(name, params), [navigation]);

  // Para este exemplo, retornaremos uma função placeholder
  return useCallback((name, params) => {
    console.log(`Navegando para: ${name}`, params);
    // Implementação real dependeria da sua configuração de navegação
  }, []);
};

export default useNavigate;