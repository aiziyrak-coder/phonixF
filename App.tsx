import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import SubmitArticle from './pages/SubmitArticle';
import UserManagement from './pages/UserManagement';
import UdkRequests from './pages/UdkRequests';
import PlagiarismCheck from './pages/PlagiarismCheck';
import Services from './pages/Services';
import Profile from './pages/Profile';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import JournalManagement from './pages/JournalManagement';
import PublishedArticles from './pages/PublishedArticles';
import Financials from './pages/Financials';
import SubmitBook from './pages/SubmitBook';
import MyCollections from './pages/MyCollections';
import TranslationService from './pages/TranslationService';
import MyTranslations from './pages/MyTranslations';
import TranslationDetail from './pages/TranslationDetail';
import PaymentTest from './pages/PaymentTest';
import JournalAdminPanel from './pages/JournalAdminPanel';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div>Yuklanmoqda...</div>; // Show loading state
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
};

const AppContent: React.FC = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="articles" element={<Articles />} />
                <Route path="articles/:id" element={<ArticleDetail />} />
                <Route path="translations/:id" element={<TranslationDetail />} />
                <Route path="published-articles" element={<PublishedArticles />} />
                <Route path="my-collections" element={<MyCollections />} />
                <Route path="my-translations" element={<MyTranslations />} />
                <Route path="submit" element={<SubmitArticle />} />
                <Route path="submit-book" element={<SubmitBook />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="journal-management" element={<JournalManagement />} />
                <Route path="journal-admin-panel" element={<JournalAdminPanel />} />
                <Route path="udk-requests" element={<UdkRequests />} />
                <Route path="services" element={<Services />} />
                <Route path="translation-service" element={<TranslationService />} />
                <Route path="plagiarism-check" element={<PlagiarismCheck />} />
                <Route path="profile" element={<Profile />} />
                <Route path="financials" element={<Financials />} />
                <Route path="payment-test" element={<PaymentTest />} />
            </Route>

            <Route path="*" element={
                <Navigate to={user ? "/dashboard" : "/login"} replace />
            } />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <HashRouter>
            <AuthProvider>
                <AppContent />
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
            </AuthProvider>
        </HashRouter>
    );
};

export default App;