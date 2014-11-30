#!/bin/bash

installDir=$1
echo "installDir: $installDir"

echo ""
echo "Clean files in log/ 30+ days old"
# print0 and -0 are for spaces in filenames
find $installDir/log -mtime +30 -type f -print0 | xargs -0 rm

