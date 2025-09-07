import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoleBasedRedirectPath } from '../utils';

const RoleRedirectTest: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    console.log('Current user role:', userRole);
    
    if (userRole) {
      const redirectPath = getRoleBasedRedirectPath(userRole);
      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    } else {
      console.log('No role found, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Checking user role...</h2>
        <p className="text-gray-600">Redirecting based on your role...</p>
      </div>
    </div>
  );
};

export default RoleRedirectTest; 