import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { etherScanKey_2, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';
import { ethers } from 'ethers'
import axios from 'axios';
import { BotService } from 'src/bot/bot.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { standardABI } from 'src/abi/standard';

const key1 = '9CBM8CK1EDUS1NR2TAKQI6MWNIEUJ13JZ9'
const key2 = 'UNWGU84VQUH6FFDSEVCG1P11UAU9BPSX76'
const key3 = 'F6DXNJTHGNNY9GA1PDA5A7PNH11HGY8BHP'

@Injectable()
export class DeployerService implements OnModuleInit {

    private provider1: any;
    private provider2: any;
    private provider3: any;

    private provider: any;

    private tokenlist: string[];
    public cnt: number

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
        @Inject(forwardRef(() => BotService)) private botService: BotService,
    ) {
        this.cnt = 0;
    }

    async onModuleInit() {
        try {
            this.provider = this.swapService.provider;

        } catch (e) {
            console.log("Err", e)
        }
    }


    @Cron(CronExpression.EVERY_MINUTE, { name: 'scan_detail' })
    async scanDetail() {

    }

    async deployNewToken(userid: string) {
        const user = await this.userService.findOne(userid);
        const newtoken = user.newtoken;
        
    }




}