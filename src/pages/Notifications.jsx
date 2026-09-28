import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/notifications.css";

function Notifications() {

    const user = useSelector(
        (state) => state.auth.user
    );

    const navigate = useNavigate();

    const [notifications, setNotifications] =
        useState([]);

    const [loading, setLoading] =
        useState(true);


    const loadNotifications = async () => {

        try {

            const response = await axios.get(
                `http://localhost:3000/notifications?userId=${user.id}&_sort=createdAt&_order=desc`
            );

            setNotifications(response.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        if (!user?.id) return;

        loadNotifications();

    }, [user]);
const markAsRead = async (notification) => {

    try {

        await axios.patch(
            `http://localhost:3000/notifications/${notification.id}`,
            {
                read: true
            }
        );

        setNotifications((previous) =>
            previous.map((item) =>
                item.id === notification.id
                    ? {
                        ...item,
                        read: true
                    }
                    : item
            )
        );

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

    } catch (error) {

        console.error(
            "Error handling notification:",
            error
        );

    }

};

    const markAllAsRead = async () => {

        try {

            const unread =
                notifications.filter(
                    (notification) =>
                        !notification.read
                );


            await Promise.all(
                unread.map(
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
                (previous) =>
                    previous.map(
                        (notification) => ({
                            ...notification,
                            read: true
                        })
                    )
            );

        } catch (error) {

            console.error(error);

        }

    };


    if (loading) {

        return (
            <div className="notifications-loading">
                Loading...
            </div>
        );

    }


    return (

        <div className="notifications-layout">

            <Sidebar />

            <div className="notifications-main">

                <Navbar />

                <main className="notifications-content">

                    <div className="notifications-header">

                        <div>

                            <h2>
                                Notifications
                            </h2>

                            <p>
                                Stay updated with your tasks
                                and project activity.
                            </p>

                        </div>


                        {notifications.some(
                            (notification) =>
                                !notification.read
                        ) && (

                            <button
                                onClick={
                                    markAllAsRead
                                }
                            >
                                Mark all as read
                            </button>

                        )}

                    </div>


                    <div className="notifications-list">

                        {notifications.length === 0 ? (

                            <div className="notifications-empty">

                                <h3>
                                    No notifications
                                </h3>

                                <p>
                                    You're all caught up.
                                </p>

                            </div>

                        ) : (

                            notifications.map(
                                (notification) => (

                                    <div
                                        key={
                                            notification.id
                                        }
                                        className={`notification-page-item ${
                                            !notification.read
                                                ? "notification-unread"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            markAsRead(
                                                notification
                                            )
                                        }
                                    >

                                        <div>

                                            <h3>
                                                {
                                                    notification.title
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    notification.message
                                                }
                                            </p>

                                            <span>
                                                {
                                                    new Date(
                                                        notification.createdAt
                                                    ).toLocaleString()
                                                }
                                            </span>

                                        </div>


                                        {!notification.read && (

                                            <span className="notification-page-dot">
                                            </span>

                                        )}

                                    </div>

                                )
                            )

                        )}

                    </div>

                </main>

            </div>

        </div>

    );

}

export default Notifications;