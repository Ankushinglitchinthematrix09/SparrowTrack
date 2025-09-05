/**
 * SparrowTrack - Data Manager
 * Handles all data operations for the attendance system
 */

class DataManager {
    constructor() {
        this.STORAGE_KEYS = {
            USERS: 'sparrowtrack_users',
            ATTENDANCE: 'sparrowtrack_attendance',
            SETTINGS: 'sparrowtrack_settings'
        };
        this.initializeStorage();
    }

    /**
     * Initialize storage with default data if empty
     */
    initializeStorage() {
        if (!this.getUsers()) {
            this.setUsers({});
        }
        if (!this.getAttendanceRecords()) {
            this.setAttendanceRecords({});
        }
        if (!this.getSettings()) {
            this.setSettings({
                appName: 'SparrowTrack',
                version: '1.0.0',
                theme: 'sparrow',
                initialized: new Date().toISOString()
            });
        }
    }

    /**
     * Get all users
     * @returns {Object} Users data
     */
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS)) || {};
        } catch (error) {
            console.error('Error getting users:', error);
            return {};
        }
    }

    /**
     * Set users data
     * @param {Object} users - Users object
     */
    setUsers(users) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error setting users:', error);
            return false;
        }
    }

    /**
     * Get attendance records
     * @returns {Object} Attendance data
     */
    getAttendanceRecords() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ATTENDANCE)) || {};
        } catch (error) {
            console.error('Error getting attendance records:', error);
            return {};
        }
    }

    /**
     * Set attendance records
     * @param {Object} records - Attendance records
     */
    setAttendanceRecords(records) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
            return true;
        } catch (error) {
            console.error('Error setting attendance records:', error);
            return false;
        }
    }

    /**
     * Get application settings
     * @returns {Object} Settings data
     */
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS)) || {};
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    /**
     * Set application settings
     * @param {Object} settings - Application settings
     */
    setSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error setting settings:', error);
            return false;
        }
    }

    /**
     * Export all data for backup
     * @returns {Object} Complete data export
     */
    exportData() {
        return {
            users: this.getUsers(),
            attendance: this.getAttendanceRecords(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Import data from backup
     * @param {Object} data - Data to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (data.users) this.setUsers(data.users);
            if (data.attendance) this.setAttendanceRecords(data.attendance);
            if (data.settings) this.setSettings(data.settings);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Clear all data (use with caution)
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.USERS);
            localStorage.removeItem(this.STORAGE_KEYS.ATTENDANCE);
            localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        const users = this.getUsers();
        const attendance = this.getAttendanceRecords();
        
        return {
            totalUsers: Object.keys(users).length,
            totalAttendanceRecords: Object.keys(attendance).length,
            storageUsed: this.getStorageUsage(),
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Calculate storage usage in bytes
     * @returns {number} Storage usage in bytes
     */
    getStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (key.startsWith('sparrowtrack_')) {
                total += localStorage[key].length;
            }
        }
        return total;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.DataManager = DataManager;
}
