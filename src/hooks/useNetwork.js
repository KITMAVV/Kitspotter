import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncViolations } from '../db/sync';

export function useNetworkSync() {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let mounted = true;

        NetInfo.fetch().then(state => {
            if (!mounted) return;
            setIsConnected(state.isConnected);
            if (state.isConnected) {
                syncViolations();
            }
        });

        const unsubscribe = NetInfo.addEventListener(state => {
            if (!mounted) return;
            setIsConnected(state.isConnected);
            if (state.isConnected) {
                syncViolations();
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    return isConnected;
}
