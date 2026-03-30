"""
Management command to insert sample data for RAG testing.
Usage: python manage.py insert_sample_data
"""
from django.core.management.base import BaseCommand
from django.conf import settings
from courses.models import Course, Subject, Topic, Content, Enrollment
from accounts.models import User


SAMPLE_CONTENT_TEXT = """Linear Regression is one of the most fundamental algorithms in statistics and machine learning. It is used to model the relationship between a dependent variable (target) and one or more independent variables (features).

Types of Linear Regression:
1. Simple Linear Regression: Uses one independent variable.
   Formula: y = mx + b, where m is the slope and b is the y-intercept.
2. Multiple Linear Regression: Uses two or more independent variables.
   Formula: y = b0 + b1*x1 + b2*x2 + ... + bn*xn

Assumptions of Linear Regression:
1. Linearity: The relationship between X and Y must be linear.
2. Independence: Observations must be independent of each other.
3. Homoscedasticity: The variance of error terms must be constant across all levels of X.
4. Normality: For hypothesis testing, the error terms should be normally distributed.
5. No Multicollinearity: In multiple regression, independent variables should not be highly correlated with each other.
6. No Autocorrelation: The residuals should not be correlated with each other.

How to Check Assumptions:
- Linearity: Scatter plot of X vs Y.
- Homoscedasticity: Residual plot (residuals vs fitted values).
- Normality: Q-Q plot or Shapiro-Wilk test.
- Multicollinearity: VIF (Variance Inflation Factor) — VIF > 10 indicates a problem.
- Autocorrelation: Durbin-Watson test — value near 2 means no autocorrelation.

Evaluation Metrics:
- R-squared (R²): Proportion of variance explained by the model. Ranges from 0 to 1. Higher is better.
- Adjusted R²: Adjusts R² for the number of predictors. Better for comparing models with different numbers of features.
- Mean Squared Error (MSE): Average of squared differences between predicted and actual values. Lower is better.
- Root Mean Squared Error (RMSE): Square root of MSE. In the same units as the target variable.

Example:
Suppose we want to predict student exam scores based on hours studied.
Data: (1h, 35), (2h, 45), (3h, 55), (4h, 65), (5h, 75)
Using simple linear regression: Score = 25 + 10 * Hours
Interpretation: For every additional hour studied, the score increases by 10 points.

Common Mistakes:
1. Using linear regression for non-linear data.
2. Ignoring outliers that can heavily influence the regression line.
3. Not checking multicollinearity in multiple regression.
4. Overfitting by including too many features.
5. Extrapolating beyond the range of the training data."""


class Command(BaseCommand):
    help = 'Insert sample data for testing the RAG system.'

    def handle(self, *args, **options):
        # Get or create admin user
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            self.stderr.write(self.style.ERROR('No admin user found. Create one first.'))
            return

        # Get or create student user
        student_user = User.objects.filter(role='student').first()
        if not student_user:
            student_user = User.objects.create_user(
                username='rag_test_student',
                password='TestPass@123',
                role='student',
            )
            self.stdout.write(f'Created test student: rag_test_student')

        # Create Course → Subject → Topic → Content
        course, _ = Course.objects.get_or_create(
            name='Data Science Fundamentals',
            defaults={
                'description': 'A comprehensive course on data science.',
                'created_by': admin_user,
                'is_public': True,
            }
        )
        self.stdout.write(f'Course: {course.name}')

        subject, _ = Subject.objects.get_or_create(
            course=course,
            name='Statistics',
            defaults={'description': 'Statistical methods for data science.'}
        )
        self.stdout.write(f'Subject: {subject.name}')

        topic, _ = Topic.objects.get_or_create(
            subject=subject,
            name='Linear Regression',
            defaults={'description': 'Understanding linear regression models.'}
        )
        self.stdout.write(f'Topic: {topic.name}')

        content, created = Content.objects.get_or_create(
            topic=topic,
            title='Linear Regression - Complete Guide',
            defaults={
                'content_type': 'text',
                'text_content': SAMPLE_CONTENT_TEXT,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created content: {content.title}'))
        else:
            self.stdout.write(f'Content already exists: {content.title}')

        # Enroll student in the course
        enrollment, created = Enrollment.objects.get_or_create(
            student=student_user,
            course=course,
        )
        if created:
            self.stdout.write(f'Enrolled {student_user.username} in {course.name}')

        # Insert sample student note
        from ai.models import StudentNote
        note, created = StudentNote.objects.get_or_create(
            user=student_user,
            title='My Linear Regression Notes',
            defaults={
                'content': (
                    'Linear regression assumes linear relationship and no multicollinearity. '
                    'I need to remember to check VIF values. '
                    'Also R-squared should be high but adjusted R-squared is better for comparison. '
                    'Professor said Durbin-Watson test is important for time series data. '
                    'Simple formula: y = mx + b. '
                    'Common mistake: using it for non-linear data.'
                ),
                'subject': subject,
                'topic': topic,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created student note: {note.title}'))

        self.stdout.write(self.style.SUCCESS(
            '\nSample data inserted! Now run:\n'
            '  python manage.py embed_admin_content\n'
            'to generate embeddings (requires GEMINI_API_KEY in .env)'
        ))
