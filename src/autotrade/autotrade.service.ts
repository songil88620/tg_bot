import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, } from '@uniswap/sdk'
import { ethers, Contract, Wallet, Signer, FixedNumber, } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { etherScanKey_2, factoryAddress, routerAddress, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BotService } from 'src/bot/bot.service';
import { pairABI } from 'src/abi/pair_standard';


@Injectable()
export class AutotradeService implements OnModuleInit {

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

            this.watchContract();


        } catch (e) {
            console.log("Err", e)
        }
    }

    async watchContract() {
        console.log("watch....autotrade")
        try {
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, this.provider);
            factoryContract.on("PairCreated", async (tokenA, tokenB, pair, pairLength) => {
                const token = tokenA == wethAddress ? tokenB : tokenA;
                const tokenContract = new ethers.Contract(token, standardABI, this.provider);
                const owner = await tokenContract.owner();
                const name = await tokenContract.name();
                const decimals = await tokenContract.decimals();
                const pairContract = new ethers.Contract(pair, pairABI, this.provider);
                const liqudity = await pairContract.MINIMUM_LIQUIDITY();
                const balance = await pairContract.balanceOf(owner)
                const balanceOf = parseInt(ethers.utils.formatUnits(balance, decimals))

                const user = await this.userService.findUserByAutotradeForBuy();
                for (var i = 0; i < user.length; i++) {
                    const u = user[i];
                    const autotrade = u.autotrade;
                    if (autotrade.token.includes(name) && balanceOf >= autotrade.balance && liqudity >= autotrade.liqudity) {
                        this.swapService.swapToken(wethAddress, token, autotrade.amount, 1, 0.1, u.wallet[autotrade.wallet].key, 'autotrade', u.id, u.id.length > 10 ? 1 : 0, false)
                        var sell_list = await this.botService.getAutoSellList();
                        sell_list.push(token);
                        await this.botService.updateAutoSellList(sell_list);
                    }
                }
            })
        } catch (e) {
            console.log("err", e)
        }
    }

    //for sell token
    @Cron(CronExpression.EVERY_MINUTE, { name: 'sell_bot_autotrade' })
    async sellBot() {
        try {
            const user = await this.userService.findUserByAutotradeForSell();
            for (var i = 0; i < user.length; i++) {
                const u = user[i];
                const autotrade = u.autotrade;
                const sellat = autotrade.sellat;
                const price = await this.botService.getTokenPrice(autotrade.contract);
                const start_price = autotrade.startprice;
                const rate = ((price - start_price) / start_price) * 100
                if (rate > sellat) {
                    this.swapService.swapToken(autotrade.contract, wethAddress, 0, 1, 0.3, u.wallet[autotrade.wallet].key, 'autotrade_sell', u.id, u.id.length > 10 ? 1 : 0, false)
                }
            }
        } catch (e) {

        }
    }

}


