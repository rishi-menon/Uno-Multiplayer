#!/bin/bash

createTunnel=1;
if [ ! $# -eq 1 ]; then
    echo "Usage: Enter port as the first argument"
    createTunnel=0
fi

node_path=""
if [ -x node_modules/.bin/lt ]; then
    node_path=node_modules/.bin/lt
else

    global_path=$(which node)

    if [ -n ${global_path} ]; then
        echo "Using global one: ${global_path}"
        node_path=${global_path}
    fi
fi

if [ -z ${node_path} ]; then
    createTunnel=0
    echo "Could not find localtunnel locally or globally. Please install the package with npm install localtunnel"
fi

if [ ${createTunnel} -eq 1 ]; then
    echo "Port: $1"
    # echo "Path: ${node_path}"
    ${node_path} --port $1 --subdomain rishi
fi

unset createTunnel
unset node_path