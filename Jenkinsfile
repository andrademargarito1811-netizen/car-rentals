pipeline {
    agent any

    environment {
        WEBROOT = "${env.BRANCH_NAME == 'uat' ? 'C:\\inetpub\\wwwroot\\car-rentals-uat' : 'C:\\inetpub\\wwwroot\\car-rentals'}"
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

        stage('Copy Files') {
            steps {
                bat """
                    if exist "%WEBROOT%" (
                        move /Y "%WEBROOT%\\storage" "%WORKSPACE%\\storage_backup"
                        rmdir /S /Q "%WEBROOT%"
                    )
                    xcopy /E /I /Y "." "%WEBROOT%"
                    if exist "%WORKSPACE%\\storage_backup" (
                        xcopy /E /Y "%WORKSPACE%\\storage_backup\\*" "%WEBROOT%\\storage\\"
                        rmdir /S /Q "%WORKSPACE%\\storage_backup"
                    )
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

        stage('Migrate & Optimize') {
            steps {
                bat """
                    cd /d "%WEBROOT%"
                    php artisan migrate --force
                    php artisan optimize
                """
            }
        }

        stage('Restart IIS') {
            steps {
                bat 'iisreset /restart'
            }
        }
    }

    post {
        failure {
            bat """
                echo "Build failed on branch ${env.BRANCH_NAME}"
                exit /b 1
            """
        }
    }
}
