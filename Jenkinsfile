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

        stage('Stop Nginx & PHP') {
            steps {
                powershell """
                    Write-Output "Stopping nginx..."
                    Get-Service -Name "nginx" -ErrorAction SilentlyContinue | Stop-Service -Force
                    Get-Process -Name "nginx" -ErrorAction SilentlyContinue | Stop-Process -Force
                    Write-Output "Stopping PHP-FPM..."
                    Get-Service -Name "php*" -ErrorAction SilentlyContinue | Stop-Service -Force
                    Get-Process -Name "php*" -ErrorAction SilentlyContinue | Stop-Process -Force
                """
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

        stage('Migrate & Optimize') {
            steps {
                bat """
                    cd /d "%WEBROOT%"
                    php artisan migrate --force
                    php artisan optimize
                """
            }
        }

        stage('Start Nginx & PHP') {
            steps {
                powershell """
                    Write-Output "Starting PHP-FPM..."
                    $phpService = Get-Service -Name "php*" -ErrorAction SilentlyContinue
                    if ($phpService) {
                        Start-Service -Name $phpService.Name
                    } else {
                        Write-Output "PHP service not found, please start PHP-FPM manually"
                    }
                    Write-Output "Starting nginx..."
                    $nginxService = Get-Service -Name "nginx" -ErrorAction SilentlyContinue
                    if ($nginxService) {
                        Start-Service -Name "nginx"
                    } else {
                        Write-Output "nginx service not found, please start nginx manually"
                    }
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
