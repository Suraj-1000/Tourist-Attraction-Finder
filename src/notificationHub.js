import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

class NotificationHub {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: ['http://localhost:4000', 'http://localhost:5173'],
                methods: ['GET', 'POST'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.adminRoom = 'admin-room';
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('joinAdminRoom', () => {
                socket.join(this.adminRoom);
                console.log('Admin joined notification room:', socket.id);
                
                // Send a test notification to confirm connection
                this.sendNotification({
                    type: 'system',
                    message: 'Connected to notification system',
                    timestamp: new Date(),
                    id: uuidv4()
                });
            });

            // Handle notification read status
            socket.on('notificationRead', (notificationId) => {
                console.log('Notification marked as read:', notificationId);
                // Broadcast to all clients in the admin room
                this.io.to(this.adminRoom).emit('notificationRead', notificationId);
            });

            // Handle notification unread status
            socket.on('notificationUnread', (notificationId) => {
                console.log('Notification marked as unread:', notificationId);
                // Broadcast to all clients in the admin room
                this.io.to(this.adminRoom).emit('notificationUnread', notificationId);
            });

            // Handle clear all notifications
            socket.on('clearAllNotifications', () => {
                console.log('Clearing all notifications');
                // Broadcast to all clients in the admin room
                this.io.to(this.adminRoom).emit('clearAllNotifications');
            });

            // Handle notification delete
            socket.on('notificationDelete', (notificationId) => {
                console.log('Notification deleted:', notificationId);
                // Broadcast to all clients in the admin room
                this.io.to(this.adminRoom).emit('notificationDelete', notificationId);
                console.log('Broadcasted notificationDelete event to admin room');
            });

            socket.on('disconnect', (reason) => {
                console.log('Client disconnected:', socket.id, 'Reason:', reason);
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });
        });
    }

    sendNotification(notification) {
        // Ensure notification has required fields
        const formattedNotification = {
            id: notification.id || uuidv4(),
            type: notification.type || 'system',
            message: notification.message,
            details: notification.details,
            timestamp: notification.timestamp || new Date(),
            read: false
        };

        console.log('Sending notification:', formattedNotification);
        this.io.to(this.adminRoom).emit('notification', formattedNotification);
    }

    sendTripApprovalNotification(tripData) {
        this.sendNotification({
            type: 'trip-approval',
            message: `Trip "${tripData.tripName}" has been approved`,
            details: 'Trip successfully approved',
            timestamp: new Date(),
            id: uuidv4()
        });
    }

    sendTripDeclinedNotification(tripData) {
        this.sendNotification({
            type: 'trip-declined',
            message: `Trip "${tripData.tripName}" has been declined`,
            details: tripData.declineMessage || 'No reason provided',
            timestamp: new Date(),
            id: uuidv4()
        });
    }

    sendPackageAddedNotification(packageData) {
        this.sendNotification({
            type: 'package-added',
            message: `New package "${packageData.title}" has been added`,
            details: `Category: ${packageData.category}\nPrice: ${packageData.price}\nDuration: ${packageData.duration}`,
            timestamp: new Date(),
            id: uuidv4()
        });
    }

    sendPackageUpdatedNotification(packageData) {
        this.sendNotification({
            type: 'package-updated',
            message: `Package "${packageData.title}" has been updated`,
            details: `Category: ${packageData.category}\nPrice: ${packageData.price}\nDuration: ${packageData.duration}`,
            timestamp: new Date(),
            id: uuidv4()
        });
    }
}

export default NotificationHub; 