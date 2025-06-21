import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, KeyboardAvoidingView, ScrollView, View, Text, TextInput, Button, Image, StyleSheet, Alert, Platform, Modal, Keyboard } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { openDatabase } from '../db/db';
import { syncViolations } from '../db/sync';

const CATEGORIES = ['Шахрайство', 'Крадіжка', 'Образа'];
const CLOUDINARY_URL = 'Ur link';
const UPLOAD_PRESET = 'photos_from_rn';

export default function NewViolation() {
    const [imageUri, setImageUri] = useState(null);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [location, setLocation] = useState(null);
    const [isoTimestamp, setIsoTimestamp] = useState('');
    const [displayTimestamp, setDisplayTimestamp] = useState('');
    const [pickerVisible, setPickerVisible] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const fetchLocation = useCallback(async () => {
        const now = new Date();
        setIsoTimestamp(now.toISOString());
        setDisplayTimestamp(
            new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(now)
        );

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Location Permission', 'Location access is required to tag the violation');
            return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        console.log('fetchLocation: obtained coords', loc.coords);
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    }, []);

    useEffect(() => {
        if (imageUri) fetchLocation();
    }, [imageUri, fetchLocation]);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const validate = () => {
        const e = {};
        if (!imageUri) e.image = 'Photo is required';
        if (!description.trim()) e.description = 'Description is required';
        if (!location) e.location = 'Location not obtained';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const takePhoto = useCallback(async () => {
        let { status } = await ImagePicker.getCameraPermissionsAsync();
        if (status !== 'granted') {
            const resp = await ImagePicker.requestCameraPermissionsAsync();
            status = resp.status;
        }
        if (status !== 'granted') {
            Alert.alert('Camera Permission', 'Camera access is required to take a photo');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!result.canceled) {
            console.log('takePhoto: imageUri set', result.assets[0].uri);
            setImageUri(result.assets[0].uri);
        }
    }, []);

    const resetForm = () => {
        console.log('resetForm: resetting form state');
        setImageUri(null);
        setDescription('');
        setCategory(CATEGORIES[0]);
        setLocation(null);
        setIsoTimestamp('');
        setDisplayTimestamp('');
        setErrors({});
        setPickerVisible(false);
    };

    const uploadViolation = useCallback(async () => {
        if (!validate()) return;
        console.log('uploadViolation: starting');
        setIsSubmitting(true);
        try {
            console.log('uploadViolation: uploading image to Cloudinary');
            const formData = new FormData();
            formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'violation.jpg' });
            formData.append('upload_preset', UPLOAD_PRESET);
            const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
            const data = await response.json();
            console.log('uploadViolation: Cloudinary response', data);
            const storedImageUri = data.secure_url;
            console.log('uploadViolation: storedImageUri', storedImageUri);

            console.log('uploadViolation: opening database');
            const db = await openDatabase();
            console.log('uploadViolation: database opened');
            const result = await db.runAsync(
                `INSERT INTO violations (description, category, imageUri, date, latitude, longitude, synced) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                description,
                category,
                storedImageUri,
                isoTimestamp,
                location.latitude,
                location.longitude,
                0
            );
            console.log('uploadViolation: inserted with id', result.lastInsertRowId);

            Alert.alert('Saved', 'Violation submitted');
            console.log('uploadViolation: calling syncViolations');
            syncViolations();
            console.log('uploadViolation: syncViolations called');

            resetForm();
        } catch (err) {
            console.error('uploadViolation error', err);
            Alert.alert('Error', 'Failed to submit violation');
        } finally {
            console.log('uploadViolation: finished');
            setIsSubmitting(false);
        }
    }, [description, category, imageUri, location, isoTimestamp]);

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>Report Violation</Text>
                    <Button
                        title={imageUri ? 'Retake Photo' : 'Take Photo'}
                        onPress={takePhoto}
                    />
                    {errors.image && <Text style={styles.error}>{errors.image}</Text>}
                    {imageUri && (
                        <Image
                            source={{ uri: imageUri }}
                            style={keyboardVisible ? styles.imageSmall : styles.image}
                        />
                    )}
                    {imageUri && (
                        <View style={styles.form}>
                            <TextInput
                                placeholder="Description"
                                style={styles.input}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                maxLength={500}
                                returnKeyType="done"
                                blurOnSubmit
                            />
                            {errors.description && <Text style={styles.error}>{errors.description}</Text>}
                            <View style={styles.categoryRow}>
                                <Text style={styles.label}>Category:</Text>
                                <Button
                                    title={category}
                                    onPress={() => setPickerVisible(true)}
                                />
                            </View>
                            {location && (
                                <Text style={styles.meta}>
                                    Location: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                                </Text>
                            )}
                            {errors.location && <Text style={styles.error}>{errors.location}</Text>}
                            {displayTimestamp && <Text style={styles.meta}>Date & Time: {displayTimestamp}</Text>}
                            <Button title="Submit Violation" onPress={uploadViolation} disabled={isSubmitting} />
                        </View>
                    )}
                    <Modal visible={pickerVisible} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={category} onValueChange={setCategory}>
                                    {CATEGORIES.map(cat => (
                                        <Picker.Item key={cat} label={cat} value={cat} />
                                    ))}
                                </Picker>
                                <Button title="Done" onPress={() => setPickerVisible(false)} />
                            </View>
                        </View>
                    </Modal>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    safe: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 22,
        marginBottom: 16,
    },
    image: {
        width: 300,
        height: 300,
        marginVertical: 20,
    },
    imageSmall: {
        width: 150,
        height: 150,
        marginVertical: 20,
    },
    form: {
        width: '100%',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginBottom: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    error: {
        color: 'red',
        marginBottom: 8,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    label: {
        marginRight: 8,
        fontSize: 16,
    },
    meta: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        padding: 16,
    },
});
