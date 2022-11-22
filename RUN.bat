@echo off
cls
pm2 start index.ts -i 1 --name IRTBot
pause