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
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MirrorService implements OnModuleInit {

    private provider: any;
    private mirrorbox: any[];
    private mirroraddress: string[];

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService
    ) {
    }

    async onModuleInit() {
        try {
            console.log(">>>mirror module init")
            this.provider = this.swapService.provider;
            this.loadAddress();
        } catch (e) {
        }
    }

    @Cron(CronExpression.EVERY_MINUTE, { name: 'check transaction' })
    async checkTranscation() {
        try {
            const adrs = this.mirroraddress;
            const mbox = this.mirrorbox;
            const endblock = await this.provider.getBlockNumber();
            const startblock = endblock - 5;
            for (var i = 0; i < adrs.length; i++) {
                const address = adrs[i];
                const history = await this.provider.getHistory(address, startblock, endblock);
                history.forEach((h_data) => {
                    const amount = ethers.utils.formatUnits(h_data.value)
                    const from = h_data.from;
                    const to = h_data.to
                    if (to == routerAddress) {
                        const data = h_data.data;
                        const code = data.substring(0, 10);
                        const abis = {
                            '0x7ff36ab5': ['function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)'],
                            '0x18cbafe5': ['function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)']
                        }
                        const iface = new ethers.utils.Interface(abis[code]);
                        const decodedData: any = iface.parseTransaction({ data });
                        const path = decodedData.args.path;
                        this.swapService.swapToken(path[0], path[1], mbox[i].amount, 1, 0.5, mbox[i].wallet, 'mirror', mbox[i].id, mbox[i].panel, mbox[i].private);
                    }
                })
            }
        } catch (e) {
        }
    }

    async loadAddress() {
        try {
            const users = await this.userService.findAll();
            var mbox = [];
            var mirror_address = [];
            users.forEach((user) => {
                const mirror = user.mirror;
                mirror.forEach((m, index) => {
                    if (m.address != "" && Number(m.amount) * 1 > 0 && user.wallet[index].key != "") {
                        const mr = {
                            address: m.address,
                            amount: Number(m.amount),
                            wallet: user.wallet[index].key,
                            id: user.id,
                            panel: user.panel,
                            private: m.private
                        }
                        mirror_address.push(m.address)
                        mbox.push(mr)
                    }
                })
            })
            this.mirrorbox = mbox;
            this.mirroraddress = mirror_address;
        } catch (e) {
        }
    }

    async test() {
        try {
            const blockNumber = await this.provider.getBlockNumber();
            this.provider.getHistory('0x5879b6A56f614D248aCF837AeBBD468ABAf9342e', 17490785, 17490789).then((history) => {
                const h_data = history[0];
                const amount = ethers.utils.formatUnits(h_data.value)
                const from = h_data.from;
                const to = h_data.to
                const data = h_data.data;
                const code = data.substring(0, 10);
                const abis = {
                    '0x7ff36ab5': ['function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)'],
                    '0x18cbafe5': ['function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)']
                }
                const iface = new ethers.utils.Interface(abis[code]);
                const decodedData: any = iface.parseTransaction({ data });
                const path = decodedData.args.path;
            })
        } catch (e) {
        }
    }

}


