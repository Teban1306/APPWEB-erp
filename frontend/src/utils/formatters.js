// Función para formatear precios en pesos colombianos (COP)
export const formatCOP = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0 COP';
  }
  
  const number = parseFloat(amount);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

// Función alternativa más simple si la anterior no funciona
export const formatCOPSimple = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0 COP';
  }
  
  const number = parseFloat(amount);
  return `$${number.toLocaleString('es-CO')} COP`;
};