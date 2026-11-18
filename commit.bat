@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==================================================
echo    Mise a jour et publication en ligne - Aqua IA
echo ==================================================
echo.

:: Verification des modifications
git status -s
echo.

set /p COMMIT_MSG="Message de mise a jour (Entree = message automatique) : "
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=chore: mise a jour du projet (%date% %time:~0,5%)
)

echo.
echo [1/3] Ajout des fichiers (git add .)...
git add .

echo [2/3] Creation du commit...
git commit -m "%COMMIT_MSG%"

echo [3/3] Envoi en ligne (git push origin main)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCES] Les modifications ont ete poussees en ligne avec succes !
) else (
    echo [ATTENTION] Une erreur ou absence de changement a ete detectee.
)
echo.
pause
