import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SignIn from '../screens/SignIn';
import SignUp from '../screens/SignUp';
import Calendar from '../screens/Calendar';
import Map from '../screens/Map';
import NewViolation from '../screens/NewViolation';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Calendar" component={Calendar} />
            <Tab.Screen name="Map" component={Map} />
            <Tab.Screen name="NewViolation" component={NewViolation} options={{ title: 'New Violation' }} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    // TODO: API
    const [isSignedIn, setIsSignedIn] = useState(false);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isSignedIn ? (
                    <>
                        <Stack.Screen name="SignIn">
                            {props => <SignIn {...props} onSignIn={() => setIsSignedIn(true)} />}
                        </Stack.Screen>
                        <Stack.Screen name="SignUp">
                            {props => <SignUp {...props} onRegister={() => setIsSignedIn(true)} />}
                        </Stack.Screen>

                    </>
                ) : (
                    <Stack.Screen name="AppTabs" component={AppTabs} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
