import { useState } from 'react'
import loginDecoration from '../assets/login-decoration.svg'
import logo from '../assets/Logo.png'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || 'Error al iniciar sesión')

      // Guardar tokens en localStorage
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)

      // Forzar la recarga del estado de autenticación
      window.location.href = '/clientes'
    } catch (error) {
      console.error('Error durante el login:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/registro/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          nombre,
          rol: 'Usuario',
          zona_acceso: 'general'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Error en el registro')
      }

      setSuccess('Registro completado exitosamente. Ahora puedes iniciar sesión.')
      setIsRegistering(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fondo con degradado responsivo */}
      <div className="absolute inset-0 flex">
        <div className="hidden lg:block w-[35%] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="flex-1 bg-white lg:bg-transparent"></div>
      </div>
      
      {/* Contenedor principal responsivo */}
      <div className="relative w-full lg:w-[35%] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl shadow-gray-900/10 border border-gray-200/50 backdrop-blur-sm"
        >
          <div className="w-full space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-center"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
                <motion.img 
                  src={logo} 
                  alt="VentasApp Logo" 
                  className="h-10 sm:h-12 w-auto"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 200 }}
                />
                <motion.h1 
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  TIKNO Market
                </motion.h1>
              </div>
              <motion.h2 
                className="text-center text-xl sm:text-2xl font-semibold text-gray-900"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                {isRegistering ? 'Crear cuenta nueva' : 'Bienvenido de nuevo'}
              </motion.h2>
              <motion.p 
                className="text-center text-sm sm:text-base text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                {isRegistering ? 'Completa tus datos para registrarte' : 'Ingresa tus credenciales para continuar'}
              </motion.p>
            </motion.div>
            <motion.form 
              className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" 
              onSubmit={isRegistering ? handleSignUp : handleLogin}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {isRegistering && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                      Nombre completo
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="input-responsive w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-300 text-sm sm:text-base"
                      placeholder="Ingresa tu nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Nombre de usuario
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-responsive w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-300 text-sm sm:text-base"
                      placeholder="Elige un nombre de usuario"
                    />
                  </div>
                </motion.div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-responsive w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-300 text-sm sm:text-base"
                  placeholder="tu@email.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-responsive w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none hover:border-gray-300 text-sm sm:text-base"
                  placeholder="••••••••"
                />
              </div>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl bg-green-50 border border-green-200 p-4"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm sm:text-base font-medium text-green-800">{success}</h3>
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl bg-red-50 border border-red-200 p-4"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm sm:text-base font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="btn-responsive w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    isRegistering ? 'Crear cuenta' : 'Iniciar sesión'
                  )}
                </motion.button>
              </motion.div>

              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering)
                    setError(null)
                    setSuccess(null)
                    setUsername('')
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm sm:text-base font-medium text-blue-600 hover:text-blue-800 transition-all duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-lg px-2 py-1"
                >
                  {isRegistering
                    ? '¿Ya tienes una cuenta? Inicia sesión'
                    : '¿No tienes una cuenta? Regístrate'}
                </motion.button>
              </motion.div>
            </motion.form>
          </div>
        </motion.div>
      </div>

      {/* Lado derecho - Decoración - Solo visible en pantallas grandes */}
      <motion.div 
        className="hidden lg:flex relative w-[65%] items-center justify-center pl-8 xl:pl-32"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="relative">
          <motion.div
            className="relative bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-12 xl:p-20 shadow-2xl"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <motion.img
              src={logo}
              alt="VentasApp Logo"
              className="w-32 xl:w-48 drop-shadow-lg"
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.5,
                scale: { type: "spring", damping: 8, stiffness: 100 },
                rotate: { duration: 1.2 }
              }}
            />
          </motion.div>
          
          {/* Elementos decorativos flotantes */}
          <motion.div
            className="absolute -top-4 -right-4 w-8 h-8 bg-blue-400 rounded-full opacity-60"
            animate={{ 
              y: [-10, 10, -10],
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-6 -left-6 w-6 h-6 bg-blue-300 rounded-full opacity-50"
            animate={{ 
              y: [10, -10, 10],
              opacity: [0.5, 0.7, 0.5]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}