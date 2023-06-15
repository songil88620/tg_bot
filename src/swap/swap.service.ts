import { OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChainId, Token, Fetcher, WETH, Percent, } from '@uniswap/sdk'
import { ethers, Contract, Wallet, EtherscanProvider, Signer, FixedNumber, formatUnits, parseEther, getAddress, } from 'ethers';
import { routerABI } from 'src/abi/router';
import { factoryABI } from 'src/abi/factory';
import { standardABI } from 'src/abi/standard';
import { factoryAddress, routerAddress, wethAddress } from 'src/abi/constants';


@Injectable()
export class SwapService implements OnModuleInit {

    private provider: any;

    constructor() {

    }

    async onModuleInit() {
        // const dai: Token = await Fetcher.fetchTokenData(1, '0x6b175474e89094c44da98b954eedeac495271d0f')    

        // const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your_infura_project_id');
        // const provider = new EtherscanProvider('goerli');
        this.provider = new EtherscanProvider("homestead", 'F6DXNJTHGNNY9GA1PDA5A7PNH11HGY8BHP')

        // this.getBalance('0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', '0x3d367d0aEC154A1Ea8D2E5FB5FB0e3514d994E14'); 
        // this.swapToken(wethAddress, getAddress('0x6b175474e89094c44da98b954eedeac495271d0f'), 1, 1, 0.1, 'a359f2d19c25580955cd805bffb0411c3d1b8df50920b11cf58ebfae0f87929e')   
    }



    async getBalance(tokenAddress: string, walletAddress: string) {
        const tokenContract = new ethers.Contract(tokenAddress, standardABI, this.provider);
        const token_balance = await tokenContract.balanceOf(walletAddress)
        const eth_balance = await this.provider.getBalance(walletAddress)
    }

    async swapToken(tokenInA: string, tokenInB: string, amount: number, gas = 5000, slippage = 0.1, privatekey: string) {
        try {
            const tokenA = getAddress(tokenInA)
            const tokenB = getAddress(tokenInB)
            const token: Token = await Fetcher.fetchTokenData(1, tokenB)
            const decimal = token.decimals;
            const wallet = new ethers.Wallet(privatekey, this.provider);
            const routerContract = new ethers.Contract(routerAddress, routerABI, wallet);
            const factoryContract = new ethers.Contract(factoryAddress, factoryABI, wallet);
            const time = Math.floor(Date.now() / 1000) + 200000;
            const deadline = BigInt(time);
            const amountIn = parseEther(amount.toString());

            const amountOut = await routerContract.getAmountsOut(amountIn, [tokenA, tokenB])
            const amountOutMin = BigInt(Math.floor(parseInt(formatUnits(amountOut[1], 18)) * (1 - (slippage / 100))))
            const tokenAContract = new ethers.Contract(tokenA, standardABI, wallet);
            const tokenA_balance = await tokenAContract.balanceOf(wallet.address);

            if (tokenA_balance >= amountIn) {

                const approve_tr = await tokenAContract.approve(routerAddress, amountIn);
                const approve_res = await approve_tr.wait();

                if (approve_res.status) {
                    if (tokenA == wethAddress) {
                        const swap_tr = await routerContract.swapExactETHForTokens(
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { value: amountIn, gasLimit: gas }
                        )
                        const swap_res = await swap_tr.wait();
                        return { status: swap_res.status, msg: 'Swap success' };
                    } else if (tokenB == wethAddress) {
                        const swap_tr = await routerContract.swapExactTokensForETH(
                            amountIn,
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { gasLimit: gas }
                        )
                        const swap_res = await swap_tr.wait();
                        return { status: swap_res.status, msg: 'Swap success' };
                    } else {
                        const swap_tr = await routerContract.swapExactTokensForTokens(
                            amountIn,
                            amountOutMin,
                            [tokenA, tokenB],
                            wallet.address,
                            deadline,
                            { gasLimit: gas }
                        )
                        const swap_res = await swap_tr.wait();
                        return { status: swap_res.status, msg: 'Swap success' };
                    }
                }
            } else {
                return { status: false, msg: 'Your balance is not enough.' };
            }
        } catch (e) {
            return { status: false, msg: e };
        }

        // const au = formatUnits(amount_out[1], 18)
        // console.log(">>>contTT", au)
        // console.log(">>>>>EE", WETH[ChainId.MAINNET].address)
    }
}


// https://medium.com/clearmatics/how-i-made-a-uniswap-interface-from-scratch-b51e1027ca87