#!/bin/bash
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT
nodeWaitTimeout=60
RED='\033[0;31m'
NO_COLOR='\033[0m'

main()
{
    if  [[ $1 == "fork" ]]
    then
        if [[ "$FORK" != "mainnet" && "$FORK" != "fuji" ]]; then
            echo -e "${RED} \$FORK must specify 'fuji' or 'mainnet' ${NO_COLOR}"
            exit 1
        fi

        # Fetch env variables from .env file
        ENV_FILE=.env
        source .env
        if [ ! -f "$ENV_FILE" ]; then
            echo -e "${RED} File $ENV_FILE does not exist. Have you forgotten to rename the dev.env to .env? ${NO_COLOR}"
            exit 1
        fi

        if [[ "$FORK" == "mainnet" ]]; then
            echo "Forking mainnet"
            rm -rf deployments/localhost
            cp -r deployments/mainnet-prod deployments/localhost
            export PROVIDER_URL="$MAINNET_PROVIDER_URL"
            export BLOCK_NUMBER="$MAINNET_BLOCK_NUMBER"
        elif [ "$FORK" == "fuji" ]; then
            echo "Forking fuji"
            rm -rf deployments/localhost
            cp -r deployments/fuji-prod deployments/localhost
            export PROVIDER_URL="$FUJI_PROVIDER_URL"
            export BLOCK_NUMBER="$FUJI_BLOCK_NUMBER"
        fi

        if [ -z "$PROVIDER_URL" ]; then echo "Set PROVIDER_URL" && exit 1; fi
        params=()
        params+=(--fork ${PROVIDER_URL})

        if [ -z "$BLOCK_NUMBER" ]; then
            echo "It is recommended that BLOCK_NUMBER is set to a recent block to improve performance of the fork";
        else
            params+=(--fork-block-number ${BLOCK_NUMBER})
        fi

        nodeOutput=$(mktemp "${TMPDIR:-/tmp/}$(basename 0).XXX")
        # the --no-install is here so npx doesn't download some package on its own if it can not find one in the repo
        npx --no-install hardhat node --no-reset --no-deploy --export 'deployments/network.json' ${params[@]} > $nodeOutput 2>&1 &

        echo "Node output: $nodeOutput"
        echo "Waiting for node to initialize:"
        i=0
        until grep -q -i 'Started HTTP and WebSocket JSON-RPC server ' $nodeOutput
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
        yarn deploy --network localhost --tags mocks
        FORK=$FORK npx hardhat fund --amount 10000 --network localhost --accountsfromenv true
        FORK=$FORK yarn deploy --network localhost
        cat $nodeOutput
        tail -f -n0 $nodeOutput

    else
        npx --no-install hardhat node --export 'deployments/network.json' --no-deploy
    fi
}

main "$@"
