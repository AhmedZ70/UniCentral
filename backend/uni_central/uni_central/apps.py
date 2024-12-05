from django.apps import AppConfig

class uni_centralConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'uni_central'

    def ready(self):
        import uni_central.signals