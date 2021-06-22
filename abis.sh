#!/bin/bash

FILE=${1##*/}
FILE=${FILE%.*}
echo $FILE

npx solc  --base-path contracts --abi -o abis/ $1

mv abis/*_${FILE}_sol_${FILE}.abi abis/${FILE}.json

