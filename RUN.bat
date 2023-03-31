@echo off
cls
cd compiled
pm2 start index.js --name IRTBot
pause