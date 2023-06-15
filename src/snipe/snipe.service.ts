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


@Injectable()
export class SnipeService implements OnModuleInit {

    private provider: any;

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService
    ) {

    }

    async onModuleInit() {
        try {
            console.log(">>>snipe module init")
            this.provider = this.swapService.provider;
            const platform = await this.platformService.findOne('snipe');
            const contracts = platform.contracts;
            for (var i = 0; i < contracts.length; i++) {
                await this.watchContract(contracts[i]);
            }
        } catch (e) {
            console.log("Err", e)
        }

    }

    async watchContract(address: string) {
        try {
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, this.provider);
            factoryContract.on("PairCreated", async (tokenA, tokenB, pair, pairLength) => {
                if (tokenA == address || tokenB == address) {
                    // new watching token launched
                    const users = await this.userService.findUserBySniper(address);
                    users.forEach((user) => {
                        this.swapService.swapToken(wethAddress, address, user.buyamount, user.gasprice, user.slippage, user.wallet, "snipe", user.id)
                    })
                }
            })
        } catch (e) {
            console.log("Err", e)
        }
    }

}


