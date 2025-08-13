from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegistroUsuarioView,
    CustomTokenObtainPairView,
    PerfilUsuarioView,
    ListaUsuariosView,
    UsuarioDetailView,
    ClienteViewSet,
    ProductoViewSet,
    CategoriaViewSet,
    VentaViewSet,
    VentaItemViewSet,
    CarritoViewSet
)

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'venta-items', VentaItemViewSet)
router.register(r'carrito', CarritoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/registro/', RegistroUsuarioView.as_view(), name='auth_registro'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('usuarios/perfil/', PerfilUsuarioView.as_view(), name='perfil_usuario'),
    path('usuarios/', ListaUsuariosView.as_view(), name='lista_usuarios'),
    path('usuarios/<uuid:pk>/', UsuarioDetailView.as_view(), name='detalle_usuario'),
]