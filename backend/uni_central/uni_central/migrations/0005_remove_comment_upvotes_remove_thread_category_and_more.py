# Generated by Django 5.1.3 on 2025-02-27 05:16

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('uni_central', '0004_comment_upvotes_thread_category_thread_content'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='comment',
            name='upvotes',
        ),
        migrations.RemoveField(
            model_name='thread',
            name='category',
        ),
        migrations.RemoveField(
            model_name='thread',
            name='content',
        ),
    ]
