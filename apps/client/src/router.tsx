import { Route, Routes } from 'react-router-dom'

import Home from './pages/home/Home'
import Auth from './pages/auth/Auth'
import GlobalError from './pages/error/GlobalError'
import NotFound from './pages/error/NotFound'
import DashboardLayout from './pages/dash/DashboardLayout'
import Dashboard from './pages/dash/dashboard'
import CallsPage from './pages/dash/calls'
import ActivityPage from './pages/dash/activity'
import ChatPage from './pages/dash/chat'
import TasksPage from './pages/dash/tasks'
import SummariesPage from './pages/dash/summaries'
import CallPage from './pages/call/CallPage'
import { GroupChatPage } from './pages/dash/GroupChat'
import { ProtectedRoute } from './components/auth'

const Router: React.FC = () => {
  return (
    <GlobalError>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/call/:meetingId"
          element={
            <ProtectedRoute>
              <CallPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dash"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="groups" element={<GroupChatPage />} />
          <Route path="calls" element={<CallsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="summaries" element={<SummariesPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </GlobalError>
  )
}

export default Router
