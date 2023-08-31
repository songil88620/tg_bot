import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';
import { ethers } from 'ethers'
import axios from 'axios';
import { BotService } from 'src/bot/bot.service';


@Injectable()
export class LimitService implements OnModuleInit {

    private provider: any;
    private limitbox: any[];
    private tokenlist: string[];

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => BotService)) private botService: BotService,
    ) { }

    async onModuleInit() {
        try {
            this.provider = this.swapService.provider;
            this.loadTokenList();
            this.reloadData();
        } catch (e) {
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS, { name: 'price bot' })
    async priceBot() {
        try {
            var box = this.limitbox;
            for (var i = 0; i < box.length; i++) {
                const l_price = box[i].price;
                const l_token = box[i].token.toLowerCase();
                const market_price = await this.botService.getTokenPrice(l_token);
                if (market_price <= l_price * 1 && box[i].result == false) {
                    box[i].result = true;
                    this.swapService.swapToken(wethAddress, l_token, box[i].amount * 1, 3000, 1, box[i].wallet, 'limit', box[i].id, box[i].panel, box[i].private);
                }
            }
            this.limitbox = box;
        } catch (e) {
        }
    }

    async loadTokenList() {
        try {
            var tl = []
            const platform_limit = await this.platformService.findOne("limit")
            platform_limit.contracts.forEach((t) => {
                tl.push(t);
            })
            this.tokenlist = tl;
        } catch (e) {
        }
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
                            id: user.id,
                            panel: user.panel,
                            private: l.private
                        }
                        limit_box.push(one)
                    }
                })
            })
            this.limitbox = limit_box;
        } catch (e) {
        }
    }

}


