@echo off
echo ===================================
echo    Lancement de l'application Aqua IA en local...
echo ===================================
echo.

:: Vérifier si les modules Node sont installés, sinon les installer
IF NOT EXIST "node_modules\" (
    echo [Installation] Les dependances ne sont pas installees. Execution de npm install...
    call npm install
)

:: Vérifier que le fichier .env.local existe avec la clé API
IF NOT EXIST ".env.local" (
    echo.
    echo [ATTENTION] Le fichier .env.local n'existe pas !
    echo Creez un fichier .env.local avec votre cle API Gemini :
    echo    GEMINI_API_KEY=votre_cle_ici
    echo.
    echo Vous pouvez obtenir une cle gratuite sur : https://aistudio.google.com/apikey
    echo.
    pause
    exit /b 1
)

echo [Demarrage] Lancement du serveur de developpement...
echo Le navigateur va s'ouvrir automatiquement dans quelques secondes...

:: Ouvrir le navigateur après un court délai (3 secondes)
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Lancer le serveur Express + Vite
call npm run dev
