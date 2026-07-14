import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const startTimeRef = useRef(null);

  const startLoader = useCallback(() => {
    setIsLoading(true);
    setIsDismissing(false);
    startTimeRef.current = Date.now();
  }, []);

  const stopLoader = useCallback(() => {
    if (!startTimeRef.current) return;
    
    const elapsed = Date.now() - startTimeRef.current;
    const minDisplayTime = 1500;
    const remainingTime = Math.max(0, minDisplayTime - elapsed);

    setTimeout(() => {
      setIsDismissing(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsDismissing(false);
        startTimeRef.current = null;
      }, 1000); // Wait for the 600ms ring expansion and 400ms fade out to finish
    }, remainingTime);
  }, []);

  return (
    <LoaderContext.Provider value={{ isLoading, isDismissing, startLoader, stopLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
