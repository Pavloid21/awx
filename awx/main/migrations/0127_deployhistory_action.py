# Generated by Django 2.2.8 on 2020-04-17 06:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0126_auto_20200417_0054'),
    ]

    operations = [
        migrations.AddField(
            model_name='deployhistory',
            name='action',
            field=models.ManyToManyField(blank=True, to='main.Action'),
        ),
    ]
