import React from 'react';
import { RefreshCw } from 'lucide-react';

const RefreshButton = ({ 
  onRefresh, 
  loading = false, 
  size = 'md', 
  variant = 'primary',
  showText = true,
  className = '',
  disabled = false,
  lastUpdate = null
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50',
    ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return null;
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Hace menos de 1 minuto';
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onRefresh}
        disabled={disabled || loading}
        className={`
          inline-flex items-center gap-2 rounded-md font-medium
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        title={lastUpdate ? `Última actualización: ${formatLastUpdate(lastUpdate)}` : 'Actualizar datos'}
      >
        <RefreshCw 
          className={`
            ${iconSizes[size]} 
            ${loading ? 'animate-spin' : ''}
            transition-transform duration-200
          `} 
        />
        {showText && (
          <span>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </span>
        )}
      </button>
      
      {lastUpdate && (
        <span className="text-xs text-gray-500">
          {formatLastUpdate(lastUpdate)}
        </span>
      )}
    </div>
  );
};

export default RefreshButton;

// Componente específico para mostrar estado del caché
export const CacheStatus = ({ 
  isFromCache, 
  lastFetch, 
  cacheInfo,
  className = '' 
}) => {
  if (!isFromCache && !lastFetch) return null;

  const getStatusColor = () => {
    if (!cacheInfo) return 'text-gray-500';
    
    const now = Date.now();
    const age = now - cacheInfo.timestamp;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (age < fiveMinutes) return 'text-green-600';
    if (age < fiveMinutes * 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (isFromCache) {
      return '📦 Datos desde caché';
    }
    return '🌐 Datos actualizados';
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${getStatusColor()} ${className}`}>
      <span>{getStatusText()}</span>
      {lastFetch && (
        <span className="text-gray-400">
          • {new Date(lastFetch).toLocaleTimeString('es-ES')}
        </span>
      )}
    </div>
  );
};