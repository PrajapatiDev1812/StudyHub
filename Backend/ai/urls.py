from django.urls import path
from .views import ChatbotView, SummaryView

urlpatterns = [
    path('chat/', ChatbotView.as_view(), name='ai-chat'),
    path('summary/', SummaryView.as_view(), name='ai-summary'),
]
