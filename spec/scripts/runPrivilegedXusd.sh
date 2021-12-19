certoraRun contracts/token/XUSD.sol \
	--verify XUSD:../spec/PrivilegedXUSD.spec \
	--settings -t=300,-ignoreViewFunctions \
	--msg "XUSD Privileged"
