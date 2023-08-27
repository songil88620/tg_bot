import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { tokenListForSwap, wethAddress } from 'src/abi/constants';
import { SwapService } from 'src/swap/swap.service';
import { PlatformService } from 'src/platform/platform.service';
import { Hop } from '@hop-protocol/sdk'
import { ethers, providers } from 'ethers'
import axios from 'axios';
import { BotService } from 'src/bot/bot.service';


@Injectable()
export class BridgeService implements OnModuleInit {

    private provider: any;
    private limitbox: any[];
    private tokenlist: string[];

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
    ) { }

    async onModuleInit() {
        this.provider = this.swapService.provider;
        this.test();
    }

    async test() {
        console.log(">>>>JP")
        try {
            const pk = '0x198910fadcc1756451b117c02e0f3e1e2a11352e54f9588d53039183ffa9ce67'
            const wallet = new ethers.Wallet(pk, this.provider)
            const hop = new Hop('mainnet', wallet)
            const bridge = hop.bridge('USDC')
            //console.log(">>>>HJO", bridge)

            const fromChain = 'ethereum'
            const toChain = 'arbitrum'
            const amountBn = bridge.parseUnits('100')
            const _estimate = await bridge.getSendData(amountBn, fromChain, toChain)
            // console.log(">>>>AA", _estimate)
            const es = bridge.formatUnits(_estimate.estimatedReceived).toFixed(4)
            const fee = _estimate.totalFee
            console.log(">>>>AA", es)
        } catch (e) {
            const msg = e.message
        }

    }

    async getEstimate(pk: string, fromChain: string, toChain: string, amount: string, token: string) {
        try {
            const wallet = new ethers.Wallet(pk, this.provider);
            const hop = new Hop('mainnet', wallet);
            const bridge = hop.bridge(token)
            const amountBn = bridge.parseUnits(amount)
            const _estimate = await bridge.getSendData(amountBn, fromChain, toChain)
            const es_recieve = bridge.formatUnits(_estimate.estimatedReceived).toFixed(4)
            const ex_fee = _estimate.totalFee;
            return { status: true, ex_fee, es_recieve, msg: 'success' }
        } catch (e) {
            return { status: false, msg: e.message }
        }

    }

    async approveAndSend(pk: string, fromChain: string, toChain: string, amount: string, token: string, receiver:string, panel: number) {
        try {
            const wallet = new ethers.Wallet(pk, this.provider);
            const hop = new Hop('mainnet', wallet);
            const bridge = hop.bridge(token)
            const amountBn = bridge.parseUnits(amount)
            const _estimate = await bridge.getSendData(amountBn, fromChain, toChain)
            const needsApproval = await bridge.needsApproval(amountBn, fromChain)
            if (needsApproval) {
                const tx = await bridge.sendApproval(amountBn, fromChain, toChain)
                await tx.wait()
            }
            const tx = await bridge.send(amountBn, fromChain, toChain, {
                relayerFee: _estimate.totalFee,
                recipient: receiver
            })
            return { status: true, msg: 'success' }
        } catch (e) {
            return { status: false, msg: e.message }
        }
    }




}


