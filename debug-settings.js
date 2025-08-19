// Debug script to test settings storage
console.log('=== Settings Storage Debug ===');

// Test localStorage availability
console.log('localStorage available:', typeof localStorage !== 'undefined');

// Check current settings in localStorage
const SETTINGS_KEY = 'ori_settings';
const currentSettings = localStorage.getItem(SETTINGS_KEY);
console.log('Current settings in localStorage:', currentSettings ? 'Found' : 'Not found');

if (currentSettings) {
    try {
        const parsed = JSON.parse(currentSettings);
        console.log('Settings structure:', Object.keys(parsed));
        console.log('Sample setting (general):', parsed.general ? 'Found' : 'Missing');
    } catch (e) {
        console.error('Error parsing settings:', e);
    }
} else {
    console.log('No settings found in localStorage');
}

// Test saving a simple setting
try {
    const testSettings = {
        test: { value: 'debug-test' },
        timestamp: Date.now()
    };
    localStorage.setItem('test_settings', JSON.stringify(testSettings));
    const retrieved = localStorage.getItem('test_settings');
    console.log('localStorage write/read test:', retrieved ? 'SUCCESS' : 'FAILED');
    localStorage.removeItem('test_settings');
} catch (e) {
    console.error('localStorage test failed:', e);
}

console.log('=== End Debug ===');