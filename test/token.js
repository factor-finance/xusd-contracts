const { expect } = require("chai");
const { defaultFixture } = require("./_fixture");
const { utils } = require("ethers");

const {
  daiUnits,
  xusdUnits,
  usdcUnits,
  isFork,
  loadFixture,
} = require("./helpers");

describe("Token", function () {
  if (isFork) {
    this.timeout(0);
  }

  it("Should return the token name and symbol", async () => {
    const { xusd } = await loadFixture(defaultFixture);
    expect(await xusd.name()).to.equal("XUSD");
    expect(await xusd.symbol()).to.equal("XUSD");
  });

  it("Should have 18 decimals", async () => {
    const { xusd } = await loadFixture(defaultFixture);
    expect(await xusd.decimals()).to.equal(18);
  });

  it("Should return 0 balance for the zero address", async () => {
    const { xusd } = await loadFixture(defaultFixture);
    expect(
      await xusd.balanceOf("0x0000000000000000000000000000000000000000")
    ).to.equal(0);
  });

  it("Should not allow anyone to mint XUSD directly", async () => {
    const { xusd, matt } = await loadFixture(defaultFixture);
    await expect(
      xusd.connect(matt).mint(matt.getAddress(), xusdUnits("100"))
    ).to.be.revertedWith("Caller is not the Vault");
    await expect(matt).has.a.balanceOf("100.00", xusd);
  });

  it("Should allow a simple transfer of 1 XUSD", async () => {
    const { xusd, anna, matt } = await loadFixture(defaultFixture);
    await expect(anna).has.a.balanceOf("0", xusd);
    await expect(matt).has.a.balanceOf("100", xusd);
    await xusd.connect(matt).transfer(anna.getAddress(), xusdUnits("1"));
    await expect(anna).has.a.balanceOf("1", xusd);
    await expect(matt).has.a.balanceOf("99", xusd);
  });

  it("Should allow a transferFrom with an allowance", async () => {
    const { xusd, anna, matt } = await loadFixture(defaultFixture);
    // Approve XUSD for transferFrom
    await xusd.connect(matt).approve(anna.getAddress(), xusdUnits("1000"));
    expect(
      await xusd.allowance(await matt.getAddress(), await anna.getAddress())
    ).to.equal(xusdUnits("1000"));

    // Do a transferFrom of XUSD
    await xusd
      .connect(anna)
      .transferFrom(
        await matt.getAddress(),
        await anna.getAddress(),
        xusdUnits("1")
      );

    // Anna should have the dollar
    await expect(anna).has.a.balanceOf("1", xusd);

    // Check if it has reflected in allowance
    expect(
      await xusd.allowance(await matt.getAddress(), await anna.getAddress())
    ).to.equal(xusdUnits("999"));
  });

  it("Should transfer the correct amount from a rebasing account to a non-rebasing account and set creditsPerToken", async () => {
    let { xusd, vault, matt, usdc, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );

    // Give contract 100 XUSD from Josh
    await xusd
      .connect(josh)
      .transfer(mockNonRebasing.address, xusdUnits("100"));

    await expect(matt).has.an.approxBalanceOf("100.00", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("100.00", xusd);

    const contractCreditsPerToken = await xusd.creditsBalanceOf(
      mockNonRebasing.address
    );

    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();

    // Credits per token should be the same for the contract
    contractCreditsPerToken ===
      (await xusd.creditsBalanceOf(mockNonRebasing.address));

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should transfer the correct amount from a rebasing account to a non-rebasing account with previously set creditsPerToken", async () => {
    let { xusd, vault, matt, usdc, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    await xusd
      .connect(josh)
      .transfer(mockNonRebasing.address, xusdUnits("100"));
    await expect(matt).has.an.approxBalanceOf("100.00", xusd);
    await expect(josh).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("100.00", xusd);
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    // Matt received all the yield
    await expect(matt).has.an.approxBalanceOf("300.00", xusd);
    // Give contract 100 XUSD from Matt
    await xusd.connect(matt).transfer(mockNonRebasing.address, xusdUnits("50"));
    await expect(matt).has.an.approxBalanceOf("250", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("150.00", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should transfer the correct amount from a non-rebasing account without previously set creditssPerToken to a rebasing account", async () => {
    let { xusd, matt, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Give contract 100 XUSD from Josh
    await xusd
      .connect(josh)
      .transfer(mockNonRebasing.address, xusdUnits("100"));
    await expect(matt).has.an.approxBalanceOf("100.00", xusd);
    await expect(josh).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("100.00", xusd);
    await mockNonRebasing.transfer(await matt.getAddress(), xusdUnits("100"));
    await expect(matt).has.an.approxBalanceOf("200.00", xusd);
    await expect(josh).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("0", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should transfer the correct amount from a non-rebasing account with previously set creditsPerToken to a rebasing account", async () => {
    let { xusd, vault, matt, usdc, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Give contract 100 XUSD from Josh
    await xusd
      .connect(josh)
      .transfer(mockNonRebasing.address, xusdUnits("100"));
    await expect(matt).has.an.approxBalanceOf("100.00", xusd);
    await expect(josh).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("100.00", xusd);
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    // Matt received all the yield
    await expect(matt).has.an.approxBalanceOf("300.00", xusd);
    // Give contract 100 XUSD from Matt
    await xusd.connect(matt).transfer(mockNonRebasing.address, xusdUnits("50"));
    await expect(matt).has.an.approxBalanceOf("250", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("150.00", xusd);
    // Transfer contract balance to Josh
    await mockNonRebasing.transfer(await josh.getAddress(), xusdUnits("150"));
    await expect(matt).has.an.approxBalanceOf("250", xusd);
    await expect(josh).has.an.approxBalanceOf("150", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("0", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should transfer the correct amount from a non-rebasing account to a non-rebasing account with different previously set creditsPerToken", async () => {
    let { xusd, vault, matt, usdc, josh, mockNonRebasing, mockNonRebasingTwo } =
      await loadFixture(defaultFixture);
    // Give contract 100 XUSD from Josh
    await xusd.connect(josh).transfer(mockNonRebasing.address, xusdUnits("50"));
    await expect(mockNonRebasing).has.an.approxBalanceOf("50.00", xusd);
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    await xusd
      .connect(josh)
      .transfer(mockNonRebasingTwo.address, xusdUnits("50"));
    await usdc.connect(matt).transfer(vault.address, usdcUnits("100"));
    await vault.rebase();
    await mockNonRebasing.transfer(mockNonRebasingTwo.address, xusdUnits("10"));
    await expect(mockNonRebasing).has.an.approxBalanceOf("40", xusd);
    await expect(mockNonRebasingTwo).has.an.approxBalanceOf("60", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const creditBalanceMockNonRebasing = await xusd.creditsBalanceOf(
      mockNonRebasing.address
    );
    const balanceMockNonRebasing = creditBalanceMockNonRebasing[0]
      .mul(utils.parseUnits("1", 18))
      .div(creditBalanceMockNonRebasing[1]);
    const creditBalanceMockNonRebasingTwo = await xusd.creditsBalanceOf(
      mockNonRebasingTwo.address
    );
    const balanceMockNonRebasingTwo = creditBalanceMockNonRebasingTwo[0]
      .mul(utils.parseUnits("1", 18))
      .div(creditBalanceMockNonRebasingTwo[1]);

    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(balanceMockNonRebasing)
      .add(balanceMockNonRebasingTwo);

    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should transferFrom the correct amount from a rebasing account to a non-rebasing account and set creditsPerToken", async () => {
    let { xusd, vault, matt, usdc, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Give Josh an allowance to move Matt's XUSD
    await xusd
      .connect(matt)
      .increaseAllowance(await josh.getAddress(), xusdUnits("100"));
    // Give contract 100 XUSD from Matt via Josh
    await xusd
      .connect(josh)
      .transferFrom(
        await matt.getAddress(),
        mockNonRebasing.address,
        xusdUnits("100")
      );
    await expect(matt).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("100.00", xusd);
    const contractCreditsPerToken = await xusd.creditsBalanceOf(
      mockNonRebasing.address
    );
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    // Credits per token should be the same for the contract
    contractCreditsPerToken ===
      (await xusd.creditsBalanceOf(mockNonRebasing.address));

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should transferFrom the correct amount from a rebasing account to a non-rebasing account with previously set creditsPerToken", async () => {
    let { xusd, vault, matt, usdc, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Give Josh an allowance to move Matt's XUSD
    await xusd
      .connect(matt)
      .increaseAllowance(await josh.getAddress(), xusdUnits("150"));
    // Give contract 100 XUSD from Matt via Josh
    await xusd
      .connect(josh)
      .transferFrom(
        await matt.getAddress(),
        mockNonRebasing.address,
        xusdUnits("50")
      );
    await expect(matt).has.an.approxBalanceOf("50", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("50", xusd);
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    // Give contract 50 more XUSD from Matt via Josh
    await xusd
      .connect(josh)
      .transferFrom(
        await matt.getAddress(),
        mockNonRebasing.address,
        xusdUnits("50")
      );
    await expect(mockNonRebasing).has.an.approxBalanceOf("100", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should transferFrom the correct amount from a non-rebasing account without previously set creditsPerToken to a rebasing account", async () => {
    let { xusd, matt, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Give contract 100 XUSD from Josh
    await xusd
      .connect(josh)
      .transfer(mockNonRebasing.address, xusdUnits("100"));
    await expect(matt).has.an.approxBalanceOf("100.00", xusd);
    await expect(josh).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("100.00", xusd);
    await mockNonRebasing.increaseAllowance(
      await matt.getAddress(),
      xusdUnits("100")
    );

    await xusd
      .connect(matt)
      .transferFrom(
        mockNonRebasing.address,
        await matt.getAddress(),
        xusdUnits("100")
      );
    await expect(matt).has.an.approxBalanceOf("200.00", xusd);
    await expect(josh).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("0", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should transferFrom the correct amount from a non-rebasing account with previously set creditsPerToken to a rebasing account", async () => {
    let { xusd, vault, matt, usdc, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Give contract 100 XUSD from Josh
    await xusd
      .connect(josh)
      .transfer(mockNonRebasing.address, xusdUnits("100"));
    await expect(matt).has.an.approxBalanceOf("100.00", xusd);
    await expect(josh).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("100.00", xusd);
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    // Matt received all the yield
    await expect(matt).has.an.approxBalanceOf("300.00", xusd);
    // Give contract 100 XUSD from Matt
    await xusd.connect(matt).transfer(mockNonRebasing.address, xusdUnits("50"));
    await expect(matt).has.an.approxBalanceOf("250", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("150.00", xusd);
    // Transfer contract balance to Josh
    await mockNonRebasing.increaseAllowance(
      await matt.getAddress(),
      xusdUnits("150")
    );

    await xusd
      .connect(matt)
      .transferFrom(
        mockNonRebasing.address,
        await matt.getAddress(),
        xusdUnits("150")
      );

    await expect(matt).has.an.approxBalanceOf("400", xusd);
    await expect(josh).has.an.approxBalanceOf("0", xusd);
    await expect(mockNonRebasing).has.an.approxBalanceOf("0", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should maintain the correct balances when rebaseOptIn is called from non-rebasing contract", async () => {
    let { xusd, vault, matt, usdc, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Give contract 99.50 XUSD from Josh
    // This will set a nonrebasingCreditsPerTokenHighres for this account
    await xusd
      .connect(josh)
      .transfer(mockNonRebasing.address, xusdUnits("99.50"));

    const initialRebasingCredits = await xusd.rebasingCreditsHighres();
    const initialTotalSupply = await xusd.totalSupply();

    await expect(mockNonRebasing).has.an.approxBalanceOf("99.50", xusd);
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();

    const totalSupplyBefore = await xusd.totalSupply();
    await expect(mockNonRebasing).has.an.approxBalanceOf("99.50", xusd);
    await mockNonRebasing.rebaseOptIn();
    await expect(mockNonRebasing).has.an.approxBalanceOf("99.50", xusd);
    expect(await xusd.totalSupply()).to.equal(totalSupplyBefore);

    const rebasingCredits = await xusd.rebasingCreditsHighres();
    const rebasingCreditsPerTokenHighres =
      await xusd.rebasingCreditsPerTokenHighres();

    const creditsAdded = xusdUnits("99.50")
      .mul(rebasingCreditsPerTokenHighres)
      .div(utils.parseUnits("1", 18));

    await expect(rebasingCredits).to.equal(
      initialRebasingCredits.add(creditsAdded)
    );

    expect(await xusd.totalSupply()).to.approxEqual(
      initialTotalSupply.add(utils.parseUnits("200", 18))
    );

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should maintain the correct balance when rebaseOptOut is called from rebasing EOA", async () => {
    let { xusd, vault, matt, usdc } = await loadFixture(defaultFixture);
    await expect(matt).has.an.approxBalanceOf("100.00", xusd);
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    const totalSupplyBefore = await xusd.totalSupply();

    const initialRebasingCredits = await xusd.rebasingCreditsHighres();
    const initialrebasingCreditsPerTokenHighres =
      await xusd.rebasingCreditsPerTokenHighres();

    await xusd.connect(matt).rebaseOptOut();
    // Received 100 from the rebase, the 200 simulated yield was split between
    // Matt and Josh
    await expect(matt).has.an.approxBalanceOf("200.00", xusd);

    const rebasingCredits = await xusd.rebasingCreditsHighres();

    const creditsDeducted = xusdUnits("200")
      .mul(initialrebasingCreditsPerTokenHighres)
      .div(utils.parseUnits("1", 18));

    await expect(rebasingCredits).to.equal(
      initialRebasingCredits.sub(creditsDeducted)
    );

    expect(await xusd.totalSupply()).to.equal(totalSupplyBefore);
  });

  it("Should not allow EOA to call rebaseOptIn when already opted in to rebasing", async () => {
    let { xusd, matt } = await loadFixture(defaultFixture);
    await expect(xusd.connect(matt).rebaseOptIn()).to.be.revertedWith(
      "Account has not opted out"
    );
  });

  it("Should not allow EOA to call rebaseOptOut when already opted out of rebasing", async () => {
    let { xusd, matt } = await loadFixture(defaultFixture);
    await xusd.connect(matt).rebaseOptOut();
    await expect(xusd.connect(matt).rebaseOptOut()).to.be.revertedWith(
      "Account has not opted in"
    );
  });

  it("Should not allow contract to call rebaseOptIn when already opted in to rebasing", async () => {
    let { mockNonRebasing } = await loadFixture(defaultFixture);
    await mockNonRebasing.rebaseOptIn();
    await expect(mockNonRebasing.rebaseOptIn()).to.be.revertedWith(
      "Account has not opted out"
    );
  });

  it("Should not allow contract to call rebaseOptOut when already opted out of rebasing", async () => {
    let { mockNonRebasing } = await loadFixture(defaultFixture);
    await expect(mockNonRebasing.rebaseOptOut()).to.be.revertedWith(
      "Account has not opted in"
    );
  });

  it("Should maintain the correct balance on a partial transfer for a non-rebasing account without previously set creditsPerToken", async () => {
    let { xusd, matt, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Opt in to rebase so contract doesn't set a fixed creditsPerToken for the contract
    await mockNonRebasing.rebaseOptIn();
    // Give contract 100 XUSD from Josh
    await xusd
      .connect(josh)
      .transfer(mockNonRebasing.address, xusdUnits("100"));
    await expect(mockNonRebasing).has.an.approxBalanceOf("100", xusd);
    await xusd.connect(matt).rebaseOptOut();
    // Transfer will cause a fixed creditsPerToken to be set for mockNonRebasing
    await mockNonRebasing.transfer(await matt.getAddress(), xusdUnits("50"));
    await expect(mockNonRebasing).has.an.approxBalanceOf("50", xusd);
    await expect(matt).has.an.approxBalanceOf("150", xusd);
    await mockNonRebasing.transfer(await matt.getAddress(), xusdUnits("25"));
    await expect(mockNonRebasing).has.an.approxBalanceOf("25", xusd);
    await expect(matt).has.an.approxBalanceOf("175", xusd);
  });

  it("Should maintain the same totalSupply on many transfers between different account types", async () => {
    let { xusd, matt, josh, mockNonRebasing, mockNonRebasingTwo } =
      await loadFixture(defaultFixture);

    // Only Matt and Josh have XUSD, give some to contracts
    await xusd.connect(josh).transfer(mockNonRebasing.address, xusdUnits("50"));
    await xusd
      .connect(matt)
      .transfer(mockNonRebasingTwo.address, xusdUnits("50"));

    // Set up accounts
    await xusd.connect(josh).rebaseOptOut();
    const nonRebasingEOA = josh;
    const rebasingEOA = matt;
    const nonRebasingContract = mockNonRebasing;
    await mockNonRebasingTwo.rebaseOptIn();
    const rebasingContract = mockNonRebasingTwo;

    const allAccounts = [
      nonRebasingEOA,
      rebasingEOA,
      nonRebasingContract,
      rebasingContract,
    ];

    const initialTotalSupply = await xusd.totalSupply();
    for (let i = 0; i < 10; i++) {
      for (const fromAccount of allAccounts) {
        const toAccount =
          allAccounts[Math.floor(Math.random() * allAccounts.length)];

        if (typeof fromAccount.transfer === "function") {
          // From account is a contract
          await fromAccount.transfer(
            toAccount.address,
            (await xusd.balanceOf(fromAccount.address)).div(2)
          );
        } else {
          // From account is a EOA
          await xusd
            .connect(fromAccount)
            .transfer(
              toAccount.address,
              (await xusd.balanceOf(fromAccount.address)).div(2)
            );
        }

        await expect(await xusd.totalSupply()).to.equal(initialTotalSupply);
      }
    }
  });

  it("Should revert a transferFrom if an allowance is insufficient", async () => {
    const { xusd, anna, matt } = await loadFixture(defaultFixture);
    // Approve XUSD for transferFrom
    await xusd.connect(matt).approve(anna.getAddress(), xusdUnits("10"));
    expect(
      await xusd.allowance(await matt.getAddress(), await anna.getAddress())
    ).to.equal(xusdUnits("10"));

    // Do a transferFrom of XUSD
    await expect(
      xusd
        .connect(anna)
        .transferFrom(
          await matt.getAddress(),
          await anna.getAddress(),
          xusdUnits("100")
        )
    ).to.be.revertedWith(
      "Arithmetic operation underflowed or overflowed outside of an unchecked block"
    );
  });

  it("Should allow to increase/decrease allowance", async () => {
    const { xusd, anna, matt } = await loadFixture(defaultFixture);
    // Approve XUSD
    await xusd.connect(matt).approve(anna.getAddress(), xusdUnits("1000"));
    expect(
      await xusd.allowance(await matt.getAddress(), await anna.getAddress())
    ).to.equal(xusdUnits("1000"));

    // Decrease allowance
    await xusd
      .connect(matt)
      .decreaseAllowance(await anna.getAddress(), xusdUnits("100"));
    expect(
      await xusd.allowance(await matt.getAddress(), await anna.getAddress())
    ).to.equal(xusdUnits("900"));

    // Increase allowance
    await xusd
      .connect(matt)
      .increaseAllowance(await anna.getAddress(), xusdUnits("20"));
    expect(
      await xusd.allowance(await matt.getAddress(), await anna.getAddress())
    ).to.equal(xusdUnits("920"));

    // Decrease allowance more than what's there
    await xusd
      .connect(matt)
      .decreaseAllowance(await anna.getAddress(), xusdUnits("950"));
    expect(
      await xusd.allowance(await matt.getAddress(), await anna.getAddress())
    ).to.equal(xusdUnits("0"));
  });

  it("Should increase users balance on supply increase", async () => {
    const { xusd, usdc, vault, anna, matt } = await loadFixture(defaultFixture);
    // Transfer 1 to Anna, so we can check different amounts
    await xusd.connect(matt).transfer(anna.getAddress(), xusdUnits("1"));
    await expect(matt).has.a.balanceOf("99", xusd);
    await expect(anna).has.a.balanceOf("1", xusd);

    // Increase total supply thus increasing all user's balances
    await usdc.connect(matt).mint(usdcUnits("2"));
    await usdc.connect(matt).transfer(vault.address, usdcUnits("2"));
    await vault.rebase();

    // Contract originally contained $200, now has $202.
    // Matt should have (99/200) * 202 XUSD
    await expect(matt).has.a.balanceOf("99.99", xusd);
    // Anna should have (1/200) * 202 XUSD
    await expect(anna).has.a.balanceOf("1.01", xusd);
  });

  it("Should mint correct amounts on non-rebasing account without previously set creditsPerToken", async () => {
    let { xusd, dai, vault, josh, mockNonRebasing } = await loadFixture(
      defaultFixture
    );
    // Give contract 100 DAI from Josh
    await dai.connect(josh).transfer(mockNonRebasing.address, daiUnits("100"));
    await expect(mockNonRebasing).has.a.balanceOf("0", xusd);
    const totalSupplyBefore = await xusd.totalSupply();
    await mockNonRebasing.approveFor(
      dai.address,
      vault.address,
      daiUnits("100")
    );
    await mockNonRebasing.mintXusd(vault.address, dai.address, daiUnits("50"));
    await expect(await xusd.totalSupply()).to.equal(
      totalSupplyBefore.add(xusdUnits("50"))
    );

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    await expect(await xusd.nonRebasingSupply()).to.approxEqual(
      xusdUnits("50")
    );
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should mint correct amounts on non-rebasing account with previously set creditsPerToken", async () => {
    let { xusd, dai, vault, matt, usdc, josh, mockNonRebasing } =
      await loadFixture(defaultFixture);
    // Give contract 100 DAI from Josh
    await dai.connect(josh).transfer(mockNonRebasing.address, daiUnits("100"));
    await expect(mockNonRebasing).has.a.balanceOf("0", xusd);
    const totalSupplyBefore = await xusd.totalSupply();
    await mockNonRebasing.approveFor(
      dai.address,
      vault.address,
      daiUnits("100")
    );
    await mockNonRebasing.mintXusd(vault.address, dai.address, daiUnits("50"));
    await expect(await xusd.totalSupply()).to.equal(
      totalSupplyBefore.add(xusdUnits("50"))
    );
    const contractCreditsBalanceOf = await xusd.creditsBalanceOf(
      mockNonRebasing.address
    );
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    // After the initial transfer and the rebase the contract address has a
    // separate and different creditsPerToken to the global one
    expect(
      (await xusd.creditsBalanceOf(await josh.getAddress()))[1]
    ).to.not.equal(contractCreditsBalanceOf[1]);
    // Mint again
    await mockNonRebasing.mintXusd(vault.address, dai.address, daiUnits("50"));
    await expect(await xusd.totalSupply()).to.equal(
      // Note 200 additional from simulated yield
      totalSupplyBefore.add(xusdUnits("100")).add(xusdUnits("200"))
    );
    await expect(mockNonRebasing).has.a.balanceOf("100", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    await expect(await xusd.nonRebasingSupply()).to.approxEqual(
      xusdUnits("100")
    );
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should burn the correct amount for non-rebasing account", async () => {
    let { xusd, dai, vault, matt, usdc, josh, mockNonRebasing } =
      await loadFixture(defaultFixture);
    // Give contract 100 DAI from Josh
    await dai.connect(josh).transfer(mockNonRebasing.address, daiUnits("100"));
    await expect(mockNonRebasing).has.a.balanceOf("0", xusd);
    const totalSupplyBefore = await xusd.totalSupply();
    await mockNonRebasing.approveFor(
      dai.address,
      vault.address,
      daiUnits("100")
    );
    await mockNonRebasing.mintXusd(vault.address, dai.address, daiUnits("50"));
    await expect(await xusd.totalSupply()).to.equal(
      totalSupplyBefore.add(xusdUnits("50"))
    );
    const contractCreditsBalanceOf = await xusd.creditsBalanceOf(
      mockNonRebasing.address
    );
    // Transfer USDC into the Vault to simulate yield
    await usdc.connect(matt).transfer(vault.address, usdcUnits("200"));
    await vault.rebase();
    // After the initial transfer and the rebase the contract address has a
    // separate and different creditsPerToken to the global one
    expect(
      (await xusd.creditsBalanceOf(await josh.getAddress()))[1]
    ).to.not.equal(contractCreditsBalanceOf[1]);
    // Burn XUSD
    await mockNonRebasing.redeemXusd(vault.address, xusdUnits("25"));
    await expect(await xusd.totalSupply()).to.equal(
      // Note 200 from simulated yield
      totalSupplyBefore.add(xusdUnits("225"))
    );
    await expect(mockNonRebasing).has.a.balanceOf("25", xusd);

    // Validate rebasing and non rebasing credit accounting by calculating'
    // total supply manually
    await expect(await xusd.nonRebasingSupply()).to.approxEqual(
      xusdUnits("25")
    );
    const calculatedTotalSupply = (await xusd.rebasingCreditsHighres())
      .mul(utils.parseUnits("1", 18))
      .div(await xusd.rebasingCreditsPerTokenHighres())
      .add(await xusd.nonRebasingSupply());
    await expect(calculatedTotalSupply).to.approxEqual(
      await xusd.totalSupply()
    );
  });

  it("Should exact transfer to new contract accounts", async () => {
    let { xusd, vault, matt, usdc, mockNonRebasing } = await loadFixture(
      defaultFixture
    );

    // Add yield to so we need higher resolution
    await usdc.connect(matt).mint(usdcUnits("9671.2345"));
    await usdc.connect(matt).transfer(vault.address, usdcUnits("9671.2345"));
    await vault.rebase();

    // Helper to verify balance-exact transfers in
    const checkTransferIn = async (amount) => {
      const beforeReceiver = await xusd.balanceOf(mockNonRebasing.address);
      await xusd.connect(matt).transfer(mockNonRebasing.address, amount);
      const afterReceiver = await xusd.balanceOf(mockNonRebasing.address);
      expect(beforeReceiver.add(amount)).to.equal(afterReceiver);
    };

    // Helper to verify balance-exact transfers out
    const checkTransferOut = async (amount) => {
      const beforeReceiver = await xusd.balanceOf(mockNonRebasing.address);
      await mockNonRebasing.transfer(matt.address, amount);
      const afterReceiver = await xusd.balanceOf(mockNonRebasing.address);
      expect(beforeReceiver.sub(amount)).to.equal(afterReceiver);
    };

    // In
    await checkTransferIn(1);
    await checkTransferIn(2);
    await checkTransferIn(5);
    await checkTransferIn(9);
    await checkTransferIn(100);
    await checkTransferIn(2);
    await checkTransferIn(5);
    await checkTransferIn(9);

    // Out
    await checkTransferOut(1);
    await checkTransferOut(2);
    await checkTransferOut(5);
    await checkTransferOut(9);
    await checkTransferOut(100);
    await checkTransferOut(2);
    await checkTransferOut(5);
    await checkTransferOut(9);
  });
});
