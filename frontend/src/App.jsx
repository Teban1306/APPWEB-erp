import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import ResponsiveLayout from './components/ResponsiveLayout'
import Clientes from './pages/Clientes'
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'
import Informes from './pages/Informes'
import Usuarios from './pages/Usuarios'
import TestAPI from './pages/TestAPI'

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

const Dashboard = () => {
  return (
    <ResponsiveLayout>
      <Outlet />
    </ResponsiveLayout>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/test-api" element={<TestAPI />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/clientes" replace />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="productos" element={<Productos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="informes" element={<Informes />} />
          <Route path="test-api" element={<TestAPI />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
