import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Feed from './pages/Feed';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RecoverPassword from './pages/auth/RecoverPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminLayout from './pages/admin/AdminLayout';
import AdminProducts from './pages/admin/AdminProducts';
import AdminToday from './pages/admin/AdminToday';
import AdminCategories from './pages/admin/AdminCategories';
import AdminMessages from './pages/admin/AdminMessages';
import AdminBusiness from './pages/admin/AdminBusiness';
import AdminProfile from './pages/admin/AdminProfile';
import AdminStaff from './pages/admin/AdminStaff';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Feed />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/recuperar" element={<RecoverPassword />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="hoy" replace />} />
        <Route path="hoy" element={<AdminToday />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="categorias" element={<ProtectedRoute permission="menu.edit"><AdminCategories /></ProtectedRoute>} />
        <Route path="mensajes" element={<AdminMessages />} />
        <Route path="comercio" element={<ProtectedRoute permission="business.view"><AdminBusiness /></ProtectedRoute>} />
        <Route path="equipo" element={<ProtectedRoute permission="staff.view"><AdminStaff /></ProtectedRoute>} />
        <Route path="perfil" element={<AdminProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
