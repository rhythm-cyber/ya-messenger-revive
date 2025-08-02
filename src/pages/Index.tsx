import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Auth from './Auth';
import MainLayout from '@/components/Layout/MainLayout';

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-yahoo flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">Loading Tittoos Messenger...</h2>
        </div>
      </div>
    );
  }

  return user ? <MainLayout /> : <Auth />;
};

export default Index;
