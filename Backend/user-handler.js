/**
 * SparrowTrack - User Handler
 * Manages user authentication and profile operations
 */

class UserHandler {
    constructor(dataManager) {
        this.dataManager = dataManager || new DataManager();
        this.currentUser = null;
        this.loadCurrentUser();
    }

    /**
     * Load current user from localStorage
     */
    loadCurrentUser() {
        try {
            const savedUser = localStorage.getItem('sparrowtrack_currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        } catch (error) {
            console.error('Error loading current user:', error);
            this.currentUser = null;
        }
    }

    /**
     * Generate unique employee ID
     * @returns {string} Employee ID
     */
    generateEmployeeId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `EMP${timestamp}${random}`;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePassword(password) {
        const result = {
            isValid: true,
            errors: []
        };

        if (password.length < 6) {
            result.isValid = false;
            result.errors.push('Password must be at least 6 characters long');
        }

        if (!/[A-Za-z]/.test(password)) {
            result.isValid = false;
            result.errors.push('Password must contain at least one letter');
        }

        return result;
    }

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Object} Registration result
     */
    register(userData) {
        const { name, email, password, department, position } = userData;
        
        // Validate required fields
        if (!name || !email || !password || !department || !position) {
            return {
                success: false,
                message: 'All fields are required'
            };
        }

        // Validate email format
        if (!this.validateEmail(email)) {
            return {
                success: false,
                message: 'Please enter a valid email address'
            };
        }

        // Validate password
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
            return {
                success: false,
                message: passwordValidation.errors.join('. ')
            };
        }

        // Check if user already exists
        const users = this.dataManager.getUsers();
        if (users[email.toLowerCase()]) {
            return {
                success: false,
                message: 'User already exists with this email'
            };
        }

        // Create new user
        const employeeId = this.generateEmployeeId();
        const newUser = {
            id: employeeId,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password, // In production, hash this password
            department: department.trim(),
            position: position.trim(),
            registrationDate: new Date().toISOString(),
            isActive: true,
            lastLogin: null
        };

        // Save user
        users[email.toLowerCase()] = newUser;
        if (this.dataManager.setUsers(users)) {
            return {
                success: true,
                message: 'Account created successfully',
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    department: newUser.department,
                    position: newUser.position
                }
            };
        } else {
            return {
                success: false,
                message: 'Failed to create account. Please try again.'
            };
        }
    }

    /**
     * Authenticate user login
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Login result
     */
    login(email, password) {
        if (!email || !password) {
            return {
                success: false,
                message: 'Email and password are required'
            };
        }

        const users = this.dataManager.getUsers();
        const user = users[email.toLowerCase()];

        if (!user) {
            return {
                success: false,
                message: 'No account found with this email'
            };
        }

        if (user.password !== password) {
            return {
                success: false,
                message: 'Incorrect password'
            };
        }

        if (!user.isActive) {
            return {
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            };
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        users[email.toLowerCase()] = user;
        this.dataManager.setUsers(users);

        // Set current user
        this.currentUser = user;
        localStorage.setItem('sparrowtrack_currentUser', JSON.stringify(user));

        return {
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                department: user.department,
                position: user.position,
                lastLogin: user.lastLogin
            }
        };
    }

    /**
     * Logout current user
     * @returns {Object} Logout result
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('sparrowtrack_currentUser');
        return {
            success: true,
            message: 'Logged out successfully'
        };
    }

    /**
     * Get current user
     * @returns {Object|null} Current user data
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is logged in
     * @returns {boolean} Is user logged in
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Update user profile
     * @param {Object} updates - Profile updates
     * @returns {Object} Update result
     */
    updateProfile(updates) {
        if (!this.isLoggedIn()) {
            return {
                success: false,
                message: 'Please login first'
            };
        }

        const users = this.dataManager.getUsers();
        const userEmail = this.currentUser.email;
        const user = users[userEmail];

        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Update allowed fields
        const allowedFields = ['name', 'department', 'position'];
        let hasUpdates = false;

        allowedFields.forEach(field => {
            if (updates[field] && updates[field].trim() !== user[field]) {
                user[field] = updates[field].trim();
                hasUpdates = true;
            }
        });

        if (!hasUpdates) {
            return {
                success: false,
                message: 'No changes detected'
            };
        }

        user.lastUpdated = new Date().toISOString();
        users[userEmail] = user;

        if (this.dataManager.setUsers(users)) {
            // Update current user
            this.currentUser = user;
            localStorage.setItem('sparrowtrack_currentUser', JSON.stringify(user));

            return {
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    department: user.department,
                    position: user.position
                }
            };
        } else {
            return {
                success: false,
                message: 'Failed to update profile'
            };
        }
    }

    /**
     * Get all users (admin function)
     * @returns {Array} List of all users
     */
    getAllUsers() {
        const users = this.dataManager.getUsers();
        return Object.values(users).map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            position: user.position,
            registrationDate: user.registrationDate,
            lastLogin: user.lastLogin,
            isActive: user.isActive
        }));
    }

    /**
     * Deactivate user account
     * @param {string} email - User email to deactivate
     * @returns {Object} Deactivation result
     */
    deactivateUser(email) {
        const users = this.dataManager.getUsers();
        const user = users[email.toLowerCase()];

        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        user.isActive = false;
        user.deactivatedDate = new Date().toISOString();
        users[email.toLowerCase()] = user;

        if (this.dataManager.setUsers(users)) {
            return {
                success: true,
                message: 'User account deactivated'
            };
        } else {
            return {
                success: false,
                message: 'Failed to deactivate user'
            };
        }
    }

    /**
     * Activate user account
     * @param {string} email - User email to activate
     * @returns {Object} Activation result
     */
    activateUser(email) {
        const users = this.dataManager.getUsers();
        const user = users[email.toLowerCase()];

        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        user.isActive = true;
        user.reactivatedDate = new Date().toISOString();
        delete user.deactivatedDate;
        users[email.toLowerCase()] = user;

        if (this.dataManager.setUsers(users)) {
            return {
                success: true,
                message: 'User account activated'
            };
        } else {
            return {
                success: false,
                message: 'Failed to activate user'
            };
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserHandler;
} else {
    window.UserHandler = UserHandler;
}
