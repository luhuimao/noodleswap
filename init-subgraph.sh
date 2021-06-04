#!/bin/bash


#truffle compile

#truffle network --clean
#truffle migrate


#sh compile.sh

#yarn 

script=./scripts/change-subgraph.ts
network=$1
if [[ $network = "" ]]; then
    network=hardhat
fi
if [[ $network = "hardhat" ]]; then
    script=./scripts/change-subgraph.ts
fi
echo npx hardhat run $script --network $network
npx hardhat run $script --network $network

yarn graph:codegen

yarn graph:create-local

yarn graph:deploy-local
