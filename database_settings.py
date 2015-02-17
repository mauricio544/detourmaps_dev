DATABASE_LOCAL = True
if DATABASE_LOCAL:
    DATABASES = {
        'default': {
            'ENGINE': 'django.contrib.gis.db.backends.postgis',
            # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
            'NAME': 'dev_geo_detour', # Or path to database file if using sqlite3.
            'USER': 'postgres', # Not used with sqlite3.
            'PASSWORD': '04718802', # Not used with sqlite3.
            'HOST': 'localhost', # Set to empty string for localhost. Not used with sqlite3.
            'PORT': '5432', # Set to empty string for default. Not used with sqlite3.
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.contrib.gis.db.backends.postgis',
            # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
            'NAME': 'dev_geo_detour', # Or path to database file if using sqlite3.
            'USER': 'postgres', # Not used with sqlite3.
            'PASSWORD': '3nt1r3m4rk3t1ng', # Not used with sqlite3.
            'HOST': 'localhost', # Set to empty string for localhost. Not used with sqlite3.
            'PORT': '5432', # Set to empty string for default. Not used with sqlite3.
        }
    }
