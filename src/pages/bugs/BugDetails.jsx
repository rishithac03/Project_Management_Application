import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../styles/bugdetails.css";

function BugDetails() {

    const { bugId } = useParams();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const isAdmin = user?.role === "admin";
    const [bug, setBug] = useState(null);
    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading] = useState(true);
    const [commentLoading, setCommentLoading] = useState(false);
    const [error, setError] = useState("");

    // ========================================
    // LOAD BUG
    // ========================================

    const loadBugDetails = async () => {

        try {
            setLoading(true);
            const bugResponse = await axios.get(`http://localhost:3000/bugs/${bugId}`);
            const currentBug = bugResponse.data;
            setBug(currentBug);
            // ========================================
            // LOAD TASK
            // ========================================
            if (currentBug.taskId) {
                const taskResponse = await axios.get(`http://localhost:3000/tasks/${currentBug.taskId}`);
                setTask(taskResponse.data);
                // ========================================
                // LOAD PROJECT
                // ========================================
                if (taskResponse.data.projectId) {
                    const projectResponse = await axios.get(`http://localhost:3000/projects/${taskResponse.data.projectId}`);
                    setProject(projectResponse.data);
                }
            }
            // ========================================
            // LOAD COMMENTS
            // ========================================
            const commentsResponse = await axios.get(`http://localhost:3000/bugComments?bugId=${bugId}&_sort=id&_order=asc`);
            setComments(commentsResponse.data);
        } catch (error) {
            console.error(error);
            setError("Unable to load bug details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBugDetails();
    }, [bugId]);

    // ========================================
    // ADD COMMENT
    // ========================================

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) {
            return;
        }
        if (!bug) {
            return;
        }
        try {
            setCommentLoading(true);
            const newComment = {
                bugId: Number(bugId),
                userId: Number(user.id),
                userName: user.name,
                text: commentText.trim(),
                createdAt: new Date().toISOString()
            };
            const response = await axios.post("http://localhost:3000/bugComments", newComment);
            setComments((currentComments) => [...currentComments, response.data]);
            setCommentText("");
            // ========================================
            // COMMENT NOTIFICATION
            // ========================================

            const usersResponse = await axios.get("http://localhost:3000/users");
            if (isAdmin) {
                const developer = usersResponse.data.find((item) => Number(item.id) === Number(bug.assignedTo));
                if (developer) {
                    await axios.post("http://localhost:3000/notifications",
                        {
                            userId: Number(developer.id),
                            type: "bug-comment",
                            title: "New Bug Comment",
                            message: `${user.name} commented on bug "${bug.title}".`,
                            bugId: bug.id,
                            read: false,
                            createdAt: new Date().toISOString()
                        }
                    );
                }
            } else {
                const admin = usersResponse.data.find((item) => item.role === "admin");
                if (admin) {
                    await axios.post("http://localhost:3000/notifications",
                        {
                            userId: Number(admin.id),
                            type: "bug-comment",
                            title: "New Bug Comment",
                            message: `${user.name} commented on bug "${bug.title}".`,
                            bugId: bug.id,
                            read: false,
                            createdAt: new Date().toISOString()
                        }
                    );
                }
            }

        } catch (error) {
            console.error(error);
            setError("Unable to add comment.");
        } finally {
            setCommentLoading(false);
        }
    };
    // ========================================
    // LOADING
    // ========================================
    if (loading) {
        return (
            <div className="bug-details-loading">
                Loading Bug...
            </div>
        );
    }
    // ========================================
    // ERROR
    // ========================================
    if (error || !bug) {
        return (
            <div className="bug-details-layout">
                <Sidebar />
                <div className="bug-details-main">
                    <Navbar />
                    <main className="bug-details-content">
                        <div className="bug-access-error">
                            <h2> Bug Not Found </h2>
                            <p> {error || "Unable to find this bug."} </p>
                            <button onClick={() => navigate("/bugs")}> Back to Bugs </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="bug-details-layout">
            <Sidebar />
            <div className="bug-details-main">
                <Navbar />
                <main className="bug-details-content">
                    {/* HEADER */}
                    <div className="bug-details-header">
                        <div>

                            <button
                                className="back-button"
                                onClick={() =>
                                    navigate("/bugs")
                                }
                            >
                                ← Bugs
                            </button>

                            <p className="bug-project-name">
                                {project?.name}
                            </p>

                            <h2>
                                {bug.title}
                            </h2>

                        </div>

                        {isAdmin && (

                            <button
                                className="edit-bug-button"
                                onClick={() =>
                                    navigate(
                                        `/bugs/${bug.id}/edit`
                                    )
                                }
                            >
                                Edit Bug
                            </button>

                        )}

                    </div>


                    <div className="bug-details-grid">

                        {/* BUG INFORMATION */}

                        <section className="bug-information">

                            <div className="bug-description">

                                <h3>
                                    Description
                                </h3>

                                <p>
                                    {bug.description ||
                                        "No description provided."}
                                </p>

                            </div>


                            <div className="bug-meta-grid">

                                <div className="bug-meta-item">

                                    <span>
                                        Status
                                    </span>

                                    <strong>
                                        {formatBugStatus(
                                            bug.status
                                        )}
                                    </strong>

                                </div>


                                <div className="bug-meta-item">

                                    <span>
                                        Priority
                                    </span>

                                    <strong>
                                        {formatText(
                                            bug.priority
                                        )}
                                    </strong>

                                </div>


                                <div className="bug-meta-item">

                                    <span>
                                        Related Task
                                    </span>

                                    <strong>
                                        {task?.title ||
                                            "Unknown Task"}
                                    </strong>

                                </div>


                                <div className="bug-meta-item">

                                    <span>
                                        Assigned Developer
                                    </span>

                                    <strong>
                                        {bug.assignedDeveloperName ||
                                            "Assigned Developer"}
                                    </strong>

                                </div>

                            </div>

                        </section>


                        {/* COMMENTS */}

                        <section className="bug-comments-section">

                            <div className="bug-comments-header">

                                <h3>
                                    Comments
                                </h3>

                                <span>
                                    {comments.length}
                                </span>

                            </div>


                            <div className="bug-comments-list">

                                {comments.length === 0 ? (

                                    <div className="bug-no-comments">
                                        No comments yet.
                                    </div>

                                ) : (

                                    comments.map(
                                        (comment) => (

                                            <div
                                                className="bug-comment"
                                                key={comment.id}
                                            >

                                                <div className="bug-comment-header">

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
                                className="bug-comment-form"
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
// HELPERS
// ========================================

function formatBugStatus(status) {

    if (status === "in-progress") {
        return "In Progress";
    }

    if (status === "completed") {
        return "Completed";
    }

    return "Todo";
}


function formatText(text) {

    if (!text) {
        return "";
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleDateString();
}


export default BugDetails;