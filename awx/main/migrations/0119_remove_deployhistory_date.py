# Generated by Django 2.2.8 on 2020-03-26 11:34

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0118_auto_20200326_1123'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='deployhistory',
            name='date',
        ),
    ]
