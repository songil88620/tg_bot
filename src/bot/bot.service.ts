import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlatformService } from 'src/platform/platform.service';
import { Fetcher, Route, Token, WETH } from '@uniswap/sdk';
import axios from 'axios';
import { adminAddress, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';


@Injectable()
export class BotService implements OnModuleInit {

    private tokenList: string[];
    public tokenPrice: {};
    public ethPrice: number;

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
    ) {
        this.tokenList = [];
        this.tokenPrice = {};
        this.ethPrice = 1;
    }

    async onModuleInit() {
        this.readEthPrice();
        this.readTokenList();
        this.tokenList.forEach((token) => {
            this.getPrice_Set(token);
        })
    }

    @Cron(CronExpression.EVERY_MINUTE, { name: 'price_bot' })
    async priceBot() {
        // this.readEthPrice();
        // this.readTokenList();
        // this.tokenList.forEach((token) => {
        //     this.getPrice_Set(token);
        // })
    }

    readTokenList = async () => {
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
        const tokens = [wethAddress]
        const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokens}&vs_currencies=usd`);
        const coinDataList = res.data;
        const eth = wethAddress.toLowerCase()
        this.ethPrice = coinDataList[eth].usd;
        console.log(this.ethPrice)
    }

    async getTokenPrice(tokenAddress: string) {
        var tp = this.tokenPrice;
        return tp[tokenAddress];
    }

    async getEthPrice() {
        return this.ethPrice;
    }

    @Cron(CronExpression.EVERY_5_MINUTES, { name: 'fee_bot' })
    async feeBot() {
        const users = await this.userService.findAll();
        users.forEach((user)=>{
            if(user.txamount > 0.05){
                const amount = (user.txamount * 2 / 100).toString()
                this.swapService.transferTo(wethAddress, adminAddress, amount, user.wallet[0].address, user.id, 0, 'payfee')
            }
        })
    }

}