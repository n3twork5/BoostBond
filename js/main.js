/**
 * N3twork Donation Site - Simplified Version
 * Essential features: Theme toggle and Profile shuffle
 */

'use strict';

// Utility to safely access localStorage (works in file:// mode)
const SafeStorage = {
    getItem: function(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage not available:', e);
            return null;
        }
    },
    setItem: function(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
    }
};

// Simple global state
const AppState = {
    initialized: false,
    theme: SafeStorage.getItem('theme') || 'light',
    profilePictures: [
        'images/profile1.jpg',
        'images/profile2.jpg', 
        'images/profile3.jpg',
        'images/profile4.jpg'
    ],
    currentProfileIndex: parseInt(SafeStorage.getItem('currentProfileIndex')) || 0,
    donations: [],
    stats: {
        totalRaised: 0,
        monthlyRaised: 0,
        toolsSupported: 0,
        contributors: 0
    }
};

// Utility functions
const Utils = {
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease-out, slideOut 0.3s ease-in 2.7s;
            animation-fill-mode: both;
            background: ${type === 'info' ? '#17a2b8' : type === 'success' ? '#28a745' : '#ffc107'};
        `;
        
        // Add animations
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },

    // Copy to clipboard
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard! ✅', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                this.showNotification('Copied to clipboard! ✅', 'success');
            } catch (fallbackErr) {
                this.showNotification('Failed to copy to clipboard', 'error');
            }
            document.body.removeChild(textArea);
        }
    }
};

// Theme management
const ThemeManager = {
    init: function() {
        this.setTheme(AppState.theme);
        this.bindEvents();
    },

    setTheme: function(theme) {
        AppState.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        SafeStorage.setItem('theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    },

    toggleTheme: function() {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        Utils.showNotification(`Switched to ${newTheme} mode`, 'success');
    },

    bindEvents: function() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
};

// Profile picture management
const ProfileManager = {
    init: function() {
        this.updateProfileImages();
        this.bindEvents();
        this.addProfileStyles();
    },

    shuffleProfile: function() {
        const currentIndex = AppState.currentProfileIndex;
        let newIndex;
        
        // Ensure we get a different profile picture
        do {
            newIndex = Math.floor(Math.random() * AppState.profilePictures.length);
        } while (newIndex === currentIndex && AppState.profilePictures.length > 1);
        
        AppState.currentProfileIndex = newIndex;
        SafeStorage.setItem('currentProfileIndex', newIndex.toString());
        
        this.updateProfileImages();
        Utils.showNotification('Profile picture shuffled! 🎲', 'info');
    },

    updateProfileImages: function() {
        const profileImages = document.querySelectorAll('.profile-image, .about-profile-image');
        const newImageSrc = AppState.profilePictures[AppState.currentProfileIndex];
        
        profileImages.forEach(img => {
            img.style.transition = 'opacity 0.3s ease';
            img.style.opacity = '0.5';
            
            setTimeout(() => {
                img.src = newImageSrc;
                img.style.opacity = '1';
            }, 150);
        });
    },

    bindEvents: function() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('profile-image') || 
                e.target.classList.contains('about-profile-image')) {
                e.preventDefault();
                this.shuffleProfile();
            }
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && 
                (e.target.classList.contains('profile-image') || 
                 e.target.classList.contains('about-profile-image'))) {
                e.preventDefault();
                this.shuffleProfile();
            }
        });
    },

    addProfileStyles: function() {
        if (!document.querySelector('#profile-styles')) {
            const style = document.createElement('style');
            style.id = 'profile-styles';
            style.textContent = `
                .profile-image, .about-profile-image {
                    cursor: pointer;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    user-select: none;
                }
                
                .profile-image:hover, .about-profile-image:hover {
                    transform: scale(1.05);
                }
                
                .profile-image:active, .about-profile-image:active {
                    transform: scale(0.95);
                }
                
                .profile-image:focus, .about-profile-image:focus {
                    outline: 2px solid #007bff;
                    outline-offset: 2px;
                    border-radius: 4px;
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// Donation tracking system
const DonationTracker = {
    init: function() {
        this.loadDonations();
        this.updateStats();
        // Auto-checking disabled - only manual donations will be tracked
        // setInterval(() => this.checkForNewDonations(), 30000);
    },

    loadDonations: function() {
        // Reset donations and stats to 0
        AppState.donations = [];
        AppState.stats = {
            totalRaised: 0,
            monthlyRaised: 0,
            toolsSupported: 0,
            contributors: 0
        };
        // Clear any existing data in storage
        SafeStorage.setItem('donations', '[]');
        SafeStorage.setItem('stats', JSON.stringify(AppState.stats));
    },

    addDonation: function(donation) {
        const newDonation = {
            id: Date.now().toString(),
            amount: parseFloat(donation.amount),
            tool: donation.tool || 'General',
            method: donation.method || 'Unknown',
            contributor: donation.contributor || 'Anonymous',
            timestamp: new Date().toISOString(),
            month: new Date().getMonth(),
            year: new Date().getFullYear()
        };

        AppState.donations.push(newDonation);
        this.saveDonations();
        this.updateStats();
        this.showDonationNotification(newDonation);
    },

    saveDonations: function() {
        SafeStorage.setItem('donations', JSON.stringify(AppState.donations));
        SafeStorage.setItem('stats', JSON.stringify(AppState.stats));
    },

    updateStats: function() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Calculate this month's donations
        const thisMonthDonations = AppState.donations.filter(d => 
            d.month === currentMonth && d.year === currentYear
        );
        
        const monthlyTotal = thisMonthDonations.reduce((sum, d) => sum + d.amount, 0);
        const totalRaised = AppState.donations.reduce((sum, d) => sum + d.amount, 0);
        const uniqueContributors = new Set(AppState.donations.map(d => d.contributor)).size;
        const supportedTools = new Set(AppState.donations.filter(d => d.tool !== 'General').map(d => d.tool)).size;

        AppState.stats = {
            totalRaised: totalRaised,
            monthlyRaised: monthlyTotal,
            toolsSupported: supportedTools,
            contributors: uniqueContributors
        };

        this.saveDonations();
        this.displayStats();
    },

    displayStats: function() {
        const stats = AppState.stats;
        const statElements = document.querySelectorAll('.stat-number');
        
        if (statElements[0]) {
            statElements[0].textContent = `$${stats.monthlyRaised.toFixed(0)}`;
        }
        if (statElements[1]) {
            statElements[1].textContent = stats.toolsSupported;
        }
        if (statElements[2]) {
            statElements[2].textContent = stats.contributors;
        }
    },

    showDonationNotification: function(donation) {
        Utils.showNotification(
            `🎉 New $${donation.amount} donation received for ${donation.tool}! Thank you ${donation.contributor}!`,
            'success'
        );
    },

    checkForNewDonations: function() {
        // This function is disabled for production
        // In a real implementation, this would check actual payment processor APIs
        // (Ko-fi API, GitHub Sponsors webhooks, blockchain monitoring, etc.)
        // For now, donations are only added manually when actually received
    },

    // Admin function to manually add donations
    manualAddDonation: function(amount, tool, method, contributor) {
        this.addDonation({
            amount: amount,
            tool: tool,
            method: method,
            contributor: contributor || 'Anonymous'
        });
    },

    // Get donation history
    getDonationHistory: function() {
        return AppState.donations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    // Reset stats (for testing)
    resetStats: function() {
        AppState.donations = [];
        AppState.stats = { totalRaised: 0, monthlyRaised: 0, toolsSupported: 0, contributors: 0 };
        this.saveDonations();
        this.displayStats();
        Utils.showNotification('Stats reset successfully', 'info');
    }
};

// Navigation (smooth scrolling)
const NavigationManager = {
    init: function() {
        this.setupSmoothScrolling();
        this.bindMobileMenu();
    },

    setupSmoothScrolling: function() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },

    bindMobileMenu: function() {
        const hamburger = document.getElementById('hamburger');
        const navbarMenu = document.querySelector('.navbar-menu');
        
        if (hamburger && navbarMenu) {
            hamburger.addEventListener('click', () => {
                navbarMenu.classList.toggle('show');
                hamburger.classList.toggle('active');
            });
        }
    }
};

// Tool data
const ToolData = {
    ubertooth: {
        name: 'Ubertooth One',
        description: 'Bluetooth Low Energy (BLE) development and research platform for wireless security testing.',
        details: {
            specifications: [
                '2.4 GHz ISM band operation',
                'Bluetooth baseband analysis',
                'Real-time packet capture',
                'Open source firmware',
                'USB 2.0 interface'
            ],
            uses: [
                'Bluetooth security assessment',
                'BLE protocol analysis', 
                'Bluetooth packet sniffing',
                'IoT device testing',
                'Bluetooth penetration testing'
            ],
            priority: 'Medium Priority - Specialized Bluetooth research'
        }
    },
    obdii: {
        name: 'OBD-II Port Connector',
        description: 'Automotive diagnostic tool for vehicle security research and CAN bus analysis.',
        details: {
            specifications: [
                'OBD-II/EOBD compliant',
                'CAN bus interface',
                'Real-time data monitoring',
                'Diagnostic trouble codes',
                'Vehicle parameter access'
            ],
            uses: [
                'Automotive security research',
                'CAN bus analysis',
                'Vehicle diagnostics',
                'ECU communication testing',
                'Connected car security'
            ],
            priority: 'Medium Priority - Automotive security focus'
        }
    },
    alpha: {
        name: 'WiFi Alpha Adapter',
        description: 'High-gain USB WiFi adapter for wireless penetration testing and security research.',
        details: {
            specifications: [
                'High-gain external antenna',
                'Monitor mode support',
                'Packet injection capability',
                'Wide compatibility',
                'USB 3.0 interface'
            ],
            uses: [
                'WiFi penetration testing',
                'Wireless network auditing',
                'Long-range WiFi analysis',
                'Wireless security assessments',
                'Network monitoring'
            ],
            priority: 'High Priority - Core wireless testing tool'
        }
    },
    rfgen: {
        name: 'RF Signal Generator',
        description: 'Professional RF signal generator for testing and development of wireless communication systems.',
        details: {
            specifications: [
                'Wide frequency range coverage',
                'Precise signal generation',
                'Multiple modulation types',
                'High frequency stability',
                'Professional calibration'
            ],
            uses: [
                'RF circuit testing',
                'Wireless system development',
                'Signal integrity testing', 
                'Calibration of RF equipment',
                'Research and development'
            ],
            priority: 'Critical Priority - Essential for advanced RF research'
        }
    },
    hackrfpro: {
        name: 'HackRF Pro',
        description: 'Advanced Software Defined Radio platform with enhanced features for professional RF analysis and research applications.',
        details: {
            specifications: [
                'Extended frequency range: 1 MHz to 7.2 GHz',
                'Full-duplex transceiver capability',
                'Up to 50 million samples per second',
                'Enhanced filtering and signal processing',
                'Professional-grade build quality',
                'Advanced debugging features'
            ],
            uses: [
                'Professional RF research and development',
                'Advanced signal intelligence operations',
                'High-performance wireless protocol testing',
                'Professional penetration testing',
                'Research-grade spectrum analysis',
                'Commercial RF application development'
            ],
            priority: 'Critical Priority - Professional-grade RF research platform'
        }
    },
    rtlsdr: {
        name: 'RTL-SDR',
        description: 'Affordable Software Defined Radio dongle perfect for learning RF analysis and signal monitoring for beginners.',
        details: {
            specifications: [
                'Frequency range: 500 kHz to 1.75 GHz',
                'Maximum sample rate: 3.2 MS/s',
                'USB 2.0 interface',
                'Low cost and beginner-friendly',
                'Wide software compatibility',
                'Compact dongle form factor'
            ],
            uses: [
                'Learning RF concepts and SDR basics',
                'Amateur radio experimentation',
                'Basic spectrum monitoring',
                'Educational RF projects',
                'Entry-level signal analysis',
                'Radio frequency exploration'
            ],
            priority: 'Medium Priority - Essential for RF learning and education'
        }
    },
    pineapple: {
        name: 'WiFi Pineapple',
        description: 'Professional wireless auditing platform by Hak5 for advanced WiFi penetration testing and network reconnaissance.',
        details: {
            specifications: [
                'Dual-band WiFi (2.4GHz & 5GHz)',
                'High-gain directional antennas',
                'Web-based management interface',
                'Modular payload system',
                'Long-range wireless capabilities',
                'Professional penetration testing platform'
            ],
            uses: [
                'WiFi penetration testing and auditing',
                'Rogue access point detection',
                'Man-in-the-middle attacks (authorized testing)',
                'Wireless network reconnaissance',
                'Professional red team operations',
                'Advanced WiFi security assessments'
            ],
            priority: 'Critical Priority - Professional wireless auditing platform'
        }
    }
};

// Modal management for tools
const ToolModalManager = {
    showToolDetails: function(toolId) {
        const tool = ToolData[toolId];
        if (!tool) return;
        
        const modal = this.createModal(`toolDetails-${toolId}`, `${tool.name} - Details`, `
            <div class="tool-details">
                <p>${tool.description}</p>
                
                <h4>Specifications</h4>
                <ul>
                    ${tool.details.specifications.map(spec => `<li>${spec}</li>`).join('')}
                </ul>
                
                <h4>Use Cases</h4>
                <ul>
                    ${tool.details.uses.map(use => `<li>${use}</li>`).join('')}
                </ul>
                
                <h4>Priority</h4>
                <p><strong>${tool.details.priority}</strong></p>
            </div>
        `);
        
        this.showModal(modal);
    },
    
    showPaymentOptions: function(toolId) {
        const tool = ToolData[toolId];
        if (!tool) return;
        
        const modal = this.createModal(`toolPayment-${toolId}`, `Support ${tool.name}`, `
            <div class="payment-options">
                <div class="payment-option" onclick="window.open('https://ko-fi.com/n3twork', '')">
                    <div class="payment-icon">☕</div>
                    <div>
                        <strong>Ko-fi</strong><br>
                        <small>Quick and easy donation</small>
                    </div>
                </div>
                
                <div class="payment-option" onclick="window.open('https://github.com/sponsors/n3twork5', '')">
                    <div class="payment-icon">⭐</div>
                    <div>
                        <strong>GitHub Sponsors</strong><br>
                        <small>Monthly or one-time sponsorship</small>
                    </div>
                </div>
                
                <div class="payment-option" onclick="showCryptoModal()">
                    <div class="payment-icon">₿</div>
                    <div>
                        <strong>Cryptocurrency</strong><br>
                        <small>Bitcoin, Ethereum, and more</small>
                    </div>
                </div>
                
                <div class="payment-option" onclick="Utils.copyToClipboard('networkmandaean@gmail.com')">
                    <div class="payment-icon">✉️</div>
                    <div>
                        <strong>Contact Direct</strong><br>
                        <small>Click to copy email address</small>
                    </div>
                </div>
            </div>
            <p style="text-align: center; margin-top: 1rem; color: var(--text-muted); font-size: 0.9rem;">Choose your preferred payment method to support this tool</p>
        `);
        
        this.showModal(modal);
    },
    
    createModal: function(id, title, content) {
        // Remove existing modal if it exists
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close" onclick="ToolModalManager.hideModal('${id}')">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    },
    
    showModal: function(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal(modal.id);
            }
        });
    },
    
    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
        }
    }
};

// Global functions for HTML onclick handlers
window.showToolDetails = function(toolId) {
    ToolModalManager.showToolDetails(toolId);
};

window.showPaymentOptions = function(toolId) {
    ToolModalManager.showPaymentOptions(toolId);
};

window.showCryptoModal = function() {
    const modal = ToolModalManager.createModal('cryptoModal', 'Cryptocurrency Donations', `
        <div class="payment-options">
            <div class="payment-option" onclick="Utils.copyToClipboard('bc1qhg9ep5m0xajkt4xn3l8szlu44hx9e9v08hudmq')">
                <div class="payment-icon crypto-icon">
                    <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/btc.svg" alt="Bitcoin" class="crypto-logo">
                </div>
                <div>
                    <strong>Bitcoin (BTC)</strong><br>
                    <small>bc1qhg9ep5m0xajkt4xn3l8szlu44hx9e9v08hudmq</small>
                </div>
            </div>
            
            <div class="payment-option" onclick="Utils.copyToClipboard('0x7c96c8b0664Fe92EF5E734711DFA12D527d975C2')">
                <div class="payment-icon crypto-icon">
                    <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/eth.svg" alt="Ethereum" class="crypto-logo">
                </div>
                <div>
                    <strong>Ethereum (ETH)</strong><br>
                    <small>0x7c96c8b0664Fe92EF5E734711DFA12D527d975C2</small>
                </div>
            </div>
            
            <div class="payment-option" onclick="Utils.copyToClipboard('0x7c96c8b0664Fe92EF5E734711DFA12D527d975C2')">
                <div class="payment-icon crypto-icon">
                    <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/bnb.svg" alt="Binance" class="crypto-logo">
                </div>
                <div>
                    <strong>Binance (BNB)</strong><br>
                    <small>0x7c96c8b0664Fe92EF5E734711DFA12D527d975C2</small>
                </div>
            </div>
            
            <div class="payment-option" onclick="Utils.copyToClipboard('ltc1q7ypp6f4n258rm00a6kkhscuq2xd27v26wkz0cr')">
                <div class="payment-icon crypto-icon">
                    <img src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/ltc.svg" alt="Litecoin" class="crypto-logo">
                </div>
                <div>
                    <strong>Litecoin (LTC)</strong><br>
                    <small>ltc1q7ypp6f4n258rm00a6kkhscuq2xd27v26wkz0cr</small>
                </div>
            </div>
        </div>
        <p style="text-align: center; margin-top: 1rem; color: var(--text-muted); font-size: 0.9rem;">Click on any cryptocurrency to copy its address to your clipboard</p>
    `);
    
    ToolModalManager.showModal(modal);
};

// Global donation functions (for manual management)
window.addDonation = function(amount, tool, method, contributor) {
    DonationTracker.manualAddDonation(amount, tool, method, contributor);
};

window.viewStats = function() {
    const stats = AppState.stats;
    const history = DonationTracker.getDonationHistory().slice(0, 5); // Last 5 donations
    
    const modal = ToolModalManager.createModal('statsModal', 'Donation Statistics', `
        <div class="legal-content">
            <h4>📊 Current Stats</h4>
            <ul>
                <li><strong>This Month:</strong> $${stats.monthlyRaised.toFixed(0)}</li>
                <li><strong>Total Raised:</strong> $${stats.totalRaised.toFixed(0)}</li>
                <li><strong>Tools Supported:</strong> ${stats.toolsSupported}</li>
                <li><strong>Contributors:</strong> ${stats.contributors}</li>
            </ul>
            
            <h4>🕐 Recent Donations</h4>
            ${history.length > 0 ? 
                '<ul>' + history.map(d => 
                    `<li><strong>$${d.amount}</strong> for ${d.tool} via ${d.method} by ${d.contributor}</li>`
                ).join('') + '</ul>' : 
                '<p>No donations received yet. When supporters donate, their contributions will appear here.</p>'
            }
        </div>
    `);
    
    ToolModalManager.showModal(modal);
};

// Sample donation function removed - donations now only added when actually received

window.resetStats = function() {
    DonationTracker.resetStats();
};

// Legal modals
window.showPrivacyModal = function() {
    const modal = ToolModalManager.createModal('privacyModal', 'Privacy Policy', `
        <div class="legal-content">
            <h4>What We Collect</h4>
            <p>We collect minimal data: payment info (via Ko-fi/GitHub), your email when you contact us, and basic technical data for security.</p>

            <h4>How We Use It</h4>
            <p>To process donations, provide support, and keep the site secure. We don't sell your data.</p>

            <h4>Your Rights</h4>
            <p>You can request access, corrections, or deletion of your data.</p>

            <h4>Contact</h4>
            <p>Questions? <a href="mailto:networkmandaean@gmail.com"><strong>networkmandaean@gmail.com</strong></a></p>
        </div>
    `);
    
    ToolModalManager.showModal(modal);
};

window.showTermsModal = function() {
    const modal = ToolModalManager.createModal('termsModal', 'Terms of Service', `
        <div class="legal-content">
            <h4>The Basics</h4>
            <p>This site helps fund cybersecurity tools. By using it, you agree to these simple terms.</p>

            <h4>Donations</h4>
            <p>All donations are voluntary and non-refundable. Funds go to the tools described. You handle your own taxes.</p>

            <h4>Rules</h4>
            <p><strong>Do:</strong> Be honest, use legally<br>
            <strong>Don't:</strong> Fraud, hack, harass</p>

            <h4>No Warranties</h4>
            <p>Site provided "as is". We're not liable for issues beyond our control.</p>

            <h4>Questions?</h4>
            <p><a href="mailto:networkmandaean@gmail.com"><strong>networkmandaean@gmail.com</strong></a></p>
        </div>
    `);
    
    ToolModalManager.showModal(modal);
};

window.showSecurityModal = function() {
    const modal = ToolModalManager.createModal('securityModal', 'Security Information', `
        <div class="legal-content">
            <h4>🔒 We Keep You Safe</h4>
            <p>Your data is encrypted (SSL/HTTPS), stored securely, and we collect minimal information.</p>

            <h4>🛡️ Payment Security</h4>
            <p>Ko-fi, GitHub, and crypto networks handle payments. We never store your card info.</p>

            <h4>🔐 Site Protection</h4>
            <p>Multi-factor auth, attack prevention, 24/7 monitoring, and regular security updates.</p>

            <h4>📧 Found a Bug?</h4>
            <p>Report security issues: <a href="mailto:networkmandaean@gmail.com?subject=[SECURITY] Vulnerability Report"><strong>networkmandaean@gmail.com</strong></a></p>
            <p>We respond within 24 hours.</p>
        </div>
    `);
    
    ToolModalManager.showModal(modal);
};

// Initialize when page loads - works in both server and file:// modes
function initializeApp() {
    console.log('🚀 n3twork Donation Site - Simple Version Loaded');
    
    try {
        // Initialize managers
        ThemeManager.init();
        ProfileManager.init();
        NavigationManager.init();
        DonationTracker.init();
        
        // Welcome message
        Utils.showNotification('Welcome! Click profile pictures to shuffle 🎲', 'success');
        
        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    ToolModalManager.hideModal(openModal.id);
                }
            }
        });
    } catch (error) {
        console.error('Initialization error:', error);
        // Fallback initialization
        if (typeof ThemeManager !== 'undefined') ThemeManager.init();
        if (typeof ProfileManager !== 'undefined') ProfileManager.init();
        if (typeof DonationTracker !== 'undefined') DonationTracker.init();
    }
}

// Multiple initialization methods to ensure it works in all environments
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // Document already loaded
    initializeApp();
}

// Backup initialization for file:// protocol
window.addEventListener('load', function() {
    // Small delay to ensure all resources are loaded
    setTimeout(function() {
        if (typeof AppState === 'undefined' || !AppState.initialized) {
            initializeApp();
            if (typeof AppState !== 'undefined') AppState.initialized = true;
        }
    }, 100);
});
