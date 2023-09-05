import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UnitradeDocument } from './unitrade.schema';
import { BotService } from 'src/bot/bot.service';
import { UserService } from 'src/user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UnitradeService implements OnModuleInit {

    constructor(
        @InjectModel('unitrade') private readonly model: Model<UnitradeDocument>,
        @Inject(forwardRef(() => BotService)) private botService: BotService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
    ) { }

    async onModuleInit() {

    }

    @Cron(CronExpression.EVERY_10_SECONDS, { name: 'test bot' })
    async test() {
        // try {
        //     const unitrade = {
        //         userid: '5964616405',
        //         contract: 'tokenB',
        //         eth_amount: 0.18,
        //         token_amount: 70,
        //         act: 'buy',
        //         address: '0x162BB3d7BA4a2f214dAA720917d5F3580dcBE70a'
        //     }
        //     await this.insertNew(unitrade)
        //     console.log(">>HI...")
        // } catch (e) {
        // }
    }

    async insertNew(data: any) {
        // const unitrade = {
        //     userid: userId,
        //     contract: tokenA,
        //     eth_amount: amount,
        //     token_amount: eth_amount,
        //     act: 'buy'
        // }
        const eth_price = await this.botService.getEthPrice();
        const tr = await this.model.findOne({ userid: data.userid, contract: data.contract, by_wallet: data.address }).exec()
        const ethAmount = data.act == "sell" ? (data.eth_amount) : (data.eth_amount * (-1));
        const tokenAmount = data.act == "sell" ? (data.token_amount * (-1)) : (data.token_amount)
        if (tr) {
            var history = tr.history;
            const new_history = {
                token_amount: tokenAmount,
                eth_amount: ethAmount,
                eth_price: eth_price,
                buy_at: Date.now().toString(),
                act: data.act
            }
            history.push(new_history)
            await this.model.findByIdAndUpdate(tr._id, { history })
        } else {
            const new_history = {
                token_amount: tokenAmount,
                eth_amount: ethAmount,
                eth_price: eth_price,
                buy_at: Date.now().toString(),
                act: data.act
            }
            const new_trade = {
                userid: data.userid,
                contract: data.contract,
                history: [
                    new_history
                ],
                by_wallet: data.address
            }
            await new this.model({ ...new_trade }).save()
        }
    }

    async getHistory(userId: string) {
        const user = await this.userService.findOne(userId);
        const wallets = user.wallet;
        var h_list = [];
        for (var i = 0; i < wallets.length; i++) {
            const w = wallets[i];
            const w_address = w.address;
            if (w_address != "") {
                const uni_list = await this.model.find({ userid: userId, by_wallet: w_address }).exec();
                uni_list.forEach((u) => {
                    h_list.push(u)
                })
            }
        }
        return h_list;
    }

    async getHistoryForWeb(userId: string) {
        const user = await this.userService.findOne(userId);
        const wallets = user.wallet; 
        var h_list = [];
        for (var i = 0; i < wallets.length; i++) {
            const w = wallets[i];
            const w_address = w.address;
            if (w_address != "") {
                const uni_list = await this.model.find({ userid: userId, by_wallet: w_address }).exec();
                for (var j = 0; j < uni_list.length; j++) {
                    var u = uni_list[j];
                    const ct = u.contract;
                    const t_p = await this.botService.getPairPrice(ct)
                    const t_price = t_p.price 
                    const ur = {
                        _id: u._id,
                        userid: u.userid,
                        contract: u.contract,
                        history: u.history,
                        by_wallet: u.by_wallet,
                        price: t_price
                    }
                    
                    h_list.push(ur)
                }
            }
        } 
        return h_list;
    }





}
