import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../styles/taskdetails.css";

function TaskTaskDetails() {

    const { taskId } = useParams();

    const navigate = useNavigate();

    const user = useSelector(
        (state) => state.auth.user
    );

    const isAdmin = user?.role === "admin";


    const [task, setTask] = useState(null);

    const [developer, setDeveloper] = useState(null);

    const [project, setProject] = useState(null);

    const [comments, setComments] = useState([]);

    const [commentText, setCommentText] = useState("");

    const [loading, setLoading] = useState(true);

    const [commentLoading, setCommentLoading] =
        useState(false);

    const [error, setError] = useState("");


    // ========================================
    // LOAD TASK DETAILS
    // ========================================

    const loadTaskDetails = async () => {

        try {

            setLoading(true);

            const taskResponse = await axios.get(
                `http://localhost:3000/tasks/${taskId}`
            );

            const currentTask = taskResponse.data;

            setTask(currentTask);


            // Load project

            const projectResponse = await axios.get(
                `http://localhost:3000/projects/${currentTask.projectId}`
            );

            setProject(
                projectResponse.data
            );


            // Load assigned developer

            const developerResponse = await axios.get(
                `http://localhost:3000/users/${currentTask.assignedTo}`
            );

            setDeveloper(
                developerResponse.data
            );


            // Load comments

            const commentsResponse = await axios.get(
                `http://localhost:3000/comments?taskId=${taskId}&_sort=id&_order=asc`
            );

            setComments(
                commentsResponse.data
            );


            // Developer can only see
            // their assigned tasks

            if (
                !isAdmin &&
                currentTask.assignedTo !== user?.id
            ) {

                setError(
                    "You are not allowed to view this task."
                );

            }

        } catch (error) {

            console.error(error);

            setError(
                "Unable to load task details."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadTaskDetails();

    }, [taskId]);


    // ========================================
    // ADD COMMENT
    // ========================================
    const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
        return;
    }

    if (!task) {
        return;
    }

    // Developer can only comment on their assigned task
    if (
        !isAdmin &&
        Number(task.assignedTo) !== Number(user?.id)
    ) {
        return;
    }

    try {
        setCommentLoading(true);

        // --------------------------------
        // CREATE COMMENT
        // --------------------------------

        const newComment = {
            taskId: Number(taskId),
            userId: Number(user.id),
            userName: user.name,
            text: commentText.trim(),
            createdAt: new Date().toISOString()
        };

        const response = await axios.post(
            "http://localhost:3000/comments",
            newComment
        );

        setComments((previousComments) => [
            ...previousComments,
            response.data
        ]);

        setCommentText("");


        // --------------------------------
        // FIND NOTIFICATION RECIPIENT
        // --------------------------------

        const usersResponse = await axios.get(
            "http://localhost:3000/users"
        );

        let recipient = null;


        // --------------------------------
        // ADMIN COMMENT
        // → NOTIFY ASSIGNED DEVELOPER
        // --------------------------------

        if (isAdmin) {

            recipient = usersResponse.data.find(
                (currentUser) =>
                    currentUser.role === "developer" &&
                    Number(currentUser.id) ===
                        Number(task.assignedTo)
            );

        }


        // --------------------------------
        // DEVELOPER COMMENT
        // → NOTIFY ADMIN
        // --------------------------------

        else {

            recipient = usersResponse.data.find(
                (currentUser) =>
                    currentUser.role === "admin"
            );

        }


        // --------------------------------
        // CREATE NOTIFICATION
        // --------------------------------

        if (recipient) {

            await axios.post(
                "http://localhost:3000/notifications",
                {
                    userId: Number(recipient.id),

                    type: "comment-added",

                    title: "New Comment",

                    message:
                        `${user.name} commented on "${task.title}".`,

                    taskId: Number(task.id),

                    read: false,

                    createdAt:
                        new Date().toISOString()
                }
            );
        }

    } catch (error) {

        console.error(
            "Error adding comment:",
            error
        );

        setError(
            "Unable to add comment."
        );

    } finally {

        setCommentLoading(false);

    }
};


    // ========================================
    // BACK TO BOARD
    // ========================================

    const goBackToBoard = () => {

        if (!task) {
            return;
        }

        navigate(
            `/projects/${task.projectId}/boards`
        );

    };


    // ========================================
    // LOADING
    // ========================================

    if (loading) {

        return (
            <div className="task-details-loading">
                Loading Task...
            </div>
        );

    }


    // ========================================
    // ERROR
    // ========================================

    if (error || !task) {

        return (

            <div className="task-details-layout">

                <Sidebar />

                <div className="task-details-main">

                    <Navbar />

                    <main className="task-details-content">

                        <div className="task-access-error">

                            <h2>
                                Access Denied
                            </h2>

                            <p>
                                {error ||
                                    "Task not found."}
                            </p>

                            <button
                                onClick={() =>
                                    navigate(
                                        "/workspaces"
                                    )
                                }
                            >
                                Back to Workspaces
                            </button>

                        </div>

                    </main>

                </div>

            </div>

        );

    }


    return (

        <div className="task-details-layout">

            <Sidebar />

            <div className="task-details-main">

                <Navbar />

                <main className="task-details-content">


                    {/* HEADER */}

                    <div className="task-details-header">

                        <div>

                            <button
                                className="back-button"
                                onClick={
                                    goBackToBoard
                                }
                            >
                                ← Board
                            </button>

                            <p className="project-name">
                                {project?.name}
                            </p>

                            <h2>
                                {task.title}
                            </h2>

                        </div>


                        {isAdmin && (

                            <button
                                className="edit-task-button"
                                onClick={() =>
                                    navigate(
                                        `/projects/${task.projectId}/tasks/${task.id}/edit`
                                    )
                                }
                            >
                                Edit Task
                            </button>

                        )}

                    </div>


                    <div className="task-details-grid">


                        {/* ================================= */}
                        {/* TASK INFORMATION */}
                        {/* ================================= */}

                        <section className="task-information">

                            <div className="task-description">

                                <h3>
                                    Description
                                </h3>

                                <p>
                                    {task.description ||
                                        "No description provided."}
                                </p>

                            </div>


                            <div className="task-meta-grid">
                                <div className="meta-item">
                                    <span> Status </span>
                                    <strong> {formatStatus(task.status)} </strong>
                                </div>
                                <div className="meta-item">

                                    <span>
                                        Priority
                                    </span>

                                    <strong>
                                        {formatText(
                                            task.priority
                                        )}
                                    </strong>

                                </div>


                                <div className="meta-item">

                                    <span>
                                        Label
                                    </span>

                                    <strong>
                                        {task.label}
                                    </strong>

                                </div>


                                <div className="meta-item">

                                    <span>
                                        Deadline
                                    </span>

                                    <strong>
                                        {task.deadline}
                                    </strong>

                                </div>


                                <div className="meta-item">

                                    <span>
                                        Assigned Developer
                                    </span>

                                    <strong>
                                        {developer?.name ||
                                            "Unassigned"}
                                    </strong>

                                </div>

                            </div>

                        </section>


                        {/* ================================= */}
                        {/* COMMENTS */}
                        {/* ================================= */}

                        <section className="comments-section">

                            <div className="comments-header">

                                <h3>
                                    Comments
                                </h3>

                                <span>
                                    {comments.length}
                                </span>

                            </div>


                            {/* COMMENTS LIST */}

                            <div className="comments-list">

                                {comments.length === 0 ? (

                                    <div className="no-comments">

                                        No comments yet.

                                    </div>

                                ) : (

                                    comments.map(
                                        (comment) => (

                                            <div
                                                className="comment"
                                                key={
                                                    comment.id
                                                }
                                            >

                                                <div className="comment-header">

                                                    <strong>
                                                        {
                                                            comment.userName
                                                        }
                                                    </strong>

                                                    <span>
                                                        {formatDate(
                                                            comment.createdAt
                                                        )}
                                                    </span>

                                                </div>

                                                <p>
                                                    {
                                                        comment.text
                                                    }
                                                </p>

                                            </div>

                                        )
                                    )

                                )}

                            </div>


                            {/* ADD COMMENT */}

                            <form
                                className="comment-form"
                                onSubmit={
                                    handleAddComment
                                }
                            >

                                <textarea
                                    value={commentText}
                                    onChange={(e) =>
                                        setCommentText(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Write a comment..."
                                    rows="4"
                                />

                                <button
                                    type="submit"
                                    disabled={
                                        commentLoading ||
                                        !commentText.trim()
                                    }
                                >
                                    {commentLoading
                                        ? "Adding..."
                                        : "Add Comment"}
                                </button>

                            </form>

                        </section>

                    </div>

                </main>

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


// ========================================
// FORMAT TEXT
// ========================================

function formatText(text) {

    if (!text) {
        return "";
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleDateString();

}


export default TaskTaskDetails;