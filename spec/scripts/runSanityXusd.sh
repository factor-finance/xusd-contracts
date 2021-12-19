certoraRun contracts/token/XUSD.sol \
  --verify XUSD:../spec/sanity.spec \
  --solc solc5.11 \
  --settings -t=300 \
  --staging origin1 --msg "XUSD Sanity"
