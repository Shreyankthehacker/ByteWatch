import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateVideos from './pages/PrivateVideos';
import UploadVideo from './pages/UploadVideo';
import VideoWatch from './pages/VideoWatch';
import Profile from './pages/Profile';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/private" element={<PrivateVideos />} />
          <Route path="/upload" element={<UploadVideo />} />
          <Route path="/watch/:videoId" element={<VideoWatch />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function NotFound() {
  return (
    <div className="bw-page bw-state">
      <strong>404 — Page not found</strong>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}
