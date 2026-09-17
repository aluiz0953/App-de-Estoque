import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * Thin wrapper around react-navigation's useNavigation, matching the mobile
 * hook interface used across screens: navigate(name, params) and goBack().
 */
export const useNavigate = () => {
  const navigation = useNavigation();

  const navigate = useCallback(
    (name, params) => navigation.navigate(name, params),
    [navigation]
  );

  navigate.goBack = useCallback(() => navigation.goBack(), [navigation]);

  return navigate;
};

export default useNavigate;
