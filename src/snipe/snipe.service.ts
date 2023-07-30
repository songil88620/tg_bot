import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber, } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { factoryAddress, routerAddress, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BotService } from 'src/bot/bot.service';


@Injectable()
export class SnipeService implements OnModuleInit {

    private provider: any;
    private watchList: string[];
    private sellList: string[];

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => PlatformService)) private botService: BotService,
    ) {
        this.watchList = [];
        this.sellList = [];
    }

    async onModuleInit() {
        try {
            console.log(">>>snipe module init")
            this.provider = this.swapService.provider;
            const buyList = await this.platformService.findOne('snipe');
            if (buyList) {
                const buy_contracts = buyList.contracts;
                for (var i = 0; i < buy_contracts.length; i++) {
                    this.updateWatchList(buy_contracts[i], 'add')
                }
                this.watchContract();
            }
            const sellList = await this.platformService.findOne('snipe_sell');
            if (sellList) {
                const sell_contracts = sellList.contracts;
                for (var i = 0; i < sell_contracts.length; i++) {
                    this.updateSellList(sell_contracts[i], 'add', 0)
                }
            }

        } catch (e) {
            console.log("Err", e)
        }
    }

    async watchContract() {
        console.log("watch....")
        try {
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, this.provider);
            factoryContract.on("PairCreated", async (tokenA, tokenB, pair, pairLength) => {
                const wl = this.watchList;
                for (var i = 0; i < wl.length; i++) {
                    const address = wl[i].toLowerCase();
                    if (tokenA.toLowerCase() == address || tokenB.toLowerCase() == address) {
                        // new watching token launched
                        // return user based on the custom request...(find by sniper)
                        const users = await this.userService.findUserBySniper(address);
                        users.forEach((user) => {
                            if (user.autobuy) {
                                const delay = user.blockwait * 12000 + 3000
                                setTimeout(() => {
                                    user.wallet.forEach((user_wallet: string) => {
                                        this.swapService.swapToken(wethAddress, address, user.buyamount, Number(user.gasprice) * 1, Number(user.slippage) * 1, user_wallet, "snipe", user.id, user.panel, user.private)
                                    })
                                }, delay)
                            }
                        })
                        // remove from sniper buy list and add snipe sell list
                        this.updateWatchList(wl[i], 'del');
                        this.updateSellList(address, 'add', 1)
                    }
                }
            })
        } catch (e) {
            console.log("err", e)
        }
    }

    async updateWatchList(address: string, mode: string) {
        var wl = this.watchList;
        if (mode == 'add') {
            wl.push(address);
            this.watchList = wl;
        } else {
            const index = wl.indexOf(address);
            if (index > -1) {
                wl.splice(index, 1);
                this.watchList = wl;
                await this.platformService.update('snipe', { contracts: wl });
            }
        }
    }

    async updateSellList(address: string, mode: string, from: number) {
        var sl = this.sellList;
        if (mode == 'add') {
            sl.push(address)
            this.sellList = sl;
            if (from == 1) {
                await this.platformService.update('snipe_sell', { contracts: sl });
            }
        } else {
            const index = sl.indexOf(address);
            if (index > -1) {
                sl.splice(index, 1);
                this.sellList = sl;
                await this.platformService.update('snipe_sell', { contracts: sl });
            }
        }
    }

    //for sell token
    @Cron(CronExpression.EVERY_MINUTE, { name: 'sell_bot' })
    async sellBot() {
        var sl = this.sellList;
        for (var i = 0; i < sl.length; i++) {
            const token = sl[i];
            const price = await this.botService.getTokenPrice(token);
            const users = await this.userService.findUserBySniper(token);
            // ! need to think about the delete token list for here to reduce the price call count**
            users.forEach((user) => {
                if (user.autosell && user.sold == false) {
                    const rate = (price / user.startprice) * 100;
                    if (rate > user.sellrate) {
                        user.wallet.forEach((user_wallet: string) => {
                            this.swapService.swapToken(token, wethAddress, 0, Number(user.gasprice) * 1, Number(user.slippage) * 1, user_wallet, "snipe_sell", user.id, user.panel, user.private)
                        })
                    }
                }
            })
        }
    }


}


