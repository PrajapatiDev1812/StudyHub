# pyrefly: ignore [missing-import]
from django.urls import path
from .views_themes import (
    ThemeListView,
    ActiveThemeView,
    ThemeCreateView,
    ThemeDetailUpdateDeleteView,
    ThemeVersionListView,
    ThemeVersionRestoreView,
    ThemeExportView,
    ThemeImportView,
)

urlpatterns = [
    path('', ThemeListView.as_view(), name='api-theme-list'),
    path('active/', ActiveThemeView.as_view(), name='api-theme-active'),
    path('create/', ThemeCreateView.as_view(), name='api-theme-create'),
    path('import/', ThemeImportView.as_view(), name='api-theme-import'),
    path('<int:pk>/', ThemeDetailUpdateDeleteView.as_view(), name='api-theme-detail'),
    path('<int:pk>/update/', ThemeDetailUpdateDeleteView.as_view(), name='api-theme-update'),
    path('<int:pk>/export/', ThemeExportView.as_view(), name='api-theme-export'),
    path('<int:pk>/versions/', ThemeVersionListView.as_view(), name='api-theme-versions'),
    path('<int:pk>/versions/<int:version_id>/restore/', ThemeVersionRestoreView.as_view(), name='api-theme-version-restore'),
]
