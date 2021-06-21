#!/bin/bash

FILE=${1##*/}
FILE=${FILE%.*}
echo $FILE

npx solc  --abi -o abis/ $1

mv abis/contracts_${FILE}_sol_${FILE}.abi abis/${FILE}.json

