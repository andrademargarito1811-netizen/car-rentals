pipeline {
    agent any

    environment {
        SITE_NAME = "${env.BRANCH_NAME == 'uat' ? 'car-rentals-uat' : 'car-rentals'}"
        WEBROOT = "C:\\inetpub\\wwwroot\\${SITE_NAME}"
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

        stage('Stop IIS Site') {
            steps {
                powershell """
                    if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
                        Write-Output "WebAdministration module not available - installing IIS PowerShell feature..."
                        Install-WindowsFeature -Name Web-Scripting-Tools -IncludeManagementTools
                    }
                    Import-Module WebAdministration
                    if (Get-Website -Name "$env:SITE_NAME" | Where-Object { \$_.state -eq 'Started' }) {
                        Stop-Website -Name "$env:SITE_NAME"
                        Stop-WebAppPool -Name "$env:SITE_NAME"
                    }
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
                    icacls "%WEBROOT%\\storage" /grant "IIS_IUSRS:(OI)(CI)M" /Q
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

        stage('Start IIS Site') {
            steps {
                powershell """
                    if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
                        Write-Output "WebAdministration module not available - installing IIS PowerShell feature..."
                        Install-WindowsFeature -Name Web-Scripting-Tools -IncludeManagementTools
                    }
                    Import-Module WebAdministration
                    Start-WebAppPool -Name "$env:SITE_NAME"
                    Start-Website -Name "$env:SITE_NAME"
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
