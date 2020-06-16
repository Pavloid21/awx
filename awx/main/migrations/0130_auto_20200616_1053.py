# Generated by Django 2.2.8 on 2020-06-16 10:53

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0129_deployhistory_picker'),
    ]

    operations = [
        migrations.AddField(
            model_name='deployhistory',
            name='job',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deployhistorys', to='main.Job'),
        ),
        migrations.AlterField(
            model_name='deployhistory',
            name='picker',
            field=models.BooleanField(default=None),
        ),
        migrations.AlterField(
            model_name='deployhistory',
            name='setuper',
            field=models.BooleanField(default=None),
        ),
    ]
