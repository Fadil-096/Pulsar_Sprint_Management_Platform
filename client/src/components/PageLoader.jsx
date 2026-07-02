import React from 'react';

const PageLoader = () => (
  <div className="flex-1 flex justify-center items-center h-full min-h-[50vh] bg-bg-primary">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-bg-secondary border-t-accent-blue"></div>
  </div>
);

export default PageLoader;
