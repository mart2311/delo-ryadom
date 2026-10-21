import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ToastProvider } from './hooks/useToast.jsx'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import JobsPage from './pages/JobsPage'
import MyJobsPage from './pages/MyJobsPage'
import MyApplicationsPage from './pages/MyApplicationsPage'
import CreateJobPage from './pages/CreateJobPage'
import JobDetailPage from './pages/JobDetailPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import ChatsPage from './pages/ChatsPage'
import AboutPage from './pages/AboutPage'
import ContactsPage from './pages/ContactsPage'
import PrivacyPage from './pages/PrivacyPage'
import Layout from './components/Layout/Layout'

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token)
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <ToastProvider>
     <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<HomePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="my-jobs" element={<MyJobsPage />} />
          <Route path="my-applications" element={<MyApplicationsPage />} />
          <Route path="jobs/create" element={<CreateJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="users/:userId" element={<UserProfilePage />} />
          <Route path="chats" element={<ChatsPage />} />
        </Route>
      </Routes>
     </Router>
    </ToastProvider>
  )
}

export default App
