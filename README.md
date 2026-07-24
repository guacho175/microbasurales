# Microbasurales

Plataforma web para la denuncia ciudadana y la gestión municipal de microbasurales en
La Serena, Chile. Permite registrar focos de basura con fotografía y geolocalización,
validarlos, asignar responsables de terreno, documentar la limpieza y cerrar cada caso
con trazabilidad.

> Proyecto académico publicado como muestra de arquitectura, seguridad aplicada,
> pruebas automatizadas y evolución de software. No corresponde a un portal oficial de
> la Municipalidad de La Serena.

## Funcionalidades

- Registro e inicio de sesión de ciudadanos.
- Creación de denuncias con imagen, coordenadas y dirección referencial.
- Panel de fiscalización con filtros, mapa y flujo de estados.
- Asignación de jefes de cuadrilla y carga de evidencia de terreno.
- Cierre administrativo e historial de cambios.
- Notificaciones dentro de la aplicación y soporte configurable para correo.
- Dashboard de analítica, exportación CSV y dataset JSON para Power BI.
- API REST autenticada con JWT y sesiones web.
- Mapa público con un serializer limitado, sin identidad ni contenido del denunciante.

## Flujo principal

```text
pendiente → en_gestion → operativo_realizado → finalizado
     └──────────────→ rechazada
```

Los roles implementados son `ciudadano`, `fiscalizador`, `jefe_cuadrilla` y
`administrador`.

## Tecnologías

- Python 3.12 y Django 5.2 LTS
- Django REST Framework y SimpleJWT
- SQLite para desarrollo; MySQL/MariaDB configurable para producción
- Django Templates, Bootstrap 5, JavaScript modular y Leaflet
- WhiteNoise para archivos estáticos
- GitHub Actions y Dependabot

## Instalación local

### 1. Clonar y crear el entorno

```bash
git clone https://github.com/guacho175/microbasurales.git
cd microbasurales

python -m venv .venv
```

Activa el entorno:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# Linux o macOS
source .venv/bin/activate
```

Instala las dependencias:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 2. Configurar el entorno

El repositorio no incluye secretos ni configuraciones reales. Copia el archivo de
ejemplo:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# Linux o macOS
cp .env.example .env
```

Genera una clave distinta para tu instalación:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Pega el resultado en `SECRET_KEY` dentro de `.env`. Para desarrollo no necesitas pedir
ningún archivo privado: con `DB_ENGINE=sqlite` el proyecto crea `db.sqlite3`
localmente. Las credenciales MySQL, SMTP y otros servicios son opcionales y deben ser
propias de cada despliegue.

### 3. Inicializar y ejecutar

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Abre [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

## Calidad y pruebas

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

La suite cubre permisos por rol, aislamiento de datos, transiciones de estado,
geocodificación tolerante a fallos, notificaciones, analítica y el mapa público. El
workflow de CI ejecuta estas comprobaciones en cada push y pull request hacia `main`.

## Configuración de producción

La configuración se inyecta exclusivamente mediante variables de entorno. Para usar
MySQL define, como mínimo:

```ini
DEBUG=False
DB_ENGINE=mysql
DB_NAME=nombre_asignado_por_tu_proveedor
DB_USER=usuario_asignado_por_tu_proveedor
DB_PASSWORD=contraseña_generada_fuera_del_repositorio
DB_HOST=host_asignado_por_tu_proveedor
DB_PORT=3306
ALLOWED_HOSTS=tu-dominio.example
CSRF_TRUSTED_ORIGINS=https://tu-dominio.example
```

El archivo `.env.example` documenta el resto de opciones. `.env`, bases locales,
archivos subidos y documentación interna están excluidos deliberadamente del control
de versiones.

## Seguridad y privacidad

- No se incluyen credenciales, bases de datos, imágenes cargadas por usuarios ni
  entregables académicos.
- El listado global de denuncias exige un rol de gestión.
- Los ciudadanos solo consultan sus propias denuncias.
- Los cambios de estado se validan en una única capa del dominio.
- En producción se activan redirección HTTPS, cookies seguras, HSTS y protección
  `nosniff`.
- Los reportes de vulnerabilidades deben enviarse de forma privada según
  [SECURITY.md](SECURITY.md).

Antes de un uso real deben realizarse una evaluación de impacto de privacidad para las
coordenadas públicas, pruebas de carga y una revisión de la infraestructura elegida.

## Estructura

```text
config/       Configuración Django, URLs y WSGI/ASGI
usuarios/     Autenticación, perfiles, roles y administración de usuarios
denuncias/    Dominio principal, API, permisos, estados y paneles operativos
analitica/    Dashboard, exportación CSV y dataset de integración
templates/    Plantillas HTML
static/       CSS, JavaScript, iconos y recursos públicos
```

## Contexto y uso

El proyecto nació en la asignatura *Proyecto de Integración* (TIHI63). Los documentos
de evaluación, informes de auditoría, datos y configuraciones de despliegue se conservan
en un archivo privado independiente y no son necesarios para ejecutar esta versión.

Repositorio publicado con fines de portafolio. No se concede una licencia de
redistribución o explotación comercial salvo autorización expresa del autor.
