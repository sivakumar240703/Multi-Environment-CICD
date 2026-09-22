pipeline {

    agent any

    parameters {

        choice(
            name: 'ENVIRONMENT',
            choices: ['DEV', 'UAT', 'PRODUCTION'],
            description: 'Select deployment environment'
        )

        choice(
            name: 'ACTION',
            choices: ['DEPLOY', 'ROLLBACK'],
            description: 'Select deployment action'
        )

        string(
            name: 'VERSION',
            defaultValue: '1.0.0',
            description: 'Application version'
        )

        choice(
            name: 'RUN_TESTS',
            choices: ['YES', 'NO'],
            description: 'Run application validation tests'
        )

        booleanParam(
            name: 'PRODUCTION_CONFIRMATION',
            defaultValue: false,
            description: 'Required for production deployment'
        )
    }

    environment {

        PROJECT_DIR = 'C:\\Users\\Administrator\\Documents\\Multi-Environment-CICD'

        DOCKER_PATH = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin'
    }

    stages {

        // ========================================
        // 1. RESOLVE ENVIRONMENT
        // ========================================

        stage('Resolve Environment') {

            steps {

                script {

                    if (params.ENVIRONMENT == 'DEV') {

                        env.TARGET_BRANCH = 'develop'
                        env.APP_CONTAINER = 'customer-app-dev'
                        env.DB_CONTAINER = 'customer-db-dev'
                        env.DOCKER_NETWORK = 'customer-dev-net'
                        env.HOST_PORT = '8081'

                    } else if (params.ENVIRONMENT == 'UAT') {

                        env.TARGET_BRANCH = 'release'
                        env.APP_CONTAINER = 'customer-app-uat'
                        env.DB_CONTAINER = 'customer-db-uat'
                        env.DOCKER_NETWORK = 'customer-uat-net'
                        env.HOST_PORT = '8082'

                    } else if (params.ENVIRONMENT == 'PRODUCTION') {

                        env.TARGET_BRANCH = 'main'
                        env.APP_CONTAINER = 'customer-app-prod'
                        env.DB_CONTAINER = 'customer-db-prod'
                        env.DOCKER_NETWORK = 'customer-prod-net'
                        env.HOST_PORT = '8083'

                    } else {

                        error("Invalid environment selected")
                    }

                    echo "========================================"
                    echo "RESOLVED DEPLOYMENT CONFIGURATION"
                    echo "========================================"
                    echo "Environment : ${params.ENVIRONMENT}"
                    echo "Action      : ${params.ACTION}"
                    echo "Version     : ${params.VERSION}"
                    echo "Run Tests   : ${params.RUN_TESTS}"
                    echo "Git Branch  : ${env.TARGET_BRANCH}"
                    echo "App         : ${env.APP_CONTAINER}"
                    echo "Database    : ${env.DB_CONTAINER}"
                    echo "Network     : ${env.DOCKER_NETWORK}"
                    echo "Host Port   : ${env.HOST_PORT}"
                    echo "========================================"
                }
            }
        }


        // ========================================
        // 2. VALIDATE PRODUCTION
        // ========================================

        stage('Validate Production Confirmation') {

            steps {

                script {

                    if (
                        params.ENVIRONMENT == 'PRODUCTION' &&
                        params.ACTION == 'DEPLOY' &&
                        params.PRODUCTION_CONFIRMATION != true
                    ) {

                        error(
                            "Production deployment requires PRODUCTION_CONFIRMATION=true"
                        )
                    }

                    echo "Production confirmation validation passed."
                }
            }
        }


        // ========================================
        // 3. CHECKOUT CORRECT BRANCH
        // ========================================

        stage('Checkout Environment Branch') {

            steps {

                script {

                    bat """
                        cd /d "%PROJECT_DIR%"

                        echo ========================================
                        echo CURRENT GIT BRANCH
                        echo ========================================

                        git branch --show-current

                        echo.
                        echo ========================================
                        echo SWITCHING TO ENVIRONMENT BRANCH
                        echo ========================================

                        git checkout ${env.TARGET_BRANCH}

                        if errorlevel 1 (
                            echo ERROR: Failed to checkout ${env.TARGET_BRANCH}
                            exit /b 1
                        )

                        echo.
                        echo ========================================
                        echo CHECKING GIT REMOTE
                        echo ========================================

                        git remote -v

                        echo.
                        echo ========================================
                        echo UPDATING BRANCH FROM REMOTE
                        echo ========================================

                        git pull origin ${env.TARGET_BRANCH}

                        if errorlevel 1 (
                            echo ERROR: Git pull failed.
                            echo Please verify that the Git remote named origin exists.
                            exit /b 1
                        )

                        echo.
                        echo ========================================
                        echo FINAL BRANCH
                        echo ========================================

                        git branch --show-current

                        echo.
                        echo ========================================
                        echo LATEST COMMIT
                        echo ========================================

                        git log -1 --oneline
                    """
                }
            }
        }


        // ========================================
        // 4. VALIDATE BRANCH
        // ========================================

        stage('Validate Branch Mapping') {

            steps {

                script {

                    bat """
                        cd /d "%PROJECT_DIR%"

                        for /f "delims=" %%B in ('git branch --show-current') do set CURRENT_BRANCH=%%B

                        echo Expected Branch: ${env.TARGET_BRANCH}
                        echo Current Branch : %CURRENT_BRANCH%

                        if /I not "%CURRENT_BRANCH%"=="${env.TARGET_BRANCH}" (
                            echo ERROR: Wrong Git branch detected.
                            exit /b 1
                        )

                        echo Branch validation successful.
                    """
                }
            }
        }


        // ========================================
        // 5. VALIDATE DOCKER
        // ========================================

        stage('Validate Docker') {

            steps {

                bat """
                    set "PATH=%DOCKER_PATH%;%PATH%"

                    echo ========================================
                    echo DOCKER PATH
                    echo ========================================

                    where docker

                    echo.
                    echo ========================================
                    echo DOCKER VERSION
                    echo ========================================

                    docker version

                    if errorlevel 1 (
                        echo ERROR: Docker is not available.
                        exit /b 1
                    )

                    echo.
                    echo ========================================
                    echo DOCKER COMPOSE VERSION
                    echo ========================================

                    docker compose version

                    if errorlevel 1 (
                        echo ERROR: Docker Compose is not available.
                        exit /b 1
                    )

                    echo.
                    echo Docker validation successful.
                """
            }
        }


        // ========================================
        // 6. SHOW VERSION / COMMIT
        // ========================================

        stage('Show Git Commit') {

            steps {

                bat """
                    cd /d "%PROJECT_DIR%"

                    echo ========================================
                    echo CURRENT COMMIT
                    echo ========================================

                    git rev-parse --short HEAD

                    echo.
                    echo ========================================
                    echo COMMIT DETAILS
                    echo ========================================

                    git log -1 --oneline

                    echo.
                    echo ========================================
                    echo GIT STATUS
                    echo ========================================

                    git status
                """
            }
        }


        // ========================================
        // 7. DEPLOY
        // ========================================

        stage('Deploy Selected Environment') {

            when {

                expression {
                    params.ACTION == 'DEPLOY'
                }
            }

            steps {

                bat """
                    set "PATH=%DOCKER_PATH%;%PATH%"

                    cd /d "%PROJECT_DIR%"

                    echo ========================================
                    echo DEPLOYING SELECTED ENVIRONMENT
                    echo ========================================

                    echo Environment : ${params.ENVIRONMENT}
                    echo App         : ${env.APP_CONTAINER}
                    echo Database    : ${env.DB_CONTAINER}
                    echo Network     : ${env.DOCKER_NETWORK}
                    echo Host Port   : ${env.HOST_PORT}

                    echo.
                    echo Starting Docker services...

                    docker compose up -d --build ${env.DB_CONTAINER} ${env.APP_CONTAINER}

                    if errorlevel 1 (
                        echo ERROR: Docker deployment failed.
                        exit /b 1
                    )

                    echo.
                    echo Docker deployment completed successfully.
                """
            }
        }


        // ========================================
        // 8. VALIDATE CONTAINERS
        // ========================================

        stage('Validate Containers') {

            when {

                expression {
                    params.ACTION == 'DEPLOY'
                }
            }

            steps {

                bat """
                    set "PATH=%DOCKER_PATH%;%PATH%"

                    echo ========================================
                    echo APPLICATION CONTAINER
                    echo ========================================

                    docker inspect ${env.APP_CONTAINER}

                    if errorlevel 1 (
                        echo ERROR: Application container not found.
                        exit /b 1
                    )

                    echo.
                    echo ========================================
                    echo DATABASE CONTAINER
                    echo ========================================

                    docker inspect ${env.DB_CONTAINER}

                    if errorlevel 1 (
                        echo ERROR: Database container not found.
                        exit /b 1
                    )

                    echo.
                    echo ========================================
                    echo RUNNING CONTAINERS
                    echo ========================================

                    docker ps

                    echo.
                    echo Container validation successful.
                """
            }
        }


        // ========================================
        // 9. VALIDATE DOCKER NETWORK
        // ========================================

        stage('Validate Docker Network') {

            when {

                expression {
                    params.ACTION == 'DEPLOY'
                }
            }

            steps {

                bat """
                    set "PATH=%DOCKER_PATH%;%PATH%"

                    echo ========================================
                    echo DOCKER NETWORK
                    echo ========================================

                    docker network inspect ${env.DOCKER_NETWORK}

                    if errorlevel 1 (
                        echo ERROR: Expected Docker network not found.
                        exit /b 1
                    )

                    echo.
                    echo Docker network validation successful.
                """
            }
        }


        // ========================================
        // 10. APPLICATION TESTS
        // ========================================

        stage('Run Application Tests') {

            when {

                expression {
                    params.ACTION == 'DEPLOY' &&
                    params.RUN_TESTS == 'YES'
                }
            }

            steps {

                bat """
                    echo ========================================
                    echo HEALTH CHECK
                    echo ========================================

                    curl --fail http://localhost:${env.HOST_PORT}/health

                    if errorlevel 1 (
                        echo ERROR: Health check failed.
                        exit /b 1
                    )

                    echo.
                    echo ========================================
                    echo VERSION CHECK
                    echo ========================================

                    curl --fail http://localhost:${env.HOST_PORT}/version

                    if errorlevel 1 (
                        echo ERROR: Version check failed.
                        exit /b 1
                    )

                    echo.
                    echo Application validation successful.
                """
            }
        }
    }


    // ========================================
    // POST ACTIONS
    // ========================================

    post {

        always {

            echo "========================================"
            echo "PIPELINE COMPLETED"
            echo "========================================"
            echo "Environment : ${params.ENVIRONMENT}"
            echo "Action      : ${params.ACTION}"
            echo "Version     : ${params.VERSION}"
            echo "Branch      : ${env.TARGET_BRANCH}"
            echo "========================================"

            bat """
                set "PATH=%DOCKER_PATH%;%PATH%"

                echo ========================================
                echo FINAL DOCKER STATUS
                echo ========================================

                docker ps
            """
        }
    }
}