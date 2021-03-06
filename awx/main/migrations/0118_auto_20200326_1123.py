# Generated by Django 2.2.8 on 2020-03-26 11:23

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import taggit.managers


class Migration(migrations.Migration):

    dependencies = [
        ('taggit', '0003_taggeditem_add_unique_index'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('main', '0117_auto_20200326_1043'),
    ]

    operations = [
        migrations.AddField(
            model_name='deployhistory',
            name='created',
            field=models.DateTimeField(default=None, editable=False),
        ),
        migrations.AddField(
            model_name='deployhistory',
            name='created_by',
            field=models.ForeignKey(default=None, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="{'class': 'deployhistory', 'model_name': 'deployhistory', 'app_label': 'main'}(class)s_created+", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='deployhistory',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='deployhistory',
            name='modified',
            field=models.DateTimeField(default=None, editable=False),
        ),
        migrations.AddField(
            model_name='deployhistory',
            name='modified_by',
            field=models.ForeignKey(default=None, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="{'class': 'deployhistory', 'model_name': 'deployhistory', 'app_label': 'main'}(class)s_modified+", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='deployhistory',
            name='name',
            field=models.CharField(default='nothing', max_length=512, unique=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='deployhistory',
            name='tags',
            field=taggit.managers.TaggableManager(blank=True, help_text='A comma-separated list of tags.', through='taggit.TaggedItem', to='taggit.Tag', verbose_name='Tags'),
        ),
    ]
