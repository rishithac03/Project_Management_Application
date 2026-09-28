import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../components/Sidebar.jsx";
import Navbar from "../../components/Navbar.jsx";

import "../../styles/workspace.css";

function Workspace() {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });
    const [error, setError] = useState("");
    const isAdmin = user?.role === "admin";
    const getWorkspaces = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:3000/workspaces");
            setWorkspaces(response.data);
        } catch (error) {
            console.error(error);
            setError( "Unable to load workspaces." );
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        getWorkspaces();
    }, []);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({...formData,[name]: value });
    };


    const handleAdd = () => {
        setEditingWorkspace(null);
        setFormData({ name: "", description: ""});
        setError("");
        setShowForm(true);
    };


    const handleEdit = (workspace) => {
        setEditingWorkspace(workspace);
        setFormData({ name: workspace.name, description: workspace.description
        });
        setError("");
        setShowForm(true);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError("Workspace name is required." );
            return;
        }
        try {
            if (editingWorkspace) {
                const response = await axios.patch(`http://localhost:3000/workspaces/${editingWorkspace.id}`,
                    {name: formData.name,description: formData.description}
                );
                setWorkspaces(
                    workspaces.map((workspace) =>
                        workspace.id === editingWorkspace.id
                            ? response.data
                            : workspace
                    )
                );
            } else {
                const response = await axios.post("http://localhost:3000/workspaces",
                    {
                        name: formData.name,
                        description: formData.description,
                        createdBy: user.id
                    }
                );
                setWorkspaces([...workspaces, response.data]);
            }
            setFormData({name: "", description: ""});
            setEditingWorkspace(null);
            setShowForm(false);
            setError("");
        } catch (error) {
            console.error(error);
            setError("Something went wrong. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this workspace?");
        if (!confirmDelete) {
            return;
        }
        try {
            await axios.delete(`http://localhost:3000/workspaces/${id}`);
            setWorkspaces(workspaces.filter((workspace) =>workspace.id !== id));
        }
        catch (error) {
            console.error(error);
            setError("Unable to delete workspace.");
        }
    };
    if (loading) {
        return (
        <div className="workspace-loading">
            Loading Workspaces...
        </div>
        );
    }
    return (
        <div className="workspace-layout">
            <Sidebar />
            <div className="workspace-main">
                <Navbar />
                <main className="workspace-content">
                    <div className="workspace-header">
                        <div>
                            <h2> Workspaces </h2>
                            <p> Manage your project workspaces. </p>
                        </div>
                        {isAdmin && (
                            <button className="add-workspace-btn" onClick={handleAdd} > + Add Workspace </button>
                        )}
                    </div>
                    {error && (
                        <div className="workspace-error"> {error} </div>
                    )}
                    {showForm && isAdmin && (
                        <div className="workspace-form-container">
                            <div className="workspace-form-header">
                                <h3>
                                    {editingWorkspace
                                        ? "Edit Workspace"
                                        : "Create Workspace"
                                    }
                                </h3>
                                <button onClick={() => setShowForm(false)} > × </button>
                            </div>
                            <form onSubmit={handleSubmit} className="workspace-form">
                                <div className="form-group">
                                    <label> Workspace Name </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter workspace name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label> Description </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Enter workspace description"
                                        rows="4"
                                    />
                                </div>
                                <div className="workspace-form-actions">
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() =>
                                            setShowForm(false)
                                        }
                                    > Cancel </button>
                                    <button
                                        type="submit"
                                        className="save-btn"
                                    >
                                        {editingWorkspace
                                            ? "Update Workspace"
                                            : "Create Workspace"
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {workspaces.length === 0 ? (
                        <div className="workspace-empty">
                            <h3> No Workspaces </h3>
                            <p> Create your first workspace to get started. </p>
                        </div>
                    ) : (
                        <div className="workspace-grid">
                            {workspaces.map(
                                (workspace) => (
                                    <div className="workspace-card" key={workspace.id} >
                                        <div
                                            className="workspace-card-content"
                                            onClick={() =>
                                                navigate(
                                                    `/workspaces/${workspace.id}/projects`
                                                )
                                            }
                                        >
                                            <h3> {workspace.name} </h3>
                                            <p> {workspace.description} </p>
                                        </div>
                                        {isAdmin && (
                                            <div className="workspace-actions">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(workspace)
                                                    }
                                                > Edit </button>
                                                <button onClick={() => handleDelete(workspace.id)} >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Workspace;