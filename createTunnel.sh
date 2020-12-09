#!/bin/bash

createTunnel=1;
if [ $# -lt 1 ] || [ $# -gt 2 ]; then
    echo "Usage: createTunnel.sh portNumber [domain name request]"
    echo "   portNumber  : (required) port number to connect to (enter 3000)"
    echo "   domain name : (optional) name for the url to request from localTunnel"
    echo "Example: ./createTunnel.sh 3000 jane"
    
    createTunnel=0
fi

node_path=""
if [ -x node_modules/.bin/lt ]; then
    node_path=node_modules/.bin/lt
else

    global_path=$(which lt)

    if [ -n ${global_path} ]; then
        echo "Using global one: ${global_path}"
        node_path=${global_path}
    fi
fi

if [ -z ${node_path} ]; then
    createTunnel=0
    echo "Could not find localtunnel locally or globally. Please install the package by running \'npm install localtunnel\'"
fi

if [ ${createTunnel} -eq 1 ]; then
    echo "Port: $1"
    # echo "Path: ${node_path}"
    subdomainName=$2
    if [ -z ${subdomainName} ]; then
        subdomainName="jane"
    fi
    ${node_path} --port $1 --subdomain ${subdomainName}
fi

unset createTunnel
unset node_path