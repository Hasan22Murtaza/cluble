import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import CreateProfile from '@/pages/CreateProfile';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Chat from '@/pages/Chat';
import ChatList from '@/pages/ChatList';
import Payment from '@/pages/Payment';
import PaymentSuccess from '@/pages/PaymentSuccess';
import ProtectedRoute from '@/components/ProtectedRoute';
import EditProfile from '@/pages/EditProfile';
import ForgotPassword from '@/pages/ForgotPassword';
import UpdatePassword from '@/pages/UpdatePassword';
import Events from '@/pages/Events';
import LandingPage from '@/pages/LandingPage'; // Import the new LandingPage

function App() {
  return (
    <AuthProvider>
      <Router>
        <Helmet>
          <title>Clube Liberal - Classificados Swinger</title>
          <meta name="description" content="A melhor plataforma de classificados para o público swinger. Conecte-se com casais e solteiros da sua região." />
        </Helmet>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<LandingPage />} /> {/* New Landing Page as root */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/create-profile" element={
              <ProtectedRoute>
                <CreateProfile />
              </ProtectedRoute>
            } />
             <Route path="/edit-profile" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/home" element={ // Home is now a protected route at /home
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/profile/:id" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/chat/:id" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/chats" element={
              <ProtectedRoute>
                <ChatList />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } />
            <Route path="/payment/success" element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;