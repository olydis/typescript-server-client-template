@echo off

set dbpath="%~dp0\src\backend\db\data"
if not exist "%dbpath%" mkdir "%dbpath%"
echo Starting database at %dbpath%
"%~dp0\src\backend\db\mongod" --dbpath "%dbpath%" --bind_ip 0.0.0.0
