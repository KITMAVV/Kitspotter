import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function SignIn({ navigation, onSignIn }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign In</Text>
            <Button title="Sign In" onPress={onSignIn} />
            <Button title="Go to Sign Up" onPress={() => navigation.navigate('SignUp')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 24, marginBottom: 16 }
});
