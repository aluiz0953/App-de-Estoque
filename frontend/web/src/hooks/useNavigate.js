import { useNavigate as useNavigateRouter } from 'react-router-dom';

export const useNavigate = () => {
  const navigate = useNavigateRouter();

  // Wrapper to match mobile hook interface if needed
  const navigateTo = (path, options = {}) => {
    navigate(path, options);
  };

  return {
    navigate,
    navigateTo,
    // For compatibility with mobile hook if it had goBack, etc.
    goBack: () => navigate(-1),
    goForward: () => navigate(1)
  };
};

export default useNavigate;