import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './user.schema';
import { SwapService } from 'src/swap/swap.service';



@Injectable()
export class UserService {

  constructor(
    @InjectModel('user') private readonly model: Model<UserDocument>,
    @Inject(forwardRef(() => SwapService)) private swapService: SwapService,
  ) { }

  async create(data: any) {
    const id = data.id;
    const user = await this.model.findOne({ id: id }).exec();
    if (!user) {
      return await new this.model({ ...data }).save();
    }
  }

  async findAll() {
    return await this.model.find().exec();
  }

  async findOne(id: string) {
    const user = await this.model.findOne({ id }).exec();
    return user
  }

  async update(id: string, data) {
    return await this.model.findOneAndUpdate({ id: id }, data, { new: true }).exec()
  }

  async findUserBySniper(contract: string) {
    const users = await this.model.find().exec();
    const _users = [];
    users.forEach(async (u) => {
      const snipers = u.snipers;
      for (var i = 0; i < snipers.length; i++) {
        const sniper = snipers[i];
        if (sniper.contract.toLowerCase() == contract.toLowerCase()) {
          var wallet = []
          if (sniper.multi) {
            u.wallet.forEach((w) => {
              wallet.push(w.key)
            })
          } else {
            wallet.push(u.wallet[0].key)
          }   
          const user = {
            id: u.id,
            panel: u.panel,
            contract: sniper.contract.toLowerCase(),
            buyamount: sniper.buyamount,
            gasprice: sniper.gasprice,
            priority: sniper.priority,
            slippage: sniper.slippage,
            wallet: wallet,
            autobuy: sniper.autobuy,
            autosell: sniper.autosell,
            startprice: sniper.startprice,
            sellrate: sniper.sellrate,
            sold: sniper.sold,
            private: sniper.private,
            lobby: i
          }
          _users.push(user);
        }
      }

    })
    return _users;
  }

  async updateReferral(code: string, u_code: string) {
    const user = await this.model.findOne({ code }).exec();
    var referral = user.referral;
    if (!referral.includes(u_code)) {
      referral.push(u_code);
    }
    const id = user.id;
    await this.model.findOneAndUpdate({ id }, { referral }, { new: true }).exec();
  }

  async findUserByAutotradeForBuy() {
    const c = {
      auto: true,
      buy: false
    }
    return await this.model.find(c).exec();
  }

  async findUserByAutotradeForSell() {
    const c = {
      auto: true,
      buy: true,
      sell: false
    }
    return await this.model.find(c).exec();
  }


}
