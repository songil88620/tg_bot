import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ethers } from 'ethers';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlatformService } from 'src/platform/platform.service';
import { Fetcher, Route, Token, WETH } from '@uniswap/sdk';
import axios from 'axios';
import { wethAddress } from 'src/abi/constants'; 
 

@Injectable()
export class BotService implements OnModuleInit {

    private tokenList: string[];
    public tokenPrice: {};
    public ethPrice: number;

    constructor( 
        @Inject(forwardRef(() => PlatformService)) private userService: UserService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
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

}
