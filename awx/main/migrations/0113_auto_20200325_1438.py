# Generated by Django 2.2.8 on 2020-03-25 14:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0112_deployhistory_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='deployhistory',
            name='date',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]
