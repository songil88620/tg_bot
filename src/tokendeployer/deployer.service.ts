import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { etherScanKey_1, etherScanKey_2, tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';
import { ethers } from 'ethers'
import axios from 'axios';
import { BotService } from 'src/bot/bot.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, set } from 'mongoose';
import { standardABI } from 'src/abi/standard';



import { token_ABI_TEST } from 'src/abi/new_token/testnet/new_token';
import { tokenBYTE_TEST } from 'src/abi/new_token/testnet/new_token_byte';

const fs = require('fs');
const path = require('path');


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
            this.provider = new ethers.providers.EtherscanProvider("sepolia", etherScanKey_1)
            // this.provider = new ethers.providers.EtherscanProvider("homestead", etherScanKey_1)
        } catch (e) {
            console.log("Err", e)
        }
    }

    @Cron(CronExpression.EVERY_MINUTE, { name: 'scan_detail' })
    async scanDetail() {

    }

    async deployNewToken(userid: string) {
        try {
            const user = await this.userService.findOne(userid);
            const newtoken = user.newtoken;
            const pk = user.wallet[newtoken.wallet].key;
            const signer = new ethers.Wallet(pk, this.provider)
            const factory = new ethers.ContractFactory(token_ABI_TEST, tokenBYTE_TEST, signer);
            const contract = await factory.deploy(newtoken.name, newtoken.symbol, 18, newtoken.supply, newtoken.maxtx, newtoken.maxwt);
            const res = await contract.deployTransaction.wait();

            const myContract = new ethers.Contract(contract.address, token_ABI_TEST, signer);
            const setting = await myContract.setParameters(newtoken.lqfee, newtoken.bdfee, newtoken.mkfee, newtoken.dvfee, newtoken.brfee, 100);
            await setting.wait();

            return { status: true, address: contract.address }
        } catch (e) {
            console.log(">>ee", e)
            return { status: false, address: 'Error: insufficient funds for intrinsic transaction cost [ See: https://links.ethers.org/v5-errors-INSUFFICIENT_FUNDS ]' }
        }
    }


}