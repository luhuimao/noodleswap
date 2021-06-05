#!/bin/bash

script=./scripts/deploy-configaddress.ts
network=$1
if [[ $network = "" ]]; then
    network=hardhat
fi
if [[ $network = "hardhat" ]]; then
    script=./scripts/deploy-configaddress.ts
fi
echo npx hardhat run $script --network $network
npx hardhat run $script --network $network

# 部署完后因为地址发生了变化,必须要重新执行init-subgraph.sh
sh init-subgraph.sh $network

