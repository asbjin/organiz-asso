import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Composants de mise en page
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Composant de protection des routes
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Import direct des composants
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForumList from './components/forums/ForumList';
import ForumDetail from './components/forums/ForumDetail';
import MessageDetail from './components/forums/MessageDetail';
import Profile from './components/profile/Profile';
import EditProfile from './components/profile/EditProfile';
import AdminDashboard from './components/admin/AdminDashboard';
import PendingUsers from './components/admin/PendingUsers';
import ManageForums from './components/admin/ManageForums';

// Composant de chargement
const LoadingComponent = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
    <Spinner animation="border" role="status">
      <span className="visually-hidden">Chargement...</span>
    </Spinner>
  </div>
);

function App() {
  return (
    <>
      <Header />
      <Container className="py-4">
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Routes protégées pour les membres */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ForumList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/forum/:id" 
            element={
              <ProtectedRoute>
                <ForumDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/message/:id" 
            element={
              <ProtectedRoute>
                <MessageDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:id" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/edit" 
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } 
          />
          
          {/* Routes protégées pour les administrateurs */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/pending-users" 
            element={
              <AdminRoute>
                <PendingUsers />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/forums" 
            element={
              <AdminRoute>
                <ManageForums />
              </AdminRoute>
            } 
          />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
      <Footer />
    </>
  );
}

export default App;
