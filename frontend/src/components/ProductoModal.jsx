import { useState, useEffect } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { supabase } from '../supabase';
import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: 'dpsqlyeox'
  }
});

const ProductoModal = ({ isOpen, onClose, producto = null, readOnly = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    imagen_url: '',
    categoria_id: ''
  });
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);

  useEffect(() => {
    fetchCategorias();
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio?.toString() || '',
        stock: producto.stock?.toString() || '',
        imagen_url: producto.imagen_url || '',
        categoria_id: producto.categoria_id?.toString() || ''
      });
    } else {
      // Reset form when no producto is provided
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        imagen_url: '',
        categoria_id: ''
      });
    }
  }, [producto]);

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Error fetching categorias:', error);
      setError('Error al cargar las categorías');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar el tipo y tamaño del archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('El archivo debe ser una imagen (JPEG, PNG, GIF o WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('La imagen no debe superar los 10MB');
      return;
    }

    try {
      setUploadingImage(true);
      const timestamp = Date.now();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'productos_preset');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dpsqlyeox/image/upload',
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error de Cloudinary:', errorData);
        throw new Error(errorData.error?.message || 'Error al subir la imagen');
      }

      const data = await response.json();
      console.log('Cloudinary response:', data);

      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imagen_url: data.secure_url }));
      } else {
        throw new Error('No se recibió la URL de la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Error al subir la imagen: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.trim()) {
      setError('El nombre de la categoría no puede estar vacío');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias')
        .insert([{ nombre: nuevaCategoria.trim() }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setCategorias(prev => [...prev, data[0]]);
        setFormData(prev => ({ ...prev, categoria_id: data[0].id }));
        setNuevaCategoria('');
        setMostrarNuevaCategoria(false);
      }
    } catch (error) {
      console.error('Error creating categoria:', error);
      setError('Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        imagen_url: formData.imagen_url,
        categoria_id: formData.categoria_id || null
      };

      let result;
      if (producto) {
        const { data, error: updateError } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', producto.id)
          .select();
        if (updateError) throw updateError;
        result = data[0];
      } else {
        const { data, error: insertError } = await supabase
          .from('productos')
          .insert([productoData])
          .select();
        if (insertError) throw insertError;
        result = data[0];
      }

      // Pasar el producto actualizado/creado al componente padre
      onClose(result);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        imagen_url: '',
        categoria_id: ''
      });
    } catch (error) {
      console.error('Error saving producto:', error);
      setError('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {readOnly ? 'Detalles del Producto' : (producto ? 'Editar Producto' : 'Nuevo Producto')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              required={!readOnly}
              readOnly={readOnly}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${readOnly ? 'bg-gray-50' : 'focus:border-indigo-500 focus:ring-indigo-500'}`}
              value={formData.nombre}
              onChange={(e) => !readOnly && setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              readOnly={readOnly}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${readOnly ? 'bg-gray-50' : 'focus:border-indigo-500 focus:ring-indigo-500'}`}
              rows="3"
              value={formData.descripcion}
              onChange={(e) => !readOnly && setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio</label>
              <input
                type="number"
                step="0.01"
                required={!readOnly}
                readOnly={readOnly}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${readOnly ? 'bg-gray-50' : 'focus:border-indigo-500 focus:ring-indigo-500'}`}
                value={formData.precio}
                onChange={(e) => !readOnly && setFormData({ ...formData, precio: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input
                type="number"
                required={!readOnly}
                readOnly={readOnly}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${readOnly ? 'bg-gray-50' : 'focus:border-indigo-500 focus:ring-indigo-500'}`}
                value={formData.stock}
                onChange={(e) => !readOnly && setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Imagen</label>
            <div className="mt-1 flex items-center space-x-4">
              {formData.imagen_url && (
                <img
                  src={formData.imagen_url}
                  alt="Vista previa"
                  className="h-20 w-20 object-cover rounded-lg"
                />
              )}
              {!readOnly && (
                <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2" />
                  {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setMostrarNuevaCategoria(!mostrarNuevaCategoria)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva categoría
                </button>
              )}
            </div>
            {mostrarNuevaCategoria ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  placeholder="Nombre de la categoría"
                />
                <button
                  type="button"
                  onClick={handleCrearCategoria}
                  disabled={loading}
                  className="mt-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            ) : (
              <select
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${readOnly ? 'bg-gray-50' : 'focus:border-indigo-500 focus:ring-indigo-500'}`}
                value={formData.categoria_id}
                onChange={(e) => !readOnly && setFormData({ ...formData, categoria_id: e.target.value })}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductoModal;