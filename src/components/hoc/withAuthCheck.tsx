import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn, logout } from '../../utils';

export const withAuthCheck = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return (props: P) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!isLoggedIn()) {
        logout();
        navigate('/login', { state: { from: location } });
      }
    }, [navigate, location]);

    return <WrappedComponent {...props} />;
  };
};