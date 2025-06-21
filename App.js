import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './src/navigation';
import { initViolationsTable } from './src/db/violations';
import { useNetworkSync } from './src/hooks/useNetwork';

export default function App() {
  const isOnline = useNetworkSync();
  console.log(isOnline)

  useEffect(() => {
    initViolationsTable().catch(console.error);
  }, []);


  return <AppNavigator />;
}

registerRootComponent(App);
