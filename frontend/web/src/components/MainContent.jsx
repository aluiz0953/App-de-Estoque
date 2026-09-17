import React from 'react';

const MainContent = ({ children }) => {
  return <div className="flex min-h-screen flex-col lg:pl-[238px]">{children}</div>;
};

export default MainContent;
