import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredPermission }) {
  const token = localStorage.getItem('admin_token');
  const userStr = localStorage.getItem('admin_user');
  
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredPermission && userStr) {
    try {
      const user = JSON.parse(userStr);
      const permissions = user.permissions || [];
      
      if (!permissions.includes('all') && !permissions.includes(requiredPermission)) {
        return <Navigate to="/admin" replace />;
      }
    } catch (e) {
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children;
}