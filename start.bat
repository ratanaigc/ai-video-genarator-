@echo off
title Wan 2.1 Video AI Launcher
chcp 65001 >nul
cls
echo =========================================================================
echo       Wan 2.1 AI Video Generator (Hugging Face ZeroGPU Free)
echo =========================================================================
echo.
echo [1/2] កំពុងបើកកម្មវិធីលើ Browser (Default Browser)...
start http://localhost:8000/index.html
echo.
echo [2/2] កំពុងដំណើរការ Local Server នៅ http://localhost:8000
echo        (ចុច Ctrl+C ប្រសិនបើអ្នកចង់បិទ Server)
echo =========================================================================
echo.

python -m http.server 8000
if %errorlevel% neq 0 (
  echo Python រកមិនឃើញ, សាកល្បងដំណើរការតាមរយៈ Node npx...
  npx --yes serve -p 8000
)

pause
