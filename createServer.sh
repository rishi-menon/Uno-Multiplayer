#!/bin/bash

which node > /dev/null 2>&1 && node=1 || node=0;

if [ ${node} -eq 0 ]; then
    echo "Please install node to run the local server";
else
    node sMain.js
fi

