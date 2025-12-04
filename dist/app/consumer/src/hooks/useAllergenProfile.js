import { useState, useEffect } from 'react';
const STORAGE_KEY = 'claimlens_allergen_profile';
const DEFAULT_PROFILE = {
    common: [],
    custom: [],
};
export function useAllergenProfile() {
    const [profile, setProfile] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        }
        catch (error) {
            console.error('Failed to load allergen profile:', error);
        }
        return DEFAULT_PROFILE;
    });
    // Persist to localStorage whenever profile changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        }
        catch (error) {
            console.error('Failed to save allergen profile:', error);
        }
    }, [profile]);
    const toggleCommonAllergen = (allergen) => {
        setProfile((prev) => ({
            ...prev,
            common: prev.common.includes(allergen)
                ? prev.common.filter((a) => a !== allergen)
                : [...prev.common, allergen],
        }));
    };
    const addCustomAllergen = (allergen) => {
        const trimmed = allergen.trim();
        if (!trimmed)
            return;
        setProfile((prev) => {
            if (prev.custom.includes(trimmed))
                return prev;
            return {
                ...prev,
                custom: [...prev.custom, trimmed],
            };
        });
    };
    const removeCustomAllergen = (allergen) => {
        setProfile((prev) => ({
            ...prev,
            custom: prev.custom.filter((a) => a !== allergen),
        }));
    };
    const clearAll = () => {
        setProfile(DEFAULT_PROFILE);
    };
    const exportProfile = () => {
        const dataStr = JSON.stringify(profile, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'allergen-profile.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const importProfile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target?.result);
                    if (imported && typeof imported === 'object') {
                        setProfile({
                            common: Array.isArray(imported.common) ? imported.common : [],
                            custom: Array.isArray(imported.custom) ? imported.custom : [],
                        });
                        resolve();
                    }
                    else {
                        reject(new Error('Invalid profile format'));
                    }
                }
                catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };
    const getAllergenCount = () => {
        return profile.common.length + profile.custom.length;
    };
    const getAllAllergens = () => {
        return [...profile.common, ...profile.custom];
    };
    return {
        profile,
        toggleCommonAllergen,
        addCustomAllergen,
        removeCustomAllergen,
        clearAll,
        exportProfile,
        importProfile,
        getAllergenCount,
        getAllAllergens,
    };
}
