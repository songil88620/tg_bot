import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, Route } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { etherScanKey_1, etherScanKey_2, factoryAddress, holdingApi, holdingKey, routerAddress, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { TelegramService } from 'src/telegram/telegram.service';
import { LogService } from 'src/log/log.service';
import axios from 'axios';
import { BotService } from 'src/bot/bot.service';
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { whatsabi } from "@shazow/whatsabi";
import { UnitradeService } from 'src/unitrade/unitrade.service';

@Injectable()
export class SwapService implements OnModuleInit {

    public provider: any;

    constructor(
        @Inject(forwardRef(() => TelegramService)) private telegramService: TelegramService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => LogService)) private logService: LogService,
        @Inject(forwardRef(() => LogService)) private botService: BotService,
        @Inject(forwardRef(() => UnitradeService)) private unitradeService: UnitradeService,
    ) { }

    async onModuleInit() {
        console.log(">>>swap module init")
        // const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your_infura_project_id'); 
        this.provider= new ethers.providers.JsonRpcProvider('https://eth-mainnet.nodereal.io/v1/f3b37cc49d3948f5827621b8c2e0bdb3')
        // this.provider = new ethers.providers.EtherscanProvider("homestead", etherScanKey_1)


    }

    async testPair() {
        const DAI = new Token(ChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6)
        const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId])
        const route = new Route([pair], WETH[DAI.chainId])
        const rate = route.midPrice.toSignificant(6)
        console.log(">>>R", rate)
    }

    async getMethodIds(contractAddress: string) {
        try {
            const code = await this.provider.getCode(contractAddress);
            const contractABI: any = whatsabi.abiFromBytecode(code);
            var ids: any[] = []
            for (const item of contractABI) {
                if (item.type == "function") {
                    ids.push(item.selector)
                }
            }
            const res = await axios.get('https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=' + contractAddress + '&apikey=' + etherScanKey_2)
            const owner = res.data['result'][0]['contractCreator']
            return { status: true, abi: contractABI, methods: ids, owner }
        } catch (e) {
            console.log(">>>swap err", e.message)
            return { status: false, abi: [], methods: [], owner: "" }
        }
    }

    async getPairPriceRate(tokenAddress: string) {
        try {
            const token: Token = await Fetcher.fetchTokenData(1, tokenAddress)
            const pair = await Fetcher.fetchPairData(token, WETH[token.chainId])
            const route = new Route([pair], WETH[token.chainId])
            const rate = route.midPrice.toSignificant(6)
            console.log(">>RRRR", rate)
            return rate
        } catch (e) {
            console.log(">>>swap err price", e.message)
        }
    }

    async getHoldingList(address: string) {
        try {
            const res = await axios.get(holdingApi + address + '&page=1&offset=100&apikey=' + holdingKey);
            if (res.data.status) {
                var holds = res.data.result;
                var holding = [];
                for (var i = 0; i < holds.length; i++) {
                    const price = await this.botService.getPairPrice(holds[i].TokenAddress)
                    const amount = Number(ethers.utils.formatUnits(holds[i].TokenQuantity)) * price.price;
                    holding.push({
                        TokenAddress: holds[i].TokenAddress,
                        TokenName: holds[i].TokenName,
                        TokenSymbol: holds[i].TokenSymbol,
                        TokenQuantity: holds[i].TokenQuantity,
                        TokenDivisor: holds[i].TokenDivisor,
                        amount: amount
                    })
                }
                return { status: true, data: holding };
            } else {
                return { status: false, data: res.data.result };
            }
        } catch (e) {
            console.log(">>>swap err price", e.message)
            return { status: false, data: "" }
        }
    }

    async getBalance(tokenAddress: string, walletAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            const supply = await tokenContract.totalSupply();
            const token_balance = await tokenContract.balanceOf(walletAddress)
            const eth_balance = await this.provider.getBalance(walletAddress)
        } catch (e) {
            console.log(">>>swap err price", e.message)
        }
    }

    async transferTo(tokenAddress: string, recieverAddress: string, amount: string, privatekey: string, userId: string, panel: number, target: string) {
        try {
            const wallet = new ethers.Wallet(privatekey, this.provider);
            if (tokenAddress != wethAddress) {
                const token: Token = await Fetcher.fetchTokenData(1, tokenAddress)
                const decimal = token.decimals;
                const amountTo = ethers.utils.parseUnits(amount.toString(), decimal);
                const tokenAContract = new ethers.Contract(tokenAddress, standardABI, wallet);
                const tr = await tokenAContract.transfer(recieverAddress, amountTo);
                const res = await tr.wait();
                if (res.status) {
                    const hash = res.transactionHash;
                    if (panel == 0) {
                        this.telegramService.sendNotification(userId, "Transfer success.");
                        this.telegramService.sendNotification(userId, 'https://etherscan.io/tx/' + hash)
                    }
                    const log = {
                        id: userId,
                        mode: 'transfer-' + target,
                        hash: hash,
                        panel: panel,
                        tokenA: token,
                        tokenB: recieverAddress,
                        amount,
                        t_amount: 0,
                        created: this.currentTime(),
                        createdat: Date.now(),
                        other: ""
                    }
                    this.logService.create(log)

                    return { status: true, msg: 'transfer success', hash: hash };
                } else {
                    if (panel == 0) {
                        this.telegramService.sendNotification(userId, "Transfer failed.");
                    }
                    return { status: false, msg: 'transfer failed', hash: '' };
                }
            } else {
                const tx = {
                    to: recieverAddress,
                    value: ethers.utils.parseEther(amount)
                }
                const tr = await wallet.sendTransaction(tx);
                const res = await tr.wait()
                if (res.status) {
                    if (panel == 0) {
                        this.telegramService.sendNotification(userId, "Transfer success.");
                        this.telegramService.sendNotification(userId, 'https://etherscan.io/tx/' + res.transactionHash)
                    }
                    const log = {
                        id: userId,
                        mode: 'transfer-' + target,
                        hash: res.transactionHash,
                        panel: panel,
                        tokenA: wethAddress,
                        tokenB: recieverAddress,
                        amount,
                        t_amount: 0,
                        created: this.currentTime(),
                        createdat: Date.now(),
                        other: ""
                    }
                    this.logService.create(log)
                    if (target == 'payfee') {
                        var txamount = 0;
                        await this.userService.update(userId, { txamount });
                    }
                    return { status: true, msg: 'transfer success', hash: res.transactionHash };
                } else {
                    if (panel == 0) {
                        this.telegramService.sendNotification(userId, "Transfer failed.");
                    }
                    return { status: false, msg: 'transfer failed', hash: '' };
                }
            }
        } catch (e) {
            if (panel == 0) {
                this.telegramService.sendNotification(userId, "Transfer failed.");
            }
            return { status: false, msg: 'transfer failed', hash: '' };
        }
    }

    // target: swap=>general swap mode, snipe=>snipe mode, limit=>limit mode, panel 0:tg 1:web
    async swapToken(tokenInA: string, tokenInB: string, amount: number, gas = 1, slippage = 0.1, privatekey: string, target: string, userId: string, panel: number, pv: boolean) {
        try {
            const gp = await this.provider.getGasPrice();
            const gasPrice = Number(ethers.utils.formatUnits(gp, "gwei")) * 1 + gas;

            const tokenA = ethers.utils.getAddress(tokenInA)
            const tokenB = ethers.utils.getAddress(tokenInB)
            var decimal = 18;
            if (tokenA != wethAddress) {
                const token: Token = await Fetcher.fetchTokenData(1, tokenA)
                decimal = token.decimals;
            }
            const ethPrice = await this.botService.getEthPrice();
            const signer = new ethers.Wallet(privatekey)
            const flashProvider = await FlashbotsBundleProvider.create(this.provider, signer);

            const wallet = pv ? new ethers.Wallet(privatekey, flashProvider) : new ethers.Wallet(privatekey, this.provider)
            const routerContract = new ethers.Contract(routerAddress, routerABI, wallet);
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, wallet);
            const time = Math.floor(Date.now() / 1000) + 200000;
            const deadline = BigInt(time);

            let amountIn;
            if (target == 'snipe_sell' || target == 'autotrade_sell' || amount == 0) {
                amountIn = await this.getTokenBalanceOfWallet(tokenA, wallet.address);
            } else {
                amountIn = ethers.utils.parseUnits(amount.toString(), decimal);
            }
            const amountOut = await routerContract.getAmountsOut(amountIn, [tokenA, tokenB])
            const amountOutMin = BigInt(Math.floor(parseInt(ethers.utils.formatUnits(amountOut[1])) * (1 - (slippage / 100))))
            const tokenAContract = new ethers.Contract(tokenA, standardABI, wallet);

            let tokenA_balance
            if (tokenA == wethAddress) {
                tokenA_balance = await this.provider.getBalance(wallet.address)
            } else {
                tokenA_balance = await tokenAContract.balanceOf(wallet.address);
            }

            if (tokenA_balance.gt(amountIn)) {
                const approve_tr = await tokenAContract.approve(routerAddress, amountIn);
                const approve_res = await approve_tr.wait();

                if (approve_res.status) {
                    if (tokenA == wethAddress) {
                        const t_amount = Number(ethers.utils.formatUnits(amountOutMin, 18)) * 1;
                        
                        const swap_tr = await routerContract.swapExactETHForTokens(
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            {
                                value: amountIn,
                                gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei')
                            }
                        )
                        const swap_res = await swap_tr.wait();
                        const hash = swap_res.transactionHash;

                        const log = {
                            id: userId,
                            mode: target,
                            hash: hash,
                            panel: panel,
                            tokenA,
                            tokenB,
                            amount,
                            t_amount,
                            created: this.currentTime(),
                            createdat: Date.now(),
                            other: ""
                        }
                        this.logService.create(log)

                        // record the transaction amount of the user on DB
                        const user = await this.userService.findOne(userId)
                        var txamount = user.txamount + amount * 1;
                        await this.userService.update(userId, { txamount })

                        // swap for sell token log
                        if (target == 'swap') {
                            
                            const unitrade = {
                                userid: userId,
                                contract: tokenB,
                                eth_amount: amount,
                                token_amount: t_amount,
                                act: 'buy',
                                address: wallet.address
                            }
                            this.unitradeService.insertNew(unitrade)
                        }
                        if (target == 'snipe') {
                            // set the start price for sniper mode...
                            const tokenPrice = await this.botService.getPairPrice(tokenB);
                            var sniper = user.sniper;
                            sniper.startprice = tokenPrice.price;
                            await this.userService.update(userId, { sniper });
                            //calculate the ROI
                            const ethPrice = await this.botService.getEthPrice();
                            const tokekB_balance = await this.getTokenBalanceOfWallet(tokenB, wallet.address)
                            const roi = (tokekB_balance * tokenPrice.price - Number(sniper.buyamount) * ethPrice) / (Number(sniper.buyamount) * ethPrice) * 100;
                            this.telegramService.sendRoiMessage(roi, userId);

                        } else if (target == 'limit') {
                            const t = tokenListForSwap.filter((tk) => tk.address == tokenB);
                            const token = t[0].name;
                            var limits = user.limits;
                            limits.forEach((limit, index) => {
                                if (limit.token == token) {
                                    limits[index].result = swap_res.status ? true : false;
                                    limits[index].except = swap_res.status ? false : true;
                                }
                            })
                            await this.userService.update(userId, { limits: limits })
                        } else if (target == 'autotrade') {
                            const tokenPrice = await this.botService.getPairPrice(tokenB);
                            var autotrade = user.autotrade;
                            autotrade.startprice = tokenPrice.price
                            autotrade.buy = true;
                            await this.userService.update(userId, { autotrade })
                        } else {

                        }
                        if (panel == 0) {
                            this.telegramService.sendNotification(userId, "Swap success(" + target + ")");
                        }
                        return { status: swap_res.status, msg: 'Swap success' };
                    } else if (tokenB == wethAddress) {
                        const eth_amount = Number(ethers.utils.formatUnits(amountOutMin, 18)) * 1;
                        const t_amount = Number(ethers.utils.formatUnits(amountIn, decimal)) * 1;
                        const swap_tr = await routerContract.swapExactTokensForETH(
                            amountIn,
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei') }
                        )
                        const swap_res = await swap_tr.wait();
                        const hash = swap_res.transactionHash;
                        const log = {
                            id: userId,
                            mode: target,
                            hash: hash,
                            panel: panel,
                            tokenA,
                            tokenB,
                            amount: eth_amount,
                            t_amount: t_amount,
                            created: this.currentTime(),
                            createdat: Date.now(),
                            other: ""
                        }
                        this.logService.create(log)

                        // record the transaction amount of the user on DB
                        const user = await this.userService.findOne(userId)
                        var txamount = user.txamount + Number(ethers.utils.formatUnits(amountOutMin, decimal)) * 1;
                        await this.userService.update(userId, { txamount })

                        if (panel == 0) {
                            if (target == 'swap') {
                                this.telegramService.sendNotification(userId, "Swap success.");
                            }
                        }
                        if (target == 'snipe_sell') {
                            // update the snipe auto sell result on db 
                            var sniper = user.sniper;
                            sniper.startprice = 10000;
                            sniper.sold = true;
                            sniper.autobuy = false;
                            await this.userService.update(userId, { sniper });
                        }

                        if (target == 'autotrade_sell') {
                            var autotrade = user.autotrade;
                            autotrade.startprice = 0
                            autotrade.sell = true;
                            await this.userService.update(userId, { autotrade })
                        }

                        // swap for sell token log
                        if (target == 'swap') { 
                            const unitrade = {
                                userid: userId,
                                contract: tokenA,
                                eth_amount: eth_amount,
                                token_amount: amount,
                                act: 'sell',
                                address: wallet.address
                            }
                            this.unitradeService.insertNew(unitrade)
                        }

                        return { status: swap_res.status, msg: 'Swap success' };
                    } else {

                    }
                }
            } else {
                if (target == 'limit') {
                    const t = tokenListForSwap.filter((tk) => tk.address == tokenB);
                    const token = t[0].name;
                    const user = await this.userService.findOne(userId);
                    var limits = user.limits;
                    limits.forEach((limit, index) => {
                        if (limit.token == token) {
                            limits[index].except = true;
                        }
                    })
                    await this.userService.update(userId, { limits: limits })
                }
                if (panel == 0) {
                    this.telegramService.sendNotification(userId, "Your balance is not enough(" + target + ")");
                }
                return { status: false, msg: 'Your balance is not enough.' };
            }
        } catch (e) {
            if (target == 'limit') {
                const t = tokenListForSwap.filter((tk) => tk.address == tokenInB);
                const token = t[0].name;
                const user = await this.userService.findOne(userId);
                var limits = user.limits;
                limits.forEach((limit, index) => {
                    if (limit.token == token) {
                        limits[index].except = true;
                    }
                })
                await this.userService.update(userId, { limits: limits })
            }
            if (panel == 0) {
                this.telegramService.sendNotification(userId, "Error happened while transaction, maybe not enough fund or low slippage(" + target + ")");
            }
            return { status: false, msg: e };
        }
    }

    async getSupply(tokenAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            const supply = await tokenContract.totalSupply();
            return supply;
        } catch (e) {

        }
    }

    async isTokenContract(tokenAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            const supply = await tokenContract.totalSupply();
            if (supply > 0) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    async getBalanceOfWallet(wallet: string) {
        try {
            const b = await this.provider.getBalance(wallet);
            const balance = ethers.utils.formatEther(b)
            return (+balance).toFixed(4);
        } catch (e) {

        }
    }

    async getTokenBalanceOfWallet(tokenAddress: string, walletAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            return await tokenContract.balanceOf(walletAddress)
        } catch (e) {

        }
    }

    async getDecimal(tokenAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            return tokenContract.decimals();
        } catch (e) {

        }
    }

    async getTokenHolding(address: string) {
        try {
            const url = holdingApi + address + '&page=1&offset=100&apiKey=' + holdingKey;
            const res = await axios.get(url);
            if (res.status) {
                return res.data.result
            } else {
                return [];
            }
        } catch (e) {
            return []
        }
    }

    currentTime() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const dateTimeString = `${day}/${month}/${year} ${hours}:${minutes}`;
        return dateTimeString;
    }

}


// https://medium.com/clearmatics/how-i-made-a-uniswap-interface-from-scratch-b51e1027ca87