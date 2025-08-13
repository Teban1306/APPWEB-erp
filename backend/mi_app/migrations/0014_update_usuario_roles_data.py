from django.db import migrations

def update_usuario_roles(apps, schema_editor):
    Usuario = apps.get_model('mi_app', 'Usuario')
    # Actualizar todos los usuarios con rol 'usuario' a 'Usuario'
    Usuario.objects.filter(rol='usuario').update(rol='Usuario')

def reverse_usuario_roles(apps, schema_editor):
    Usuario = apps.get_model('mi_app', 'Usuario')
    # Revertir cambios
    Usuario.objects.filter(rol='Usuario').update(rol='usuario')

class Migration(migrations.Migration):

    dependencies = [
        ('mi_app', '0013_alter_ventaitem_unique_together_and_more'),
    ]

    operations = [
        migrations.RunPython(update_usuario_roles, reverse_usuario_roles),
    ]