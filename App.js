import React from 'react';
import { registerRootComponent } from 'expo';
import AppNavigator from './src/navigation';


export default function App() {
  return <AppNavigator />;
}


registerRootComponent(App);
