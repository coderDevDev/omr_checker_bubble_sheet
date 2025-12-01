import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import our screens
import HomeScreen from './src/screens/HomeScreen';
import CameraOverlayScreen from './src/screens/CameraOverlayScreen';
import DocumentExtractionScreen from './src/screens/DocumentExtractionScreen';
import RectanglePreviewScreen from './src/screens/RectanglePreviewScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import TemplateScreen from './src/screens/TemplateScreen';
import AnswerKeysScreen from './src/screens/AnswerKeysScreen';
import CreateAnswerKeyScreen from './src/screens/CreateAnswerKeyScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2E7D32'
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold'
              }
            }}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'OMR Scanner' }}
            />
            <Stack.Screen
              name="Template"
              component={TemplateScreen}
              options={{ title: 'Select Template' }}
            />
            <Stack.Screen
              name="Camera"
              component={CameraOverlayScreen}
              options={{
                title: 'Camera Overlay',
                headerShown: false // Hide header for full-screen camera
              }}
            />
            <Stack.Screen
              name="DocumentExtraction"
              component={DocumentExtractionScreen}
              options={{
                title: 'Extracting Document',
                headerShown: false
              }}
            />
            <Stack.Screen
              name="RectanglePreview"
              component={RectanglePreviewScreen}
              options={{ title: 'Verify Detection' }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ title: 'OMR Results' }}
            />
            <Stack.Screen
              name="AnswerKeys"
              component={AnswerKeysScreen}
              options={{ title: 'Answer Keys' }}
            />
            <Stack.Screen
              name="CreateAnswerKey"
              component={CreateAnswerKeyScreen}
              options={{ title: 'Create Answer Key' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
