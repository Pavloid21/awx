# Generated by Django 2.2.8 on 2020-06-04 07:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0127_deployhistory_action'),
    ]

    operations = [
        migrations.AddField(
            model_name='deployhistory',
            name='setuper',
            field=models.BooleanField(default=None),
        ),
    ]
