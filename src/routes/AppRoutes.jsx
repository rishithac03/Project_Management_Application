import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Workspace from "../pages/workspace/Workspace";
import Project from "../pages/project/Project";
import Board from "../pages/board/Board";
import TaskDetails from "../pages/board/Board";
import TaskForm from "../pages/task/TaskForm";
import TaskTaskDetails from "../pages/task/TaskTaskDetails";
import MyTasks from "../pages/MyTasks";
import Calendar from "../pages/Calendar";
import NotificationBell from "../components/notifications/NotificationBell";
import Notifications from "../pages/Notifications";
import Bugs from "../pages/bugs/Bugs";
import BugForm from "../pages/bugs/BugForm";
import BugDetails from "../pages/bugs/BugDetails";
import NotFound from "../pages/NotFound";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
                <Route path="/workspaces" element={<ProtectedRoute> <Workspace /> </ProtectedRoute>} />
                <Route path="/workspaces/:workspaceId/projects" element={<ProtectedRoute> <Project /> </ProtectedRoute>} />
                <Route path="/projects/:projectId/boards" element={<ProtectedRoute> <Board /> </ProtectedRoute>} />
                <Route path="/boards/:boardId/tasks/:taskId" element={<ProtectedRoute> <TaskDetails /> </ProtectedRoute>} />
                <Route path="/projects/:projectId/tasks/new" element={<ProtectedRoute> <TaskForm /> </ProtectedRoute>} />
                <Route path="/projects/:projectId/tasks/:taskId/edit" element={<ProtectedRoute> <TaskForm /> </ProtectedRoute>} />
                <Route path="/tasks/:taskId" element={<ProtectedRoute> <TaskTaskDetails /> </ProtectedRoute>} />
                <Route path="/my-tasks" element={<ProtectedRoute> <MyTasks /> </ProtectedRoute>} />
                <Route path="/notification" element={<ProtectedRoute> <NotificationBell /> </ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute> <Calendar /> </ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute> <Notifications /> </ProtectedRoute>} />
                <Route path="/bugs" element={<ProtectedRoute> <Bugs /> </ProtectedRoute>} />
                <Route path="/bugs/new" element={<ProtectedRoute> <BugForm /> </ProtectedRoute>} />
                <Route path="/bugs/:bugId/edit" element={<ProtectedRoute> <BugForm /> </ProtectedRoute>} />
                <Route path="/bugs/:bugId" element={<ProtectedRoute> <BugDetails /> </ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
export default AppRoutes;