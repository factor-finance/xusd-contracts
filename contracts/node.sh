#!/bin/bash
trap "exit" INT TERM ERR
trap "kill 0" EXIT
nodeWaitTimeout=60
RED='\033[0;31m'
NO_COLOR='\033[0m'

main()
{
    rm -rf deployments/localhost
    if  [[ $1 == "fork" ]]
    then
        # Fetch env variables like PROVIDER_URL and BLOCK_NUMBER from .env file so they don't
        # need to be separately set in terminal environment
        ENV_FILE=.env
        source .env
        if [ ! -f "$ENV_FILE" ]; then
            echo -e "${RED} File $ENV_FILE does not exist. Have you forgotten to rename the dev.env to .env? ${NO_COLOR}"
            exit 1
        fi
        if [ -z "$PROVIDER_URL" ]; then echo "Set PROVIDER_URL" && exit 1; fi
        params=()
        params+=(--fork ${PROVIDER_URL})
        if [ -z "$BLOCK_NUMBER" ]; then
            echo "It is recommended that BLOCK_NUMBER is set to a recent block to improve performance of the fork";
        else
            params+=(--fork-block-number ${BLOCK_NUMBER})
        fi
        cp -r deployments/mainnet deployments/localhost

        nodeOutput=$(mktemp "${TMPDIR:-/tmp/}$(basename 0).XXX")
        # the --no-install is here so npx doesn't download some package on its own if it can not find one in the repo
        if [ -z "$GOPATH" ]; then echo "Set GOPATH and maybe install avalanchego" && exit 1; fi
        $GOPATH/src/github.com/ava-labs/avalanchego/build/avalanchego --public-ip=127.0.0.1 --snow-sample-size=2 --snow-quorum-size=2 --http-port=9650 --db-dir=db/node1 --network-id=local > $nodeOutput 2>&1 &

        echo "Node output: $nodeOutput"
        echo "Waiting for node to initialize:"
        i=0
        until grep -q -i 'HTTP API server listening on ' $nodeOutput
        do
          let i++
          printf "."
          sleep 1
          if (( i > nodeWaitTimeout )); then
            printf "\n"
            echo "$newLine Node failed to initialize in $nodeWaitTimeout seconds"
            exit 1
          fi
        done
        printf "\n"
        echo "🟢 Node initialized"

        FORK=true npx hardhat fund --amount 100000 --network localhost --accountsfromenv true &
        cat $nodeOutput
        tail -f -n0 $nodeOutput

    else
        npx --no-install hardhat node --export '../dapp/network.json'
    fi
}

main "$@"
