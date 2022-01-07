#!/bin/bash

# Runs smoke tests to verify that contract changes don't break the basic functionality.
# They can be run 2 ways:
#
# 1. With `deployid` parameter. Example: `scripts/smokeTest.sh --deployid 11`
# When this mode is used
# - all the before functions of smoke tests are ran.
# - contract upgrade specified by the `deployid` is executed
# - all the after functions of the smoke tests are ran. Verifying that the upgrade hasn't broken
#   the expected behavior
#
#
# 2. With no `deployid` parameter AKA the interactive mode.
# When this mode is used:
# - all the before functions of smoke tests are ran
# - process is waiting for user input, so user can connect to the node using hardhat console and
#   execute commands on contracts.
# - user confirms with `Enter` that the after functions of the smoke tests can continue.
# - process waits for confirmation again to repeat the process


# any child processes created by this process are killed once the main process is terminated
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT
nodeWaitTimeout=60

main()
{
    if [[ "$FORK" == "" ]]; then
      FORK="mainnet"
    fi
    if [[ "$FORK" == "fuji" ]]; then
      # cannot execute mintRedeem without whale wallets
      echo "only supports smokeTest against mainnet"
      exit 1
    fi

    SMOKE_TEST=true FORK=$FORK npx hardhat smokeTestCheck --network localhost "$@"
    if [ $? -ne 0 ]
    then
      exit 1
    fi

    nodeOutput=$(mktemp "${TMPDIR:-/tmp/}$(basename 0).XXX")
    SMOKE_TEST=true FORK=$FORK yarn run run_node:fork &> $nodeOutput &

    echo "Node output: $nodeOutput"
    echo "Waiting for node to initialize:"
    i=0
    until grep -q -i 'Started HTTP and WebSocket JSON-RPC server at' $nodeOutput
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
    echo "🟢 Node initialized running smoke tests"

    SMOKE_TEST=true FORK=$FORK npx hardhat smokeTest --network localhost "$@"
}

main "$@"
