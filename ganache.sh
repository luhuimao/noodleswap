#!/bin/bash

sudo docker run -d -p 8545:8545 trufflesuite/ganache-cli --allowUnlimitedContractSize --db .data3
