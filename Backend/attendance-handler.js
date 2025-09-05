/**
 * SparrowTrack - Attendance Handler
 * Manages employee attendance tracking and reporting
 */

class AttendanceHandler {
    constructor(dataManager, userHandler) {
        this.dataManager = dataManager || new DataManager();
        this.userHandler = userHandler || new UserHandler();
    }

    /**
     * Get current date as string
     * @returns {string} Date string (YYYY-MM-DD)
     */
    getCurrentDate() {
        return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    }

    /**
     * Get current time as string
     * @returns {string} Time string (HH:MM:SS)
     */
    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', { hour12: false });
    }

    /**
     * Get formatted date display
     * @param {string} dateStr - Date string
     * @returns {string} Formatted date
     */
    getFormattedDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Calculate time difference in hours
     * @param {string} startTime - Start time (HH:MM:SS)
     * @param {string} endTime - End time (HH:MM:SS)
     * @returns {number} Hours difference
     */
    calculateHours(startTime, endTime) {
        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);
        return Math.max(0, (end - start) / (1000 * 60 * 60));
    }

    /**
     * Format hours to readable string
     * @param {number} hours - Hours as decimal
     * @returns {string} Formatted hours (H hours M minutes)
     */
    formatHours(hours) {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        
        if (wholeHours === 0) {
            return `${minutes} minutes`;
        } else if (minutes === 0) {
            return `${wholeHours} ${wholeHours === 1 ? 'hour' : 'hours'}`;
        } else {
            return `${wholeHours}h ${minutes}m`;
        }
    }

    /**
     * Get user's attendance record for a specific date
     * @param {string} userEmail - User email
     * @param {string} date - Date string (optional, defaults to today)
     * @returns {Object|null} Attendance record
     */
    getAttendanceRecord(userEmail, date = null) {
        if (!date) {
            date = this.getCurrentDate();
        }
        
        const records = this.dataManager.getAttendanceRecords();
        const userRecords = records[userEmail];
        
        return userRecords ? userRecords[date] : null;
    }

    /**
     * Get user's attendance status for today
     * @param {string} userEmail - User email
     * @returns {Object} Attendance status
     */
    getAttendanceStatus(userEmail) {
        const todayRecord = this.getAttendanceRecord(userEmail);
        
        if (!todayRecord) {
            return {
                status: 'not_punched_in',
                message: 'Not Punched In',
                canPunchIn: true,
                canPunchOut: false
            };
        }
        
        if (todayRecord.punchIn && !todayRecord.punchOut) {
            return {
                status: 'punched_in',
                message: 'Currently Working',
                canPunchIn: false,
                canPunchOut: true,
                punchInTime: todayRecord.punchIn,
                workingHours: this.calculateHours(todayRecord.punchIn, this.getCurrentTime())
            };
        }
        
        if (todayRecord.punchIn && todayRecord.punchOut) {
            return {
                status: 'completed',
                message: 'Work Completed',
                canPunchIn: false,
                canPunchOut: false,
                punchInTime: todayRecord.punchIn,
                punchOutTime: todayRecord.punchOut,
                workingHours: todayRecord.workingHours || 0
            };
        }
        
        return {
            status: 'unknown',
            message: 'Unknown Status',
            canPunchIn: true,
            canPunchOut: false
        };
    }

    /**
     * Punch in user
     * @param {string} userEmail - User email
     * @returns {Object} Punch in result
     */
    punchIn(userEmail) {
        if (!userEmail) {
            return {
                success: false,
                message: 'User email is required'
            };
        }

        const today = this.getCurrentDate();
        const currentTime = this.getCurrentTime();
        const records = this.dataManager.getAttendanceRecords();

        // Initialize user records if not exists
        if (!records[userEmail]) {
            records[userEmail] = {};
        }

        // Check if already punched in today
        if (records[userEmail][today] && records[userEmail][today].punchIn) {
            return {
                success: false,
                message: 'You have already punched in today'
            };
        }

        // Create punch in record
        records[userEmail][today] = {
            date: today,
            punchIn: currentTime,
            punchInTimestamp: new Date().toISOString(),
            punchOut: null,
            punchOutTimestamp: null,
            workingHours: 0,
            notes: ''
        };

        // Save records
        if (this.dataManager.setAttendanceRecords(records)) {
            return {
                success: true,
                message: 'Punched in successfully',
                punchInTime: currentTime,
                date: today
            };
        } else {
            return {
                success: false,
                message: 'Failed to record punch in. Please try again.'
            };
        }
    }

    /**
     * Punch out user
     * @param {string} userEmail - User email
     * @param {string} notes - Optional notes for the day
     * @returns {Object} Punch out result
     */
    punchOut(userEmail, notes = '') {
        if (!userEmail) {
            return {
                success: false,
                message: 'User email is required'
            };
        }

        const today = this.getCurrentDate();
        const currentTime = this.getCurrentTime();
        const records = this.dataManager.getAttendanceRecords();

        // Check if user has attendance record for today
        if (!records[userEmail] || !records[userEmail][today]) {
            return {
                success: false,
                message: 'No punch in record found for today'
            };
        }

        const todayRecord = records[userEmail][today];

        // Check if already punched out
        if (todayRecord.punchOut) {
            return {
                success: false,
                message: 'You have already punched out today'
            };
        }

        // Check if punched in
        if (!todayRecord.punchIn) {
            return {
                success: false,
                message: 'Please punch in first'
            };
        }

        // Calculate working hours
        const workingHours = this.calculateHours(todayRecord.punchIn, currentTime);

        // Update record with punch out
        todayRecord.punchOut = currentTime;
        todayRecord.punchOutTimestamp = new Date().toISOString();
        todayRecord.workingHours = workingHours;
        todayRecord.notes = notes.trim();

        // Save records
        if (this.dataManager.setAttendanceRecords(records)) {
            return {
                success: true,
                message: 'Punched out successfully',
                punchOutTime: currentTime,
                workingHours: workingHours,
                formattedHours: this.formatHours(workingHours),
                date: today
            };
        } else {
            return {
                success: false,
                message: 'Failed to record punch out. Please try again.'
            };
        }
    }

    /**
     * Get user's attendance records for a date range
     * @param {string} userEmail - User email
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Array} Attendance records array
     */
    getAttendanceHistory(userEmail, startDate, endDate) {
        const records = this.dataManager.getAttendanceRecords();
        const userRecords = records[userEmail] || {};
        const history = [];

        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date in userRecords) {
            const recordDate = new Date(date);
            if (recordDate >= start && recordDate <= end) {
                const record = userRecords[date];
                history.push({
                    date: date,
                    formattedDate: this.getFormattedDate(date),
                    punchIn: record.punchIn,
                    punchOut: record.punchOut,
                    workingHours: record.workingHours || 0,
                    formattedHours: this.formatHours(record.workingHours || 0),
                    notes: record.notes || '',
                    status: this.getRecordStatus(record)
                });
            }
        }

        // Sort by date (newest first)
        return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Get record status for display
     * @param {Object} record - Attendance record
     * @returns {string} Status string
     */
    getRecordStatus(record) {
        if (!record.punchIn) return 'No Punch In';
        if (record.punchIn && !record.punchOut) return 'Missing Punch Out';
        if (record.workingHours < 4) return 'Short Day';
        if (record.workingHours >= 8) return 'Full Day';
        return 'Partial Day';
    }

    /**
     * Get user's weekly summary
     * @param {string} userEmail - User email
     * @param {string} weekStartDate - Week start date (YYYY-MM-DD)
     * @returns {Object} Weekly summary
     */
    getWeeklySummary(userEmail, weekStartDate) {
        const startDate = new Date(weekStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const history = this.getAttendanceHistory(
            userEmail, 
            startDate.toLocaleDateString('en-CA'),
            endDate.toLocaleDateString('en-CA')
        );

        let totalHours = 0;
        let daysWorked = 0;
        let daysPresent = 0;

        history.forEach(record => {
            if (record.punchIn) {
                daysPresent++;
                if (record.workingHours > 0) {
                    totalHours += record.workingHours;
                    daysWorked++;
                }
            }
        });

        return {
            weekStart: weekStartDate,
            weekEnd: endDate.toLocaleDateString('en-CA'),
            totalHours: totalHours,
            formattedTotalHours: this.formatHours(totalHours),
            averageHours: daysWorked > 0 ? totalHours / daysWorked : 0,
            formattedAverageHours: daysWorked > 0 ? this.formatHours(totalHours / daysWorked) : '0 hours',
            daysWorked: daysWorked,
            daysPresent: daysPresent,
            records: history
        };
    }

    /**
     * Get monthly summary
     * @param {string} userEmail - User email
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     * @returns {Object} Monthly summary
     */
    getMonthlySummary(userEmail, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month

        const history = this.getAttendanceHistory(
            userEmail,
            startDate.toLocaleDateString('en-CA'),
            endDate.toLocaleDateString('en-CA')
        );

        let totalHours = 0;
        let daysWorked = 0;
        let daysPresent = 0;
        let fullDays = 0;

        history.forEach(record => {
            if (record.punchIn) {
                daysPresent++;
                if (record.workingHours > 0) {
                    totalHours += record.workingHours;
                    daysWorked++;
                    if (record.workingHours >= 8) {
                        fullDays++;
                    }
                }
            }
        });

        return {
            month: month,
            year: year,
            monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
            totalHours: totalHours,
            formattedTotalHours: this.formatHours(totalHours),
            averageHours: daysWorked > 0 ? totalHours / daysWorked : 0,
            formattedAverageHours: daysWorked > 0 ? this.formatHours(totalHours / daysWorked) : '0 hours',
            daysWorked: daysWorked,
            daysPresent: daysPresent,
            fullDays: fullDays,
            workingDaysInMonth: this.getWorkingDaysInMonth(year, month),
            records: history
        };
    }

    /**
     * Get working days in a month (excluding weekends)
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     * @returns {number} Working days count
     */
    getWorkingDaysInMonth(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        let workingDays = 0;

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
                workingDays++;
            }
        }

        return workingDays;
    }

    /**
     * Export attendance data to CSV format
     * @param {string} userEmail - User email
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {string} CSV string
     */
    exportToCSV(userEmail, startDate, endDate) {
        const history = this.getAttendanceHistory(userEmail, startDate, endDate);
        
        let csv = 'Date,Day,Punch In,Punch Out,Working Hours,Status,Notes\n';
        
        history.forEach(record => {
            const day = new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' });
            csv += `"${record.date}","${day}","${record.punchIn || ''}","${record.punchOut || ''}","${record.formattedHours}","${record.status}","${record.notes}"\n`;
        });
        
        return csv;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttendanceHandler;
} else {
    window.AttendanceHandler = AttendanceHandler;
}
