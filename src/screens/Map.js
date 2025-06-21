import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { openDatabase } from '../db/db';
import { clearViolationsTable } from '../db/clearDB';

export default function MapScreen() {
    const [db, setDb] = useState(null);
    const [violations, setViolations] = useState([]);
    const [region, setRegion] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    const fetchViolations = useCallback(async () => {
        if (!db) return;
        try {
            const rows = await db.getAllAsync('SELECT * FROM violations');
            setViolations(rows);
            if (rows.length > 0) {
                setRegion(r => ({
                    ...r,
                    latitude: rows[0].latitude,
                    longitude: rows[0].longitude,
                }));
            }
        } catch (e) {
            console.error('Error fetching violations', e);
            Alert.alert('Error', 'Could not load violations');
        }
    }, [db]);


    const handleClear = useCallback(async () => {
        if (!db) return;
        try {
            await clearViolationsTable();
            setViolations([]);
            Alert.alert('Success', 'All violations cleared');
        } catch (e) {
            console.error('Error clearing violations', e);
            Alert.alert('Error', 'Could not clear database');
        }
    }, [db]);


    useEffect(() => {
        (async () => {
            try {
                const database = await openDatabase();
                setDb(database);
            } catch (e) {
                console.error('DB open error', e);
            }
        })();
    }, []);


    useEffect(() => {
        fetchViolations();
    }, [db]);

    return (
        <View style={styles.container}>
            <MapView style={styles.map} region={region}>
                {violations.map(v => {
                    const jitter = 0.00005;
                    const latitude = v.latitude + (Math.random() - 0.5) * jitter;
                    const longitude = v.longitude + (Math.random() - 0.5) * jitter;
                    return (
                        <Marker
                            key={v.id}
                            coordinate={{ latitude, longitude }}
                            title={v.category}
                            description={v.description}
                        />
                    );
                })}
            </MapView>

            <View style={styles.buttonContainer}>
                <View style={styles.buttonRow}>
                    <Button title="Рефреш" onPress={fetchViolations} />
                    <Button title="DEV: очистити базу" onPress={handleClear} color="#d9534f" />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    buttonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
