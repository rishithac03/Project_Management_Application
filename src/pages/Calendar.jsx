import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/calendar.css";

function Calendar() {

    const user = useSelector(
        (state) => state.auth.user
    );

    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);

    const [currentDate, setCurrentDate] =
        useState(new Date());

    const [loading, setLoading] =
        useState(true);


    // ========================================
    // LOAD TASKS
    // ========================================

    useEffect(() => {

        const loadTasks = async () => {

            try {

                const response = await axios.get(
                    "http://localhost:3000/tasks"
                );

                let taskData = response.data;


                // Developer sees only assigned tasks

                if (user?.role === "developer") {

                    taskData = taskData.filter(
                        (task) =>
                            Number(task.assignedTo) ===
                            Number(user.id)
                    );

                }

                setTasks(taskData);

            } catch (error) {

                console.error(
                    "Error loading tasks:",
                    error
                );

            } finally {

                setLoading(false);

            }

        };


        if (user) {
            loadTasks();
        }

    }, [user]);


    // ========================================
    // MONTH / YEAR
    // ========================================

    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();


    // ========================================
    // FIRST DAY OF MONTH
    // ========================================

    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    // ========================================
    // NUMBER OF DAYS
    // ========================================

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    // ========================================
    // PREVIOUS MONTH
    // ========================================

    const previousMonth = () => {

        setCurrentDate(
            new Date(
                year,
                month - 1,
                1
            )
        );

    };


    // ========================================
    // NEXT MONTH
    // ========================================

    const nextMonth = () => {

        setCurrentDate(
            new Date(
                year,
                month + 1,
                1
            )
        );

    };


    // ========================================
    // TODAY
    // ========================================

    const goToToday = () => {

        setCurrentDate(
            new Date()
        );

    };


    // ========================================
    // MONTH NAME
    // ========================================

    const monthName =
        currentDate.toLocaleString(
            "default",
            {
                month: "long"
            }
        );


    // ========================================
    // GET TASKS FOR DATE
    // ========================================

    const getTasksForDate = (day) => {

        const date =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        return tasks.filter(
            (task) =>
                task.deadline === date
        );

    };


    // ========================================
    // CHECK TODAY
    // ========================================

    const isToday = (day) => {

        const today = new Date();

        return (
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
        );

    };


    // ========================================
    // CALENDAR DAYS
    // ========================================

    const calendarDays = [];


    // Empty cells before first day

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        calendarDays.push(
            <div
                className="calendar-day empty-day"
                key={`empty-${i}`}
            />
        );

    }


    // Actual days

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dayTasks =
            getTasksForDate(day);


        calendarDays.push(

            <div
                className={`calendar-day ${
                    isToday(day)
                        ? "today"
                        : ""
                }`}
                key={day}
            >

                <div className="calendar-date">

                    {day}

                </div>


                <div className="calendar-tasks">

                    {dayTasks.map(
                        (task) => (

                            <div
                                className="calendar-task"
                                key={task.id}
                                onClick={() =>
                                    navigate(
                                        `/tasks/${task.id}`
                                    )
                                }
                            >

                                {task.title}

                            </div>

                        )
                    )}

                </div>

            </div>

        );

    }


    if (loading) {

        return (
            <div className="calendar-loading">
                Loading Calendar...
            </div>
        );

    }


    return (

        <div className="calendar-layout">

            <Sidebar />

            <div className="calendar-main">

                <Navbar />

                <main className="calendar-content">


                    {/* HEADER */}

                    <div className="calendar-header">

                        <div>

                            <h2>
                                Calendar
                            </h2>

                            <p>
                                View task deadlines
                            </p>

                        </div>


                        <button
                            className="today-button"
                            onClick={goToToday}
                        >
                            Today
                        </button>

                    </div>


                    {/* CALENDAR */}

                    <section className="calendar-container">


                        {/* CALENDAR TOP */}

                        <div className="calendar-top">

                            <button
                                className="month-button"
                                onClick={
                                    previousMonth
                                }
                            >
                                ←
                            </button>


                            <h3>
                                {monthName} {year}
                            </h3>


                            <button
                                className="month-button"
                                onClick={
                                    nextMonth
                                }
                            >
                                →
                            </button>

                        </div>


                        {/* WEEK DAYS */}

                        <div className="calendar-weekdays">

                            <div>Sun</div>
                            <div>Mon</div>
                            <div>Tue</div>
                            <div>Wed</div>
                            <div>Thu</div>
                            <div>Fri</div>
                            <div>Sat</div>

                        </div>


                        {/* DAYS */}

                        <div className="calendar-grid">

                            {calendarDays}

                        </div>

                    </section>


                    {/* LEGEND */}

                    <div className="calendar-info">

                        <div className="calendar-info-item">

                            <span className="today-dot">
                            </span>

                            Today

                        </div>


                        <div className="calendar-info-item">

                            <span className="task-dot">
                            </span>

                            Task Deadline

                        </div>

                    </div>

                </main>

            </div>

        </div>

    );

}

export default Calendar;