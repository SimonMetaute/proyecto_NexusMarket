@echo off
cd /d c:\Users\simon\OneDrive\Documentos\SAI\proyecto_sai\backend
node node_modules\typescript\bin\tsc --noEmit -p tsconfig.json > tsc_output.txt 2>&1
echo %ERRORLEVEL% > exit_code.txt