class NotificationService {
    constructor(notificationHub) {
        this.notificationHub = notificationHub;
    }

    // Send notification when a new package is added
    sendPackageAddedNotification(packageDetails) {
        const notification = {
            id: Date.now(),
            type: 'package',
            title: 'New Package Added',
            message: `New package "${packageDetails.title}" has been added`,
            timestamp: new Date(),
            sender: 'System',
            actions: ['View Package']
        };

        this.notificationHub.sendAdminNotification(notification);
    }

    // Send notification when a trip is approved
    sendTripApprovedNotification(tripDetails) {
        const notification = {
            id: Date.now(),
            type: 'trip-approval',
            title: 'Trip Approved',
            message: `Trip "${tripDetails.tripName}" has been approved`,
            timestamp: new Date(),
            sender: 'System',
            actions: ['View Trip']
        };

        this.notificationHub.sendAdminNotification(notification);
    }

    // Send notification when a trip is declined
    sendTripDeclinedNotification(tripDetails, reason) {
        const notification = {
            id: Date.now(),
            type: 'trip-declined',
            title: 'Trip Declined',
            message: `Trip "${tripDetails.tripName}" has been declined`,
            details: reason,
            timestamp: new Date(),
            sender: 'System',
            actions: ['View Trip']
        };

        this.notificationHub.sendAdminNotification(notification);
    }

    // Send emergency notification
    sendEmergencyNotification(emergencyDetails) {
        const notification = {
            id: Date.now(),
            type: 'emergency',
            title: 'Emergency Alert',
            message: emergencyDetails.message,
            timestamp: new Date(),
            sender: emergencyDetails.sender,
            actions: ['View Details', 'Respond']
        };

        this.notificationHub.sendAdminNotification(notification);
    }

    // Send system notification
    sendSystemNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            type,
            title: 'System Notification',
            message,
            timestamp: new Date(),
            sender: 'System',
            actions: []
        };

        this.notificationHub.sendAdminNotification(notification);
    }
}

export default NotificationService; 