# Generated by Django 5.1.2 on 2024-11-08 09:24

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_alter_friendship_receiver_alter_friendship_sender'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='friendship',
            name='unique_friendship',
        ),
        migrations.RemoveConstraint(
            model_name='friendship',
            name='unique_reverse_friendship',
        ),
        migrations.RemoveConstraint(
            model_name='friendship',
            name='no_self_friendship',
        ),
    ]
