certoraRun ../spec/harnesses/OUSDHarness.sol contracts/vault/VaultCore.sol --verify OUSDHarness:../spec/ousd.spec --solc solc5.11 --settings -useNonLinearArithmetic,-t=300,-ignoreViewFunctions --cache ousd --staging origin1 --msg "OUSD NLA ${1}" --settings -rule=${1},-s=cvc4
