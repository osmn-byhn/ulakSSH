#!/bin/bash
cd /home/shiyakami/Apps/ulakSSH
echo "Starting final build with external links..." > final_build.log
npm run build >> final_build.log 2>&1
echo "Build finished with exit code $?" >> final_build.log
