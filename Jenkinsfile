pipeline {
    agent any

    environment {
        SITE_NAME = "${env.BRANCH_NAME == 'uat' ? 'car-rentals-uat' : 'car-rentals'}"
        WEBROOT = "C:\\WebProject\\${SITE_NAME}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Composer Install') {
            steps {
                bat 'composer install --no-dev --optimize-autoloader --no-interaction'
            }
        }

        stage('NPM Install & Build') {
            steps {
                bat 'npm ci'
                bat 'npm run build'
            }
        }

        stage('Backup & Copy Files') {
            steps {
                bat """
                    if exist "%WEBROOT%" (
                        if exist "%WEBROOT%\\.env" copy "%WEBROOT%\\.env" "%WORKSPACE%\\.env_backup"
                        rmdir /S /Q "%WEBROOT%"
                    )
                    xcopy /E /I /Y "." "%WEBROOT%"
                    if exist "%WORKSPACE%\\.env_backup" (
                        move /Y "%WORKSPACE%\\.env_backup" "%WEBROOT%\\.env"
                    )
                    icacls "%WEBROOT%\\storage" /grant "Users:(OI)(CI)M" /Q
                """
            }
        }

        stage('Setup .env') {
            steps {
                bat """
                    cd /d "%WEBROOT%"
                    if not exist ".env" (
                        copy .env.example .env
                        php artisan key:generate --force
                    )
                """
            }
        }

        stage('Optimize') {
            steps {
                bat """
                    cd /d "%WEBROOT%"
                    php artisan optimize
                """
            }
        }

        stage('Restart Nginx & PHP') {
            steps {
                powershell """
                    Write-Output "Restarting PHP-FPM..."
                    Restart-Service -Name "php*" -Force
                    Write-Output "Restarting nginx..."
                    Restart-Service -Name "nginx" -Force
                """
            }
        }
    }

    post {
        failure {
            echo "Build failed on branch ${env.BRANCH_NAME}"
        }
    }
}
