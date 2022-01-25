#!/bin/bash

rm slither.db.json
yarn slither --json slither.db.json --triage-mode

# Remove absolute paths recursively
jq -c 'walk(if type == "object" then del(.filename_absolute, .filename_used) else . end)' slither.db.json > slither.db.json.tmp

mv slither.db.json.tmp slither.db.json
