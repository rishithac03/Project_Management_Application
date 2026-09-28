import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../../styles/notificationBell.css";

function NotificationBell() {

    const user = useSelector(
        (state) => state.auth.user
    );

    const navigate = useNavigate();

    const [notifications, setNotifications] =
        useState([]);

    const [showNotifications, setShowNotifications] =
        useState(false);


    // =========================================
    // LOAD NOTIFICATIONS
    // =========================================

    const loadNotifications = async () => {

        if (!user?.id) {
            return;
        }

        try {

            const response = await axios.get(
                `http://localhost:3000/notifications?userId=${user.id}&_sort=createdAt&_order=desc`
            );

            setNotifications(response.data);

        } catch (error) {

            console.error(
                "Error loading notifications:",
                error
            );

        }

    };


    // =========================================
    // LOAD + POLLING
    // =========================================

    useEffect(() => {

        if (!user?.id) {
            return;
        }

        loadNotifications();

        const interval = setInterval(() => {

            loadNotifications();

        }, 3000);


        return () => {

            clearInterval(interval);

        };

    }, [user]);


    // =========================================
    // UNREAD COUNT
    // =========================================

    const unreadCount =
        notifications.filter(
            (notification) =>
                notification.read === false
        ).length;


    // =========================================
    // MARK AS READ
    // =========================================

    const markAsRead = async (
        notification
    ) => {

        try {

            await axios.patch(
                `http://localhost:3000/notifications/${notification.id}`,
                {
                    read: true
                }
            );

            setNotifications(
                (previousNotifications) =>
                    previousNotifications.map(
                        (item) =>
                            item.id === notification.id
                                ? {
                                    ...item,
                                    read: true
                                }
                                : item
                    )
            );

        } catch (error) {

            console.error(
                "Error marking notification as read:",
                error
            );

        }

    };


    // =========================================
    // CLICK NOTIFICATION
    // =========================================
    const handleNotificationClick = async (notification) => {

        if (!notification.read) {
            await markAsRead(notification);
        }

        setShowNotifications(false);

        // ========================================
        // BUG NOTIFICATION
        // ========================================

        if (notification.bugId) {

            navigate(
                `/bugs/${notification.bugId}`
            );

            return;
        }

        // ========================================
        // TASK NOTIFICATION
        // ========================================

        if (notification.taskId) {

            navigate(
                `/tasks/${notification.taskId}`
            );

            return;
        }
    };

    // =========================================
    // MARK ALL AS READ
    // =========================================

    const markAllAsRead = async () => {

        try {

            const unreadNotifications =
                notifications.filter(
                    (notification) =>
                        notification.read === false
                );


            await Promise.all(
                unreadNotifications.map(
                    (notification) =>
                        axios.patch(
                            `http://localhost:3000/notifications/${notification.id}`,
                            {
                                read: true
                            }
                        )
                )
            );


            setNotifications(
                (previousNotifications) =>
                    previousNotifications.map(
                        (notification) => ({
                            ...notification,
                            read: true
                        })
                    )
            );

        } catch (error) {

            console.error(
                "Error marking notifications:",
                error
            );

        }

    };


    // =========================================
    // TIME FORMAT
    // =========================================

    const formatTime = (date) => {

        if (!date) {
            return "";
        }

        const notificationDate =
            new Date(date);

        const now = new Date();

        const difference =
            Math.floor(
                (now - notificationDate) / 1000
            );


        if (difference < 60) {

            return "Just now";

        }


        if (difference < 3600) {

            return `${Math.floor(
                difference / 60
            )} min ago`;

        }


        if (difference < 86400) {

            return `${Math.floor(
                difference / 3600
            )} hr ago`;

        }


        return notificationDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short"
            }
        );

    };


    return (

        <div className="notification-wrapper">


            {/* BELL */}

            <button
                className="notification-button"
                onClick={() =>
                    setShowNotifications(
                        (previous) =>
                            !previous
                    )
                }
            >

                <span className="notification-icon">
                    🔔
                </span>


                {unreadCount > 0 && (

                    <span className="notification-count">

                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}

                    </span>

                )}

            </button>


            {/* DROPDOWN */}

            {showNotifications && (

                <div className="notification-dropdown">


                    {/* HEADER */}

                    <div className="notification-header">

                        <h3>
                            Notifications
                        </h3>


                        {unreadCount > 0 && (

                            <button
                                onClick={
                                    markAllAsRead
                                }
                            >
                                Mark all as read
                            </button>

                        )}

                    </div>


                    {/* NOTIFICATIONS */}

                    <div className="notification-list">

                        {notifications.length === 0 ? (

                            <div className="no-notifications">

                                <p>
                                    No notifications
                                </p>

                            </div>

                        ) : (

                            notifications.map(
                                (notification) => (

                                    <div
                                        key={
                                            notification.id
                                        }
                                        className={`notification-item ${!notification.read
                                                ? "unread"
                                                : ""
                                            }`}
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification
                                            )
                                        }
                                    >

                                        <div className="notification-content">

                                            <strong>
                                                {
                                                    notification.title
                                                }
                                            </strong>

                                            <p>
                                                {
                                                    notification.message
                                                }
                                            </p>

                                            <span>
                                                {
                                                    formatTime(
                                                        notification.createdAt
                                                    )
                                                }
                                            </span>

                                        </div>


                                        {!notification.read && (

                                            <span className="unread-dot">
                                            </span>

                                        )}

                                    </div>

                                )
                            )

                        )}

                    </div>

                </div>

            )}

        </div>

    );

}

export default NotificationBell;