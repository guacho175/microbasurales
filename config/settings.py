import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


def env_bool(nombre, valor_por_defecto=False):
    """Interpreta booleanos habituales de variables de entorno."""

    valor = os.environ.get(nombre)
    if valor is None:
        return valor_por_defecto
    return valor.strip().lower() in {"1", "true", "yes", "on"}


def env_list(nombre, valor_por_defecto=""):
    """Devuelve una lista limpia desde una variable separada por comas."""

    return [
        elemento.strip()
        for elemento in os.environ.get(nombre, valor_por_defecto).split(",")
        if elemento.strip()
    ]


# ========================================
# BASE DIR
# ========================================
BASE_DIR = Path(__file__).resolve().parent.parent

# ========================================
# SECRET KEY & DEBUG  (🔥 FALTABAN 🔥)
# ========================================
SECRET_KEY = os.environ.get("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY no está definido en variables de entorno")

DEBUG = env_bool("DEBUG", False)

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")



# ========================================
# APPS
# ========================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'corsheaders',

    # Project apps
    'usuarios',
    'denuncias',
    'analitica',
]

# ========================================
# MIDDLEWARE
# ========================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # <-- WhiteNoise aquí
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ========================================
# URLS / WSGI
# ========================================
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

# ========================================
# TEMPLATES
# ========================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ========================================
# DATABASE
# DB_ENGINE selecciona el motor:
#   - "sqlite" (por defecto): desarrollo local.
#   - "mysql": producción en PythonAnywhere (capa gratuita).
# Las credenciales de MySQL se entregan por variables de entorno.
# ========================================
DB_ENGINE = os.environ.get("DB_ENGINE", "sqlite")

if DB_ENGINE == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
elif DB_ENGINE == "mysql":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": os.environ.get("DB_NAME", ""),
            "USER": os.environ.get("DB_USER", ""),
            "PASSWORD": os.environ.get("DB_PASSWORD", ""),
            "HOST": os.environ.get("DB_HOST", ""),
            "PORT": os.environ.get("DB_PORT", "3306"),
            "CONN_MAX_AGE": 60,
            "OPTIONS": {
                "charset": "utf8mb4",
            },
        }
    }
else:
    raise RuntimeError(
        f"DB_ENGINE inválido: {DB_ENGINE!r}. Usa 'sqlite' o 'mysql'."
    )

# ========================================
# PASSWORD VALIDATION
# ========================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ========================================
# INTERNATIONALIZATION
# ========================================
LANGUAGE_CODE = 'es-cl'
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True

# ========================================
# STATIC & MEDIA (PRODUCCIÓN)
# ========================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Donde están tus static en el repo (static/css, static/img, etc.)
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# Django 5: configuración de almacenamiento mediante STORAGES.
# WhiteNoise comprime y versiona los estáticos en producción.
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        # Comprime los estáticos (gzip/brotli) sin requerir manifiesto, evitando
        # depender de collectstatic en pruebas. Suficiente para este proyecto.
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ========================================
# AUTH & USER MODEL
# ========================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'usuarios.Usuario'

LOGIN_URL = 'login_django'
LOGIN_REDIRECT_URL = 'home_ciudadano'
LOGOUT_REDIRECT_URL = 'login_django'

# ========================================
# REST + JWT
# ========================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ========================================
# CORS
# En desarrollo (DEBUG) se permiten todos los orígenes por comodidad; en producción
# se restringe a CORS_ALLOWED_ORIGINS (lista separada por comas en variable de entorno).
# ========================================
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_ALL_ORIGINS = DEBUG and not CORS_ALLOWED_ORIGINS

# ========================================
# POWER BI (opcional)
# ========================================
POWERBI_DASHBOARD_EMBED_URL = os.getenv("POWERBI_DASHBOARD_EMBED_URL", "")

# ========================================
# GEOCODING (Nominatim) — desactivable por entorno (p. ej. en pruebas)
# ========================================
GEOCODING_ENABLED = env_bool("GEOCODING_ENABLED", True)

# ========================================
# EMAIL (notificaciones de cambio de estado — HU7)
# En desarrollo (DEBUG) se imprime en consola. En producción, SMTP por variables.
# NOTA: PythonAnywhere capa gratuita restringe el SMTP saliente a hosts en lista
# blanca; el envío real puede requerir plan de pago o un proveedor permitido.
# ========================================
EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend"
    if DEBUG
    else "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "10"))
DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL", "Microbasurales <no-reply@microbasurales.local>"
)
NOTIFICACIONES_EMAIL_ENABLED = env_bool(
    "NOTIFICACIONES_EMAIL_ENABLED",
    False,
)

# ========================================
# SEGURIDAD EN PRODUCCIÓN (solo cuando DEBUG=False)
# PythonAnywhere termina TLS en su proxy y entrega la cabecera X-Forwarded-Proto.
# ========================================
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = "DENY"

# ========================================
# LOGGING
# ========================================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.getenv("LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}
