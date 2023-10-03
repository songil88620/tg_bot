import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, Route } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { etherScanKey_1, etherScanKey_2, factoryAddress, holdingApi, holdingKey, priorityApi, routerAddress, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { TelegramService } from 'src/telegram/telegram.service';
import { LogService } from 'src/log/log.service';
import axios from 'axios';
import { BotService } from 'src/bot/bot.service';
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { whatsabi } from "@shazow/whatsabi";
import { UnitradeService } from 'src/unitrade/unitrade.service';
var converter = require('hex2dec');



@Injectable()
export class SwapService implements OnModuleInit {

    public provider: any;


    constructor(
        @Inject(forwardRef(() => TelegramService)) private telegramService: TelegramService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => LogService)) private logService: LogService,
        @Inject(forwardRef(() => BotService)) private botService: BotService,
        @Inject(forwardRef(() => UnitradeService)) private unitradeService: UnitradeService,
    ) { }

    async onModuleInit() {
        console.log(">>>swap module init")
        this.provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.nodereal.io/v1/f3b37cc49d3948f5827621b8c2e0bdb3')
        //this.provider = new ethers.providers.EtherscanProvider("homestead", 'AST5PRVC1BS2C8RAGGK64Y8IZT86Y9G3K8')  
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
                        tokenA: token.address,
                        tokenB: recieverAddress,
                        amount: 0,
                        t_amount: amount,
                        created: this.currentTime(),
                        createdat: Date.now(),
                        other: ""
                    }
                    this.logService.create(log)

                    return { status: true, msg: 'transfer success', hash: hash };
                } else {
                    if (panel == 0) {
                        if (target != 'payfee') {
                            this.telegramService.sendNotification(userId, "Transfer failed.");
                        }
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
                        if (target != 'payfee') {
                            this.telegramService.sendNotification(userId, "Transfer failed.");
                        }
                    }
                    return { status: false, msg: 'transfer failed', hash: '' };
                }
            }
        } catch (e) {
            if (panel == 0) {
                if (target != 'payfee') {
                    this.telegramService.sendNotification(userId, "Transfer failed.");
                }
            }
            return { status: false, msg: 'transfer failed', hash: '' };
        }
    }

    // target: swap=>general swap mode, snipe=>snipe mode, limit=>limit mode, panel 0:tg 1:web
    async swapToken(tokenInA: string, tokenInB: string, amt: number, gas = 1, slippage = 0.1, privatekey: string, target: string, userId: string, panel: number, pv: boolean) {
        try {

            const user = await this.userService.findOne(userId)
            const signer = new ethers.Wallet(privatekey)
            const flashProvider = await FlashbotsBundleProvider.create(this.provider, signer);
            const wallet = pv ? new ethers.Wallet(privatekey, flashProvider) : new ethers.Wallet(privatekey, this.provider)

            var amount = Math.floor(amt * 10000) / 10000;
            // for max setting...
            if (target.includes('snipe_buy_') && amt.toString() == '100000') {
                const balance = await this.provider.getBalance(wallet.address);
                amount = Number(ethers.utils.formatUnits(balance, 18))
            }

            const gp = await this.provider.getGasPrice();
            const gasPrice = Math.floor((Number(ethers.utils.formatUnits(gp, "gwei")) * 1 + gas * 1) * 1000) / 1000;

            var extra_priority = 0;
            if (target.includes('snipe_buy_')) {
                const lobby = target.substring(10, 11);
                var snipers = user.snipers;
                extra_priority = snipers[lobby].priority;
            }
            const pr = await axios.get(priorityApi + etherScanKey_2);
            const net_priority = pr.data.result.FastGasPrice;
            const gasPriority = net_priority * 1 + extra_priority * 1;

            const tokenA = ethers.utils.getAddress(tokenInA)
            const tokenB = ethers.utils.getAddress(tokenInB)
            var decimal = 18
            var b_decimal = 18
            if (tokenA == wethAddress) {
                b_decimal = await this.getDecimal(tokenInB)
            } else {
                decimal = await this.getDecimal(tokenInA)
            }
            const ethPrice = await this.botService.getEthPrice();
            const routerContract = new ethers.Contract(routerAddress, routerABI, wallet);

            const time = Math.floor(Date.now() / 1000) + 200000;
            const deadline = BigInt(time);
            let amountIn;
            if (target == 'snipe_sell' || target == 'autotrade_sell' || amount == 0) {
                amountIn = await this.getTokenBalanceOfWallet(tokenA, wallet.address);
            } else {
                amountIn = ethers.utils.parseUnits(amount.toString(), decimal);
            }
            const amountOut = await routerContract.getAmountsOut(amountIn, [tokenA, tokenB]);
            const amountOutMin = Math.floor(Number(ethers.utils.formatUnits(amountOut[1], b_decimal)) * (1 - (slippage / 100)) * 10000) / 10000;
            const tokenAContract = new ethers.Contract(tokenA, standardABI, wallet);

            let tokenA_balance
            if (tokenA == wethAddress) {
                tokenA_balance = await this.provider.getBalance(wallet.address);
            } else {
                tokenA_balance = await tokenAContract.balanceOf(wallet.address);
            }

            if (tokenA_balance.gt(amountIn)) {
                const am = await tokenAContract.allowance(wallet.address, routerAddress);
                const allow_amount = Number(ethers.utils.formatUnits(am, decimal))
                var ap_state = true;
                if (Number(amount) > allow_amount) {
                    console.log(">>here")
                    const approve_tr = await tokenAContract.approve(routerAddress, amountIn);
                    var approve_res = await approve_tr.wait();
                    ap_state = approve_res.status;
                }

                if (ap_state) {
                    if (tokenA == wethAddress) {
                        const t_amount = amountOutMin.toString();
                        const amountOutMins = ethers.utils.parseUnits(amountOutMin.toString(), b_decimal)

                        var swap_opt = {}
                        if (target.includes('snipe_buy_')) {
                            swap_opt = {
                                value: amountIn,
                                maxPriorityFeePerGas: ethers.utils.parseUnits(gasPriority.toString(), 'gwei'),
                            }
                        } else {
                            swap_opt = {
                                value: amountIn,
                                gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei'),
                            }
                        }

                        const swap_tr = await routerContract.swapExactETHForTokens(
                            amountOutMins,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            swap_opt
                        )
                        const swap_res = await swap_tr.wait();
                        const hash = swap_res.transactionHash;

                        const events = swap_res.events;
                        const et = events.filter((ev: any) => ev.address.toLowerCase() == tokenInB.toLowerCase());
                        const recieved = ethers.utils.formatUnits(converter.hexToDec(et[0].data).toString(), b_decimal);

                        const symbol = await this.getSymbol(tokenB)
                        const msg = 'Bought ' + recieved + " " + symbol + ' for ' + amount + ' ETH';

                        const log = {
                            id: userId,
                            mode: target,
                            hash: hash,
                            panel: panel,
                            tokenA,
                            tokenB,
                            amount,
                            t_amount: recieved,
                            created: this.currentTime(),
                            createdat: Date.now(),
                            other: msg
                        }
                        this.logService.create(log)

                        // record the transaction amount of the user on DB

                        var txamount = user.txamount + amount * 1;
                        await this.userService.update(userId, { txamount })

                        // swap for sell token log
                        if (target == 'swap') {
                            const unitrade = {
                                userid: userId,
                                contract: tokenB,
                                eth_amount: amount,
                                token_amount: Number(t_amount),
                                act: 'buy',
                                address: wallet.address
                            }
                            this.unitradeService.insertNew(unitrade)
                        }
                        if (target.includes('snipe_buy_')) {
                            const lobby = target.substring(10, 11);
                            // set the start price for sniper mode...
                            const tokenPrice = await this.botService.getPairPrice(tokenB);
                            var snipers = user.snipers;
                            var sniper = snipers[lobby];
                            sniper.startprice = tokenPrice.price;
                            snipers[lobby] = sniper;
                            await this.userService.update(userId, { snipers });
                            //calculate the ROI
                            const ethPrice = await this.botService.getEthPrice();
                            const tokekB_balance = await this.getTokenBalanceOfWallet(tokenB, wallet.address)
                            const roi = (tokekB_balance * tokenPrice.price - Number(sniper.buyamount) * ethPrice) / (Number(sniper.buyamount) * ethPrice) * 100;
                            await this.telegramService.sendRoiMessage(roi, userId);

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
                            const symbol = await this.getSymbol(tokenInB);
                            const msg = amount + " ETH For " + t_amount + " " + symbol;
                            await this.telegramService.sendNotification(userId, "Swap success(" + target + ")");
                            await this.telegramService.sendNotification(userId, msg);
                            const link = 'https://etherscan.io/tx/' + hash;
                            await this.telegramService.sendNotification(userId, link);
                        }

                        return { status: swap_res.status, msg: 'Swap success' };
                    } else if (tokenB == wethAddress) {
                        const t_amount = ethers.utils.formatUnits(amountIn.toString(), decimal).toString()
                        const amountOutMins = ethers.utils.parseUnits(amountOutMin.toString(), b_decimal);
                        const eth_amount = amountOutMin * 1

                        const swap_tr = await routerContract.swapExactTokensForETH(
                            amountIn,
                            amountOutMins,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei') }
                        )
                        const swap_res = await swap_tr.wait();
                        const hash = swap_res.transactionHash;

                        const events = swap_res.events;
                        const et = events.filter((ev: any) => ev.address.toLowerCase() == tokenInB.toLowerCase());
                        const recieved = ethers.utils.formatUnits(converter.hexToDec(et[0].data).toString(), b_decimal);

                        const symbol = await this.getSymbol(tokenA)
                        const msg = 'Sold ' + t_amount + " " + symbol + ' for ' + recieved + ' ETH';

                        const log = {
                            id: userId,
                            mode: target,
                            hash: hash,
                            panel: panel,
                            tokenA,
                            tokenB,
                            amount: recieved,
                            t_amount: t_amount,
                            created: this.currentTime(),
                            createdat: Date.now(),
                            other: msg
                        }
                        this.logService.create(log)

                        // record the transaction amount of the user on DB

                        var txamount = user.txamount + eth_amount;
                        await this.userService.update(userId, { txamount })


                        if (target.includes('snipe_sell_')) {
                            // update the snipe auto sell result on db 
                            const lobby = target.substring(11, 12);
                            // set the start price for sniper mode... 
                            var snipers = user.snipers;
                            var sniper = snipers[lobby];
                            sniper.startprice = 10000;
                            sniper.sold = true;
                            sniper.autobuy = false;
                            snipers[lobby] = sniper;
                            await this.userService.update(userId, { snipers });
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

                        if (panel == 0) {
                            const symbol = await this.getSymbol(tokenInB);
                            const msg = t_amount + " " + symbol + " For " + amount + " ETH";
                            await this.telegramService.sendNotification(userId, "Swap success(" + target + ")");
                            await this.telegramService.sendNotification(userId, msg);
                            const link = 'https://etherscan.io/tx/' + hash;
                            await this.telegramService.sendNotification(userId, link);
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
            console.log(">>>EEEE", e)
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
                await this.telegramService.sendNotification(userId, "Error happened while transaction, maybe not enough fund or low slippage(" + target + ")");
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

    async getSymbol(tokenAddress: string) {
        try {
            const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
            return tokenContract.symbol();
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