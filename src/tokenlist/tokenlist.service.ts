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
import { TokenData, TokenlistDocument } from './tokenlist.schema';
import { standardABI } from 'src/abi/standard';


@Injectable()
export class TokenlistService implements OnModuleInit {

    public tokenlist: TokenData[] = [];


    constructor(
        @InjectModel('tokenlist') private readonly model: Model<TokenlistDocument>,
    ) {

    }

    async onModuleInit() {
        try {
            this.initTokenList()
        } catch (e) {

        }
    }

    async initTokenList() {
        const data: TokenData[] = await this.model.find();
        data.forEach((t: TokenData) => {
            this.tokenlist.push(t)
        })
    }

    async getTokenList() {
        return this.model.find().sort({ created: -1 });
    }

    async getTokenData(contract: string, network: string) {
        const f_res = this.tokenlist.find((t) => t.contract.toLowerCase() == contract.toLowerCase());
        if (f_res) {
            return f_res
        } else {
            const token_data: TokenData = await this.model.findOne({ contract });
            if (token_data) {
                this.tokenlist.push(token_data)
                return token_data
            } else {
                const res = await axios.get(`https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${contract}`)
                if (res.status == 200) {
                    const data = res.data.data.attributes;
                    const new_data: TokenData = {
                        contract,
                        name: data.name,
                        symbol: data.symbol,
                        decimals: data.decimals,
                        price: data.price_usd,
                        image_url: data.image_url,
                        mcap: data.maket_cap_usd,
                        h24: data.volume_usd.h24,
                        api: 'gecko',
                        network: network
                    }
                    await new this.model({ ...new_data }).save();
                    this.tokenlist.push(new_data)
                    return new_data;
                } else {
                    if (network == 'eth') {
                        const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.nodereal.io/v1/f3b37cc49d3948f5827621b8c2e0bdb3')
                        const tokenContract = new ethers.Contract(contract, standardABI, provider);
                        const name = await tokenContract.name();
                        const symbol = await tokenContract.symbol();
                        const decimals = await tokenContract.decimals();
                        const new_data: TokenData = {
                            contract,
                            name: name,
                            symbol: symbol,
                            decimals: decimals,
                            price: 'null',
                            image_url: 'missing.png',
                            mcap: 'null',
                            h24: 'null',
                            api: 'contract',
                            network: network
                        }
                        await new this.model({ ...new_data }).save();
                        this.tokenlist.push(new_data)
                        return new_data;
                    } else {

                    }
                }
            }
        }

    }



    @Cron(CronExpression.EVERY_MINUTE, { name: 'token_list' })
    async scanDetail() {
        try {

        } catch (e) {
            console.log(">>>err")
        }
    }




}