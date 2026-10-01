import React from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';

const MainContent = ({ children }) => {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col lg:pl-[238px]">
      <TopBar />
      {/* key forces a remount per route, replaying the fade-in on every tab switch */}
      <div key={location.pathname} className="animate-page">
        {children}
      </div>
    </div>
  );
};

export default MainContent;
