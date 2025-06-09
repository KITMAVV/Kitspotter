import React, { useState, useRef, useCallback } from 'react';
import { KeyboardAvoidingView, ScrollView, View, Text, TextInput, Button, StyleSheet, Platform,} from 'react-native';

export default function SignUp({ onRegister }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState({});

    const emailRef = useRef();
    const usernameRef = useRef();
    const passwordRef = useRef();
    const confirmRef = useRef();

    const validate = useCallback(() => {
        const e = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) e.email = 'Invalid email format';
        if (!username) e.username = 'Username is required';
        if (password.length < 6) e.password = 'Password must be ≥6 characters';
        if (password !== confirm) e.confirm = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [email, username, password, confirm]);

    const handleSubmit = useCallback(() => {
        if (!validate()) {
            if (errors.email) emailRef.current.focus();
            else if (errors.username) usernameRef.current.focus();
            else if (errors.password) passwordRef.current.focus();
            else if (errors.confirm) confirmRef.current.focus();
            return;
        }
        // TODO: API
        console.log({ email, username, password });
        onRegister();
    }, [validate, errors, email, username, password, confirm]);

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Create Account</Text>

                <TextInput
                    ref={emailRef}
                    placeholder="Email"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => usernameRef.current.focus()}
                />
                {errors.email && <Text style={styles.error}>{errors.email}</Text>}

                <TextInput
                    ref={usernameRef}
                    placeholder="Username"
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current.focus()}
                />
                {errors.username && <Text style={styles.error}>{errors.username}</Text>}

                <TextInput
                    ref={passwordRef}
                    placeholder="Password"
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current.focus()}
                />
                {errors.password && <Text style={styles.error}>{errors.password}</Text>}

                <TextInput
                    ref={confirmRef}
                    placeholder="Confirm Password"
                    style={styles.input}
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                />
                {errors.confirm && <Text style={styles.error}>{errors.confirm}</Text>}

                <View style={styles.buttonContainer}>
                    <Button
                        title="Sign Up"
                        onPress={handleSubmit}
                        disabled={Object.keys(errors).length > 0}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginBottom: 8,
        borderRadius: 4,
    },
    error: {
        color: 'red',
        marginBottom: 12,
    },
    buttonContainer: {
        marginTop: 16,
    },
});
