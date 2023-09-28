import { Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { TG_TOKEN } from 'src/constant';
import { UserService } from 'src/user/user.service';
import axios from 'axios';

import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { api_hash, api_id, wethAddress } from 'src/abi/constants';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import input from "input";
import { BotService } from 'src/bot/bot.service';
import { SwapService } from 'src/swap/swap.service';



@Injectable()
export class ScrapeService implements OnModuleInit {

    private client: any
    private stringSession: string = '1BQANOTEuMTA4LjU2LjEwMAG7e8hI08agbD8FvBmYfMUQr3gpJp5tJBBuNQsokijG2kYCXv/qHb7R0zUq+SSpuFbMc3rUVNqOXc9hrHdeigG4pkRz/PkkZr8Xz0+uZctfpdxYsuKsyYuoP75dTPCgOn0nptRXd/jCPfQmbJNKqfeA2VubH0JXN9V+aI+kjJQrEwCUERNHNn4E0PzwceqKb3mFAGfDlSthzdLCDT6NmSBUgWgHgfpZ6J0SwXtwVJ38HoVHG71h6PLbOndEk2FcQCUSRX8kUu1HxUUpeNEAp45WeOmVMuof07oa7/7J2lmxzTXH7oyw2lsgAdlqyliPrxsFhDShYdsQeICvUuRUVw49rw=='; // leave this empty for now

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => BotService)) private botService: BotService,
        @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
    ) {

    }

    async onModuleInit() {
        this.client = new TelegramClient(new StringSession(this.stringSession), api_id, api_hash, { connectionRetries: 5 });
        // await this.client.start({
        //     botAuthToken: TG_TOKEN
        // })
        await this.client.start({
            phoneNumber: async () => await input.text("Please enter your number: "),
            password: async () => await input.text("Please enter your password: "),
            phoneCode: async () =>
                await input.text("Please enter the code you received: "),
            onError: (err) => console.log(err),
        });
        console.log(">>>SEssion", this.client.session.save())
        this.readMsg()

    }

    async readMsg() {
        this.client.addEventHandler(this.handler, new NewMessage({}))
    }

    async handler(event: NewMessageEvent) {
        try {
            const peerId = event.message.peerId.CONSTRUCTOR_ID;
            const msg = event.message.message
            const entities = event.message.entities;

            const channelId = event.message.peerId['channelId']['value']
            const userId = event.message.fromId['userId']['value']

            if (entities.length > 0) {
                for (var i = 0; i < entities.length; i++) {
                    const et = entities[i];
                    const url = et['url']
                    if (url.includes('etherscan.io/token/')) {
                        console.log("URL", url)
                        const regex = /0x[a-fA-F0-9]{40}/;
                        const matches = url.match(regex);
                        const token = matches[0];
                        this.tokenFinded(token, channelId);
                    }
                }
            }
        } catch (e) {
            console.log(">>>err")
        }
    }

    async tokenFinded(contract: string, channel: string) {
        try {
            const users = await this.userService.findAll();
            for (var i = 0; i < users.length; i++) {
                const user = users[i]
                const signaltrade = user.signaltrade;
                if (signaltrade.channel.includes(channel) && signaltrade.auto && signaltrade.buy == false) {
                    this.signalTradeWorkBuy(contract, channel, user.id)
                }
            }
        } catch (e) {
            console.log(">>>err")
        }
    }

    async signalTradeWorkBuy(contract: string, channel: string, id: string) {
        try {
            const user = await this.userService.findOne(id);
            var signaltrade = user.signaltrade;
            signaltrade.token = contract;
            const _p = await this.botService.getPairPrice(contract)
            if (_p.status) {
                signaltrade.buy = true;
                signaltrade.startprice = _p.price;
                await this.userService.update(id, { signaltrade });
                await this.swapService.swapToken(wethAddress, contract, Number(signaltrade.amount), Number(signaltrade.gasprice), Number(signaltrade.slippage), user.wallet[signaltrade.wallet].key, 'signal_buy', user.id, 0, signaltrade.private)
            }
        } catch (e) {
            console.log(">>>err")
        }
    }

    // * check the price get mode again for product at the end
    async signalAutoSell() {
        try {
            const users = await this.userService.findAll();
            for (var i = 0; i < users.length; i++) {
                const user = users[i]
                const signaltrade = user.signaltrade;
                if (signaltrade.buy && signaltrade.sold == false && signaltrade.auto) {
                    this.signalTradeWorkSell(user.id)
                }
            }
        } catch (e) {
            console.log(">>>err")
        }
    }

    async signalTradeWorkSell(id: string) {
        try {
            const user = await this.userService.findOne(id);
            var signaltrade = user.signaltrade;
            const contract = signaltrade.token;
            const _p = await this.botService.getPairPrice(contract)
            if (_p.status) {
                if ((_p.price / signaltrade.startprice) * 100 > signaltrade.sellat) {
                    signaltrade.sold = true;
                    signaltrade.startprice = _p.price;
                    await this.userService.update(id, { signaltrade });
                    await this.swapService.swapToken(contract, wethAddress, 0, Number(signaltrade.gasprice), Number(signaltrade.slippage), user.wallet[signaltrade.wallet].key, 'signal_sell', user.id, 0, signaltrade.private)
                }
            }
        } catch (e) {
            console.log(">>>err")
        }
    }


}


