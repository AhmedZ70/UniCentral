# Generated by Django 5.1.3 on 2025-04-14 18:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('uni_central', '0014_studybuddymessage'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='course',
            name='semester',
        ),
        migrations.AddField(
            model_name='course',
            name='avg_grade',
            field=models.CharField(blank=True, max_length=2, null=True),
        ),
    ]
