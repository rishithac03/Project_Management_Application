import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../styles/board.css";

function Board() {

    const { projectId } = useParams();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const isAdmin = user?.role === "admin";
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [labelFilter, setLabelFilter] = useState("all");

    // --------------------------------
    // LOAD PROJECT + TASKS + USERS
    // --------------------------------

    const loadData = async () => {
        try {
            setLoading(true);
            const [projectResponse, tasksResponse, usersResponse] = await Promise.all([
                axios.get(`http://localhost:3000/projects/${projectId}`),
                axios.get(`http://localhost:3000/tasks?projectId=${projectId}`),
                axios.get("http://localhost:3000/users")
            ]);
            setProject(projectResponse.data);
            setTasks(tasksResponse.data);
            setDevelopers(usersResponse.data.filter((currentUser) => currentUser.role === "developer"));
        } catch (error) {
            console.error(error);
            setError("Unable to load board.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadData(); }, [projectId]);


    // --------------------------------
    // TASK STATUS UPDATE
    // --------------------------------

    const updateTaskStatus = async (taskId, newStatus) => {
        // Developer can only update
        // their own assigned tasks
        try {
            // Get current task
            const taskResponse = await axios.get(`http://localhost:3000/tasks/${taskId}`);
            const oldTask = taskResponse.data;
            if (oldTask.status === newStatus) { return; }

            if (user?.role !== "developer") {
                return;
            }

            if (Number(oldTask.assignedTo) !== Number(user?.id)){
                return;
            }

            const response = await axios.patch(`http://localhost:3000/tasks/${taskId}`, { status: newStatus });
            const updatedTask = response.data;
            if (user?.role === "developer") {
                const usersResponse = await axios.get("http://localhost:3000/users");
                const admin = usersResponse.data.find((item) => item.role === "admin");
                if (admin) {
                    await axios.post("http://localhost:3000/notifications",
                        {
                            userId: Number(admin.id),
                            type: "task-status-changed",
                            title: "Task Status Updated",
                            message: `${user.name} changed "${updatedTask.title}" from ${formatStatus(oldTask.status)} to ${formatStatus(newStatus)}.`,
                            taskId: Number(updatedTask.id),
                            read: false,
                            createdAt: new Date().toISOString()
                        }
                    );

                }

            }
            loadData();
        }
        catch (error) {
            console.error("Error updating task status:", error);
            setError("Unable to update task status.");
        }
    };


    // --------------------------------
    // DELETE TASK
    // --------------------------------

    const deleteTask = async (taskId) => {
        if (!isAdmin) {
            return;
        }
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this task?"
        );
        if (!confirmDelete) {
            return;
        }
        try {
            await axios.delete(`http://localhost:3000/tasks/${taskId}`);
            setTasks(tasks.filter((task) => task.id !== taskId));
        }
        catch (error) {
            console.error(error);
            setError("Unable to delete task.");
        }
    };
    // --------------------------------
    // GET DEVELOPER NAME
    // --------------------------------
    const getDeveloperName = (userId) => {
        const developer = developers.find((developer) => developer.id === userId);
        return developer ? developer.name : "Unassigned";
    };
    // --------------------------------
    // FILTER TASKS
    // --------------------------------
    const filteredTasks = tasks.filter((task) => {
        const statusMatch = statusFilter === "all" || task.status === statusFilter;
        const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
        const labelMatch = labelFilter === "all" || task.label === labelFilter;
        return (
            statusMatch &&
            priorityMatch &&
            labelMatch
        );
    });
    const todoTasks = filteredTasks.filter((task) => task.status === "todo");
    const inProgressTasks = filteredTasks.filter((task) => task.status === "in-progress");
    const completedTasks = filteredTasks.filter((task) => task.status === "completed");
    // --------------------------------
    // LOADING
    // --------------------------------

    if (loading) {
        return (
            <div className="board-loading">
                Loading Board...
            </div>
        );
    }

    return (
        <div className="board-layout">
            <Sidebar />
            <div className="board-main">
                <Navbar />
                <main className="board-content">
                    {/* HEADER */}
                    <div className="board-header">
                        <div>
                            <button
                                className="back-button"
                                onClick={() => navigate(`/workspaces/${project?.workspaceId}/projects`)}> ← Projects
                            </button>
                            <h2>
                                {project?.name}
                            </h2>
                            <p>
                                {project?.description}
                            </p>
                        </div>


                        {isAdmin && (
                            <button
                                className="add-task-btn"
                                onClick={() =>
                                    navigate(
                                        `/projects/${projectId}/tasks/new`
                                    )
                                }
                            >
                                + Add Task
                            </button>

                        )}

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="board-error">
                            {error}
                        </div>

                    )}
                    <div className="board-filters">

                        <div className="filter-group">

                            <label>
                                Status
                            </label>

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="all">
                                    All
                                </option>

                                <option value="todo">
                                    Todo
                                </option>

                                <option value="in-progress">
                                    In Progress
                                </option>

                                <option value="completed">
                                    Completed
                                </option>

                            </select>

                        </div>


                        <div className="filter-group">

                            <label>
                                Priority
                            </label>

                            <select
                                value={priorityFilter}
                                onChange={(e) =>
                                    setPriorityFilter(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="all">
                                    All
                                </option>

                                <option value="high">
                                    High
                                </option>

                                <option value="medium">
                                    Medium
                                </option>

                                <option value="low">
                                    Low
                                </option>

                            </select>

                        </div>


                        <div className="filter-group">

                            <label>
                                Label
                            </label>

                            <select
                                value={labelFilter}
                                onChange={(e) =>
                                    setLabelFilter(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="all">
                                    All
                                </option>

                                <option value="Frontend">
                                    Frontend
                                </option>

                                <option value="Backend">
                                    Backend
                                </option>

                                <option value="Design">
                                    Design
                                </option>
                            </select>

                        </div>


                        <button
                            className="clear-filter-btn"
                            onClick={() => {

                                setStatusFilter("all");

                                setPriorityFilter("all");

                                setLabelFilter("all");

                            }}
                        >
                            Clear
                        </button>

                    </div>

                    {/* KANBAN BOARD */}

                    <div className="kanban-board">


                        {/* TODO */}

                        <KanbanColumn
                            title="Todo"
                            tasks={todoTasks}
                            getDeveloperName={
                                getDeveloperName
                            }
                            isAdmin={isAdmin}
                            user={user}
                            updateTaskStatus={
                                updateTaskStatus
                            }
                            deleteTask={
                                deleteTask
                            }
                            navigate={navigate}
                        />


                        {/* IN PROGRESS */}

                        <KanbanColumn
                            title="In Progress"
                            tasks={inProgressTasks}
                            getDeveloperName={
                                getDeveloperName
                            }
                            isAdmin={isAdmin}
                            user={user}
                            updateTaskStatus={
                                updateTaskStatus
                            }
                            deleteTask={
                                deleteTask
                            }
                            navigate={navigate}
                        />


                        {/* COMPLETED */}

                        <KanbanColumn
                            title="Completed"
                            tasks={completedTasks}
                            getDeveloperName={
                                getDeveloperName
                            }
                            isAdmin={isAdmin}
                            user={user}
                            updateTaskStatus={
                                updateTaskStatus
                            }
                            deleteTask={
                                deleteTask
                            }
                            navigate={navigate}
                        />

                    </div>

                </main>

            </div>

        </div>

    );
}


// ========================================
// KANBAN COLUMN
// ========================================

function KanbanColumn({
    title,
    tasks,
    getDeveloperName,
    isAdmin,
    user,
    updateTaskStatus,
    deleteTask,
    navigate
}) {

    return (

        <div className="kanban-column">

            <div className="kanban-column-header">

                <h3>
                    {title}
                </h3>

                <span>
                    {tasks.length}
                </span>

            </div>


            <div className="kanban-tasks">

                {tasks.length === 0 ? (

                    <div className="empty-column">
                        No tasks
                    </div>

                ) : (

                    tasks.map((task) => (

                        <TaskCard
                            key={task.id}
                            task={task}
                            getDeveloperName={
                                getDeveloperName
                            }
                            isAdmin={isAdmin}
                            user={user}
                            updateTaskStatus={
                                updateTaskStatus
                            }
                            deleteTask={
                                deleteTask
                            }
                            navigate={navigate}
                        />

                    ))

                )}

            </div>

        </div>

    );
}


// ========================================
// TASK CARD
// ========================================

function TaskCard({
    task,
    getDeveloperName,
    isAdmin,
    user,
    updateTaskStatus,
    deleteTask,
    navigate
}) {

    const canUpdate = user.role === "developer" &&
        Number(task.assignedTo) === Number(user?.id);


    const moveToNextStatus = () => {

        if (!canUpdate) {
            return;
        }


        if (task.status === "todo") {

            updateTaskStatus(
                task.id,
                "in-progress"
            );

        } else if (
            task.status === "in-progress"
        ) {

            updateTaskStatus(
                task.id,
                "completed"
            );

        }

    };


    return (

        <div className="task-card">

            <div
                className="task-card-content"
                onClick={() =>
                    navigate(
                        `/tasks/${task.id}`
                    )
                }
            >

                <div className="task-card-top">

                    <span className="task-label">
                        {task.label}
                    </span>

                    <span className="task-priority">
                        {task.priority}
                    </span>

                </div>


                <h4>
                    {task.title}
                </h4>


                <p>
                    {task.description}
                </p>


                <div className="task-card-footer">

                    <span>
                        {getDeveloperName(
                            task.assignedTo
                        )}
                    </span>

                    <span>
                        {task.deadline}
                    </span>

                </div>

            </div>


            {/* ACTIONS */}

            <div className="task-card-actions">


                {canUpdate &&
                    task.status !== "completed" && (

                        <button
                            onClick={moveToNextStatus}
                        >
                            {task.status === "todo"
                                ? "Start"
                                : "Complete"
                            }
                        </button>

                    )}


                {isAdmin && (

                    <>

                        <button
                            onClick={() =>
                                navigate(
                                    `/projects/${task.projectId}/tasks/${task.id}/edit`
                                )
                            }
                        >
                            Edit
                        </button>

                        <button
                            onClick={() =>
                                deleteTask(task.id)
                            }
                        >
                            Delete
                        </button>

                    </>

                )}

            </div>

        </div>

    );
}

// ========================================
// FORMAT STATUS
// ========================================

function formatStatus(status) {

    if (status === "in-progress") {
        return "In Progress";
    }

    if (status === "completed") {
        return "Completed";
    }

    return "Todo";
}

export default Board;