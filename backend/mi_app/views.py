from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action, api_view, permission_classes
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView, ListAPIView, RetrieveUpdateDestroyAPIView
from django.db import transaction
from django.http import JsonResponse
from datetime import datetime
from .serializers import (
    UsuarioSerializer, 
    CustomTokenObtainPairSerializer, 
    ClienteSerializer,
    ProductoSerializer,
    CategoriaSerializer,
    VentaSerializer,
    VentaItemSerializer,
    CarritoSerializer
)
from .models import Cliente, Producto, Categoria, Venta, VentaItem, Carrito

Usuario = get_user_model()

class RegistroUsuarioView(CreateAPIView):
    queryset = Usuario.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UsuarioSerializer

    def create(self, request, *args, **kwargs):
        if request.user.rol not in ['admin', 'staff']:
            return Response(
                {'detail': 'Solo los administradores y staff pueden crear nuevos usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class PerfilUsuarioView(RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Usuario.objects.all()

    def get_object(self):
        if self.kwargs.get('pk'):
            return super().get_object()
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Si no es admin o staff, no puede cambiar roles ni zonas de acceso
        if request.user.rol not in ['admin', 'staff']:
            if 'rol' in request.data or 'zona_acceso' in request.data:
                return Response(
                    {'detail': 'No tienes permiso para modificar roles o zonas de acceso'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            if 'password' in request.data and request.data['password']:
                instance.set_password(request.data['password'])
            self.perform_update(serializer)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        if request.user.rol not in ['admin', 'staff']:
            return Response({'detail': 'No tienes permiso para eliminar usuarios'}, 
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer
    permission_classes = [permissions.AllowAny]  # Temporalmente permitir acceso sin autenticación

    def get_queryset(self):
        queryset = Venta.objects.all()
        
        # Filtrar por cliente si se proporciona
        cliente_cedula = self.request.query_params.get('cliente', None)
        if cliente_cedula:
            queryset = queryset.filter(cliente_cedula=cliente_cedula)
        
        # Filtrar por fecha si se proporciona
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        fecha_fin = self.request.query_params.get('fecha_fin', None)
        
        if fecha_inicio:
            queryset = queryset.filter(created_at__date__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(created_at__date__lte=fecha_fin)
        
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Crear venta directa y reducir stock de productos"""
        try:
            with transaction.atomic():
                # Obtener los items de la venta
                items_data = request.data.get('items', [])
                if not items_data:
                    return Response(
                        {'detail': 'La venta debe incluir al menos un producto'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Verificar stock disponible para todos los productos
                total_venta = 0
                items_validados = []
                
                for item_data in items_data:
                    producto_id = item_data.get('producto')
                    
                    # Validar y convertir cantidad
                    try:
                        cantidad = int(item_data.get('cantidad', 1))
                        if cantidad <= 0:
                            return Response(
                                {'detail': 'La cantidad debe ser mayor a 0'},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    except (ValueError, TypeError):
                        return Response(
                            {'detail': 'La cantidad debe ser un número entero válido'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    precio_unitario = item_data.get('precio_unitario')
                    
                    try:
                        producto = Producto.objects.get(id=producto_id)
                    except Producto.DoesNotExist:
                        return Response(
                            {'detail': f'Producto con ID {producto_id} no encontrado'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                    
                    if cantidad > producto.stock:
                        return Response(
                            {'detail': f'Stock insuficiente para {producto.nombre}. Solo hay {producto.stock} unidades disponibles.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Validar y convertir precio unitario
                    try:
                        if not precio_unitario:
                            precio_unitario = float(producto.precio)
                        else:
                            precio_unitario = float(precio_unitario)
                            if precio_unitario <= 0:
                                return Response(
                                    {'detail': 'El precio unitario debe ser mayor a 0'},
                                    status=status.HTTP_400_BAD_REQUEST
                                )
                    except (ValueError, TypeError):
                        return Response(
                            {'detail': 'El precio unitario debe ser un número válido'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    subtotal = cantidad * precio_unitario
                    total_venta += subtotal
                    items_validados.append({
                        'producto': producto,
                        'cantidad': cantidad,
                        'precio_unitario': precio_unitario,
                        'subtotal': subtotal
                    })
                
                # Crear la venta
                venta_data = {
                    'cliente_cedula': request.data.get('cliente'),
                    'total': total_venta
                }
                venta = Venta.objects.create(**venta_data)
                
                # Crear los items de venta y reducir stock
                for item_data in items_validados:
                    producto = item_data['producto']
                    cantidad = item_data['cantidad']
                    precio_unitario = item_data['precio_unitario']
                    
                    # Reducir stock
                    producto.reducir_stock(cantidad)
                    
                    # Crear item de venta
                    VentaItem.objects.create(
                        venta_id=venta.id,
                        producto_id=producto.id,
                        cantidad=cantidad,
                        precio_unitario=precio_unitario
                    )
                
                # Serializar y retornar la venta creada
                serializer = VentaSerializer(venta)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'detail': f'Error al procesar la venta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        # Temporalmente permitir que cualquier usuario autenticado elimine ventas
        # En producción, descomentar la validación de roles:
        # if request.user.rol not in ['admin', 'staff']:
        #     return Response(
        #         {'detail': 'Solo los administradores y staff pueden eliminar ventas'},
        #         status=status.HTTP_403_FORBIDDEN
        #     )
        
        # Obtener la instancia de la venta
        instance = self.get_object()
        
        # Eliminar todos los VentaItem relacionados antes de eliminar la venta
        VentaItem.objects.filter(venta_id=instance.id).delete()
        
        # Ahora eliminar la venta
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def procesar_desde_carrito(self, request):
        """Procesa una venta desde el carrito y reduce el stock"""
        session_id = request.data.get('session_id')
        usuario_id = request.data.get('usuario_id')
        cliente_cedula = request.data.get('cliente_cedula')
        
        if not session_id and not usuario_id:
            return Response(
                {'detail': 'Se requiere session_id o usuario_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Obtener items del carrito
                if session_id:
                    carrito_items = Carrito.objects.filter(session_id=session_id)
                else:
                    carrito_items = Carrito.objects.filter(usuario_id=usuario_id)
                
                if not carrito_items.exists():
                    return Response(
                        {'detail': 'El carrito está vacío'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Verificar stock disponible para todos los productos
                total_venta = 0
                items_validados = []
                
                for item in carrito_items:
                    producto = item.get_producto()
                    if not producto:
                        return Response(
                            {'detail': f'Producto con ID {item.producto_id} no encontrado'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                    
                    if not producto.tiene_stock(item.cantidad):
                        return Response(
                            {'detail': f'Stock insuficiente para {producto.nombre}. Solo hay {producto.stock} unidades disponibles.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    subtotal = item.cantidad * item.precio_unitario
                    total_venta += subtotal
                    items_validados.append({
                        'producto': producto,
                        'item': item,
                        'subtotal': subtotal
                    })
                
                # Crear la venta
                venta = Venta.objects.create(
                    cliente_cedula=cliente_cedula,
                    total=total_venta
                )
                
                # Crear los items de venta y reducir stock
                for item_data in items_validados:
                    producto = item_data['producto']
                    carrito_item = item_data['item']
                    
                    # Reducir stock
                    producto.reducir_stock(carrito_item.cantidad)
                    
                    # Crear item de venta
                    VentaItem.objects.create(
                        venta_id=venta.id,
                        producto_id=producto.id,
                        cantidad=carrito_item.cantidad,
                        precio_unitario=carrito_item.precio_unitario
                    )
                
                # Limpiar carrito
                carrito_items.delete()
                
                # Serializar y retornar la venta creada
                serializer = VentaSerializer(venta)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'detail': f'Error al procesar la venta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VentaItemViewSet(viewsets.ModelViewSet):
    queryset = VentaItem.objects.all()
    serializer_class = VentaItemSerializer
    permission_classes = [permissions.AllowAny]  # Temporalmente permitir acceso sin autenticación

    def get_queryset(self):
        queryset = VentaItem.objects.all()
        
        # Filtrar por venta si se proporciona
        venta_id = self.request.query_params.get('venta', None)
        if venta_id:
            queryset = queryset.filter(venta_id=venta_id)
        
        return queryset.order_by('-created_at')

class ListaUsuariosView(ListAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        queryset = Usuario.objects.select_related().all()
        if self.request.user.rol not in ['admin', 'staff']:
            queryset = queryset.filter(id=self.request.user.id)
        return queryset.order_by('-created_at')

class PerfilUsuarioView(RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        if self.kwargs.get('pk'):
            return Usuario.objects.select_related().get(pk=self.kwargs['pk'])
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if request.user.rol not in ['admin', 'staff']:
            if 'rol' in request.data or 'zona_acceso' in request.data:
                return Response(
                    {'detail': 'No tienes permiso para modificar roles o zonas de acceso'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        if request.user.rol not in ['admin', 'staff']:
            return Response({'detail': 'No tienes permiso para eliminar usuarios'}, 
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class UsuarioDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Usuario.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Si no es admin o staff, no puede cambiar roles ni zonas de acceso
        if request.user.rol not in ['admin', 'staff'] and request.user.id != instance.id:
            return Response(
                {'detail': 'No tienes permiso para modificar otros usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.rol not in ['admin', 'staff']:
            if 'rol' in request.data or 'zona_acceso' in request.data:
                return Response(
                    {'detail': 'No tienes permiso para modificar roles o zonas de acceso'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            if 'password' in request.data and request.data['password']:
                instance.set_password(request.data['password'])
            self.perform_update(serializer)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_object(self):
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj

    def destroy(self, request, *args, **kwargs):
        if request.user.rol not in ['admin', 'staff']:
            return Response(
                {'detail': 'No tienes permiso para eliminar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            usuario = self.get_object()
            if usuario.id == request.user.id:
                return Response(
                    {'detail': 'No puedes eliminar tu propio usuario'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            usuario.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Usuario.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

    def get_queryset(self):
        # Si es admin o staff, puede ver todos los usuarios
        if self.request.user.rol in ['admin', 'staff']:
            return Usuario.objects.all().order_by('-created_at')
        # Si no es admin o staff, solo puede verse a sí mismo
        return Usuario.objects.filter(id=self.request.user.id)

    def get_object(self):
        obj = Usuario.objects.get(pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)
        return obj

    def delete(self, request, *args, **kwargs):
        if request.user.rol not in ['admin', 'staff']:
            return Response(
                {'detail': 'No tienes permiso para eliminar usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            usuario = self.get_object()
            if usuario.id == request.user.id:
                return Response(
                    {'detail': 'No puedes eliminar tu propio usuario'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            usuario.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Usuario.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'cedula'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.AllowAny]  # Temporalmente permitir acceso sin autenticación

    def get_queryset(self):
        return Categoria.objects.all().order_by('nombre')

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]  # Temporalmente permitir acceso sin autenticación

    def get_queryset(self):
        queryset = Producto.objects.all().order_by('-created_at')
        categoria = self.request.query_params.get('categoria', None)
        if categoria is not None:
            queryset = queryset.filter(categoria_id=categoria)
        return queryset

    def create(self, request, *args, **kwargs):
        if request.user.rol not in ['admin', 'staff']:
            return Response(
                {'detail': 'Solo los administradores y staff pueden crear productos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.rol not in ['admin', 'staff']:
            return Response(
                {'detail': 'Solo los administradores y staff pueden modificar productos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.rol not in ['admin', 'staff']:
            return Response(
                {'detail': 'Solo los administradores y staff pueden eliminar productos'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

class CarritoViewSet(viewsets.ModelViewSet):
    queryset = Carrito.objects.all()
    serializer_class = CarritoSerializer
    permission_classes = [permissions.AllowAny]  # Temporalmente permitir acceso sin autenticación

    def get_queryset(self):
        queryset = Carrito.objects.all()
        
        # Filtrar por session_id o usuario_id
        session_id = self.request.query_params.get('session_id', None)
        usuario_id = self.request.query_params.get('usuario_id', None)
        
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        elif usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)
        
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Agregar producto al carrito"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                producto_id = serializer.validated_data['producto_id']
                cantidad = serializer.validated_data['cantidad']
                session_id = serializer.validated_data.get('session_id')
                usuario_id = serializer.validated_data.get('usuario_id')
                
                producto = Producto.objects.get(id=producto_id)
                
                # Verificar si el producto ya está en el carrito
                existing_item = None
                if session_id:
                    existing_item = Carrito.objects.filter(
                        session_id=session_id, 
                        producto_id=producto_id
                    ).first()
                elif usuario_id:
                    existing_item = Carrito.objects.filter(
                        usuario_id=usuario_id, 
                        producto_id=producto_id
                    ).first()
                
                if existing_item:
                    # Verificar stock total (existente + nuevo)
                    nueva_cantidad = existing_item.cantidad + cantidad
                    if nueva_cantidad > producto.stock:
                        return Response(
                            {'detail': f'Stock insuficiente. Solo hay {producto.stock} unidades disponibles y ya tienes {existing_item.cantidad} en el carrito.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    existing_item.cantidad = nueva_cantidad
                    existing_item.save()
                    serializer = self.get_serializer(existing_item)
                else:
                    # Verificar stock para nuevo item
                    if cantidad > producto.stock:
                        return Response(
                            {'detail': f'Stock insuficiente. Solo hay {producto.stock} unidades disponibles.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    carrito_item = serializer.save()
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except Producto.DoesNotExist:
                return Response(
                    {'detail': 'El producto no existe'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        """Actualizar cantidad en carrito"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Verificar stock antes de actualizar
        if 'cantidad' in request.data:
            try:
                nueva_cantidad = int(request.data['cantidad'])
                if nueva_cantidad <= 0:
                    return Response(
                        {'detail': 'La cantidad debe ser mayor a 0'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'detail': 'La cantidad debe ser un número entero válido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            producto = instance.get_producto()
            if producto and nueva_cantidad > producto.stock:
                return Response(
                    {'detail': f'Stock insuficiente. Solo hay {producto.stock} unidades disponibles.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Eliminar producto del carrito"""
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def api_welcome(request):
    """Vista de bienvenida para la raíz de la API"""
    welcome_data = {
        'message': '¡Bienvenido a ERP TIKNO API! 🚀',
        'description': 'Sistema de gestión empresarial completo con funcionalidades de inventario, ventas y administración de usuarios.',
        'version': '1.0.0',
        'status': 'active',
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            'admin': '/admin/',
            'api_root': '/api/',
            'authentication': {
                'login': '/api/auth/login/',
                'register': '/api/auth/register/',
                'profile': '/api/auth/profile/'
            },
            'resources': {
                'usuarios': '/api/usuarios/',
                'clientes': '/api/clientes/',
                'productos': '/api/productos/',
                'categorias': '/api/categorias/',
                'ventas': '/api/ventas/',
                'carrito': '/api/carrito/'
            }
        },
        'features': [
            'Gestión de usuarios con roles y permisos',
            'Sistema de autenticación JWT',
            'Administración de productos e inventario',
            'Gestión de clientes',
            'Sistema de ventas y facturación',
            'Carrito de compras',
            'Categorización de productos',
            'Control de stock automático'
        ],
        'tech_stack': {
            'backend': 'Django REST Framework',
            'database': 'PostgreSQL (Supabase)',
            'authentication': 'JWT',
            'deployment': 'Render'
        },
        'contact': {
            'developer': 'ERP TIKNO Team',
            'support': 'Contacta al administrador del sistema'
        }
    }
    
    return JsonResponse(welcome_data, json_dumps_params={'indent': 2})
