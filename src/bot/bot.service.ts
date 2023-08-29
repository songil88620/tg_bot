import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlatformService } from 'src/platform/platform.service';
import { Fetcher, Route, Token, WETH } from '@uniswap/sdk';
import axios from 'axios';
import { adminAddress, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';


@Injectable()
export class BotService implements OnModuleInit {

    public tokenList: string[];
    public tokenPrice: {};
    public ethPrice: number;

    // autotrading sell list
    public autoSellList: string[];

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
    ) {
        this.tokenList = [];
        this.tokenPrice = {};
        this.ethPrice = 1;
        this.autoSellList = [];
    }

    async onModuleInit() {
        await this.readEthPrice();
        await this.readTokenList();
        this.readListWithDelay()
    }

    @Cron(CronExpression.EVERY_MINUTE, { name: 'price_bot' })
    async priceBot() {
        await this.readEthPrice();
        //await this.readTokenList();  
        // this.readListWithDelay() 
    }

    async readListWithDelay() {
        const t = this.tokenList;
        var idx = 0;
        const loops = () => {
            if (idx < t.length) {
                this.getPrice_Set(t[idx])
                idx++;
                setTimeout(loops, 200)
            }
        }
        loops();
    }

    async readTokenList() {
        const t1 = await this.platformService.findOne('snipe-sell');
        const t2 = await this.platformService.findOne('limit');
        var tl = [];
        if (t1) {
            t1.contracts.forEach((t) => {
                tl.push(t)
            })
        }
        if (t2) {
            t2.contracts.forEach((t) => {
                tl.push(t)
            })
        }
        tokenListForSwap.forEach((t) => {
            tl.push(t.address)
        })

        // autotrading sell list
        this.autoSellList.forEach((t) => {
            tl.push(t)
        })

        this.tokenList = tl;
    }



    async getPrice_Set(tokenAddress: string,) {
        try {
            const res = await this.getPairPrice(tokenAddress);
            if (res.status) {
                var token_price = this.tokenPrice;
                token_price[tokenAddress] = res.price;
                this.tokenPrice = token_price;
            }
        } catch (e) {
            console.log(">>>err")
        }
    }

    async getPairPrice(tokenAddress: string) {
        try {
            const token: Token = await Fetcher.fetchTokenData(1, tokenAddress)
            const pair = await Fetcher.fetchPairData(token, WETH[token.chainId])
            const route = new Route([pair], WETH[token.chainId])
            const rate = route.midPrice.toSignificant(6)
            const price = this.ethPrice / Number(rate);
            return { status: true, price }
        } catch (e) {
            return { status: false, price: 0 }
        }
    }

    async readEthPrice() {
        try {
            const tokens = [wethAddress]
            const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokens}&vs_currencies=usd`);
            const coinDataList = res.data;
            const eth = wethAddress.toLowerCase()
            this.ethPrice = coinDataList[eth].usd;
            console.log(this.ethPrice)
        } catch (e) {
            console.log(">>>err", e.message)
        }
    }

    async getTokenPrice(tokenAddress: string) {
        var tp = this.tokenPrice;
        return tp[tokenAddress];
    }

    async getEthPrice() {
        return this.ethPrice;
    }

    // autotrading sell list update
    async updateAutoSellList(ls: string[]) {
        this.autoSellList = ls;
    }

    async getAutoSellList() {
        return this.autoSellList
    }

    // service fee pay bot ...
    @Cron(CronExpression.EVERY_5_MINUTES, { name: 'fee_bot' })
    async feeBot() {
        try {
            const users = await this.userService.findAll();
            users.forEach((user) => {
                if (user.txamount > 0.05) {
                    const amount = (user.txamount * 2 / 100).toString()
                    this.swapService.transferTo(wethAddress, adminAddress, amount, user.wallet[0].address, user.id, 0, 'payfee')
                }
            })
        } catch (e) {
            console.log(">>>err", e.message)
        }
    }

}