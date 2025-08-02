// src/components/ps1/Ps1.tsx
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../utils/themeProvider';

export const Ps1 = () => {
  const [hostname, setHostname] = useState('');
  const [currentPath, setCurrentPath] = useState('/home/guest');
  const { theme } = useTheme();

  useEffect(() => {
    setHostname(window.location.hostname);
    
    // Initialize current path from localStorage
    const savedPath = localStorage.getItem('currentPath') || '/home/guest';
    setCurrentPath(savedPath);
    
    // Listen for path changes
    const handlePathChange = (event: CustomEvent) => {
      setCurrentPath(event.detail);
    };
    
    window.addEventListener('pathChanged', handlePathChange as EventListener);
    
    return () => {
      window.removeEventListener('pathChanged', handlePathChange as EventListener);
    };
  }, []);

  // Format the path for display
  const formatPath = (path: string): string => {
    if (path === '/home/guest') return '~';
    if (path.startsWith('/home/guest/')) return '~' + path.substring(11);
    if (path === '/') return '/';
    return path;
  };

  return (
    <div>
      <span
        style={{
          color: theme.yellow,
        }}
      >
        guest
      </span>
      <span
        style={{
          color: theme.white,
        }}
      >
        @
      </span>
      <span
        style={{
          color: theme.green,
        }}
      >
        {hostname}
      </span>
      <span
        style={{
          color: theme.white,
        }}
      >
        :
      </span>
      <span
        style={{
          color: theme.blue,
        }}
      >
        {formatPath(currentPath)}
      </span>
      <span
        style={{
          color: theme.white,
        }}
      >
        $&nbsp;
      </span>
    </div>
  );
};

export default Ps1;