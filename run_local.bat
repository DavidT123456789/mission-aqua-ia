@echo off
echo ===================================
echo 🌱 Lancement de l'application Aqua IA en local...
echo ===================================
echo.

:: Vérifier si les modules Node sont installés, sinon les installer
IF NOT EXIST "node_modules\" (
    echo [Installation] Les dependances ne sont pas installees. Execution de npm install...
    call npm install
)

echo [Demarrage] Lancement du serveur de developpement...
echo Ouverture automatique du navigateur Web en cours...
call npm run dev -- --open
