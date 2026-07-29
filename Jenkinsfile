pipeline {
    agent any

    environment {
        SITE_NAME = "${env.BRANCH_NAME == 'uat' ? 'car-rentals-uat' : 'car_rentals'}"
        WEBROOT = "C:\\WebProject\\${SITE_NAME}"
        REVERB_APP_KEY = 'im9l8ubimmyrik9sdnhr'
        REVERB_HOST = "${env.BRANCH_NAME == 'uat' ? 'localhost' : '192.168.0.130'}"
        REVERB_PORT = "${env.BRANCH_NAME == 'uat' ? '8081' : '446'}"
        REVERB_SCHEME = "${env.BRANCH_NAME == 'uat' ? 'http' : 'https'}"
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
                bat """
                    set VITE_REVERB_APP_KEY=%REVERB_APP_KEY%
                    set VITE_REVERB_HOST=%REVERB_HOST%
                    set VITE_REVERB_PORT=%REVERB_PORT%
                    set VITE_REVERB_SCHEME=%REVERB_SCHEME%
                    npm run build
                """
            }
        }

        stage('Backup & Copy Files') {
            steps {
                bat """
                    if exist "%WEBROOT%" (
                        if exist "%WEBROOT%\\.env" copy "%WEBROOT%\\.env" "%WORKSPACE%\\.env_backup"
                        if exist "%WEBROOT%\\storage\\app" xcopy /E /I /Y "%WEBROOT%\\storage\\app" "%WORKSPACE%\\storage_app_backup\\"
                        rmdir /S /Q "%WEBROOT%"
                    )
                    xcopy /E /I /Y "." "%WEBROOT%"
                    if exist "%WORKSPACE%\\.env_backup" (
                        move /Y "%WORKSPACE%\\.env_backup" "%WEBROOT%\\.env"
                    )
                    if exist "%WORKSPACE%\\storage_app_backup" (
                        xcopy /E /I /Y "%WORKSPACE%\\storage_app_backup\\" "%WEBROOT%\\storage\\app\\"
                        rmdir /S /Q "%WORKSPACE%\\storage_app_backup"
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
                    php artisan storage:link
                    php artisan optimize
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
