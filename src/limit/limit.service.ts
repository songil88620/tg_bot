import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';
import { ethers } from 'ethers'
import axios from 'axios';


@Injectable()
export class LimitService implements OnModuleInit {

    private provider: any;
    private limitbox: any[];
    private tokenlist: string[];

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService
    ) { }

    async onModuleInit() {
        try {
            this.provider = this.swapService.provider;
            this.loadTokenList();
            this.reloadData();
        } catch (e) {
            console.log("Err", e)
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS, { name: 'price bot' })
    async priceBot() {
        try {
            const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${this.tokenlist}&vs_currencies=usd`);
            const coinDataList = res.data;
            var box = this.limitbox;
            box.forEach((limit, index) => {
                const l_price = limit.price;
                const l_token = limit.token.toLowerCase();
                const market_price = coinDataList[l_token].usd;
                if (market_price <= l_price * 1 && limit.result == false) {
                    box[index].result = true;
                    this.swapService.swapToken(wethAddress, l_token, limit.amount * 1, 3000, 1, limit.wallet, 'limit', limit.id);
                }
            })
            this.limitbox = box;
        } catch (e) {
            console.log(">>", e)
        }
    }

    async loadTokenList() {
        var tl = []
        const platform_limit = await this.platformService.findOne("limit")
        platform_limit.contracts.forEach((t) => {
            tl.push(t);
        })
        this.tokenlist = tl;
    }

    async reloadData() {
        try {
            this.loadTokenList();
            const users = await this.userService.findAll();
            var limit_box = [];
            users.forEach((user) => {
                const limits = user.limits;
                limits.forEach((l) => {
                    if (l.result == false && l.except == false) {
                        const one = {
                            token: l.token,
                            amount: l.amount,
                            price: l.price,
                            wallet: user.wallet[l.wallet].key,
                            result: l.result,
                            expect: l.except,
                            id: user.id
                        }
                        limit_box.push(one)
                    }
                })
            })
            this.limitbox = limit_box;
        } catch (e) {
            console.log(">>", e)
        }
    }

}


