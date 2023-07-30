import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, Route } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { factoryAddress, holdingApi, holdingKey, routerAddress, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { TelegramService } from 'src/telegram/telegram.service';
import { LogService } from 'src/log/log.service';
import axios from 'axios';
import { BotService } from 'src/bot/bot.service';


@Injectable()
export class SwapService implements OnModuleInit {

    public provider: any;

    constructor(
        @Inject(forwardRef(() => TelegramService)) private telegramService: TelegramService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => LogService)) private logService: LogService,
        @Inject(forwardRef(() => LogService)) private botService: BotService,
    ) { }

    async onModuleInit() {
        console.log(">>>swap module init")
        // const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your_infura_project_id'); 
        this.provider = new ethers.providers.EtherscanProvider("homestead", 'F6DXNJTHGNNY9GA1PDA5A7PNH11HGY8BHP')


        //this.getHoldingList('0x8409Df4B8b2907642023d9f974aedc54Bb1128BD');
        //this.testPair()
        //this.getPairPriceRate('0x6b175474e89094c44da98b954eedeac495271d0f')
    }

    async testPair() {
        const DAI = new Token(ChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6)
        const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId])
        const route = new Route([pair], WETH[DAI.chainId])
        const rate = route.midPrice.toSignificant(6)
        console.log(">>>R", rate)
    }

    async getPairPriceRate(tokenAddress: string) {
        const token: Token = await Fetcher.fetchTokenData(1, tokenAddress)
        const pair = await Fetcher.fetchPairData(token, WETH[token.chainId])
        const route = new Route([pair], WETH[token.chainId])
        const rate = route.midPrice.toSignificant(6)
        console.log(">>RRRR", rate)
        return rate
    }

    async getHoldingList(address: string) {
        try {
            const res = await axios.get('https://api.etherscan.io/api?module=account&action=addresstokenbalance&address=' + address + '&page=1&offset=100&apikey=F6DXNJTHGNNY9GA1PDA5A7PNH11HGY8BHP');
            if (res.data.standard) {
                return { status: true, data: res.data.result };
            } else {
                return { status: false, data: res.data.result };
            }
        } catch (e) {
            return { status: false, data: "" }
        }
    }

    async getBalance(tokenAddress: string, walletAddress: string) {
        const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
        const supply = await tokenContract.totalSupply();
        const token_balance = await tokenContract.balanceOf(walletAddress)
        const eth_balance = await this.provider.getBalance(walletAddress)
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
                        created: this.currentTime(),
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
                        created: this.currentTime(),
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
            if (pv) {
                //flash mode
            } else {
                //general mode
            }
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

            const wallet = new ethers.Wallet(privatekey, this.provider);
            const routerContract = new ethers.Contract(routerAddress, routerABI, wallet);
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, wallet);
            const time = Math.floor(Date.now() / 1000) + 200000;
            const deadline = BigInt(time);

            let amountIn;
            if (target == 'snipe_sell') {
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
                            created: this.currentTime(),
                            other: ""
                        }
                        this.logService.create(log)

                        // record the transaction amount of the user on DB
                        const user = await this.userService.findOne(userId)
                        var txamount = user.txamount + amount * 1;
                        await this.userService.update(userId, { txamount })

                        if (target == 'swap') {

                        } else if (target == 'snipe') {
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
                        } else {

                        }
                        if (panel == 0) {
                            this.telegramService.sendNotification(userId, "Swap success(" + target + ")");
                        }
                        return { status: swap_res.status, msg: 'Swap success' };
                    } else if (tokenB == wethAddress) {
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
                            amount,
                            created: this.currentTime(),
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
        const b = await this.provider.getBalance(wallet);
        const balance = ethers.utils.formatEther(b)
        return (+balance).toFixed(4);
    }

    async getTokenBalanceOfWallet(tokenAddress: string, walletAddress: string) {
        const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
        return await tokenContract.balanceOf(walletAddress)
    }

    async getDecimal(tokenAddress: string) {
        const token: Token = await Fetcher.fetchTokenData(1, tokenAddress)
        const decimal = token.decimals;
        return decimal;
    }

    async getTokenHolding(address: string) {
        const url = holdingApi + address + '&page=1&offset=100&apiKey=' + holdingKey;
        const res = await axios.get(url);
        if (res.status) {
            return res.data.result
        } else {
            return [];
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