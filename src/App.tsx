import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navTheme } from './theme';
import RootNavigator from './navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
