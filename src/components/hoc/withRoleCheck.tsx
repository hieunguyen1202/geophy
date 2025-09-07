import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, getRoleBasedRedirectPath } from '../../utils';

interface RoleCheckConfig {
  allowedRoles: string[];
  redirectTo?: string;
}

export const withRoleCheck = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  config: RoleCheckConfig
) => {
  return (props: P) => {
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoggedIn()) {
        navigate('/login');
        return;
      }

      const userRole = localStorage.getItem('role');
      if (!userRole) {
        navigate('/login');
        return;
      }

      // Check if user has any of the allowed roles
      const hasAllowedRole = config.allowedRoles.some(allowedRole => 
        userRole.toLowerCase().includes(allowedRole.toLowerCase())
      );

      if (!hasAllowedRole) {
        // Redirect to appropriate page based on user's actual role
        const redirectPath = config.redirectTo || getRoleBasedRedirectPath(userRole);
        navigate(redirectPath, { replace: true });
      }
    }, [navigate]);

    return <WrappedComponent {...props} />;
  };
}; 