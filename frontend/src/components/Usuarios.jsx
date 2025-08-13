import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [formData, setFormData] = useState({
    nombre: '',
    correo: ''
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
      
      if (error) throw error
      setUsuarios(data)
    } catch (error) {
      console.error('Error al obtener usuarios:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([formData])
        .select()

      if (error) throw error
      
      setUsuarios([...usuarios, data[0]])
      setFormData({ nombre: '', correo: '' })
    } catch (error) {
      console.error('Error al crear usuario:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="usuarios-container">
      <h2>Gestión de Usuarios</h2>
      
      <form onSubmit={handleSubmit} className="usuario-form">
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          required
        />
        <input
          type="email"
          name="correo"
          value={formData.correo}
          onChange={handleChange}
          placeholder="Correo"
          required
        />
        <button type="submit">Agregar Usuario</button>
      </form>

      <div className="usuarios-list">
        <h3>Lista de Usuarios</h3>
        {usuarios.map(usuario => (
          <div key={usuario.id} className="usuario-card">
            <h4>{usuario.nombre}</h4>
            <p>{usuario.correo}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Usuarios