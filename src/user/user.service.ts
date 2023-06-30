import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from './user.schema';



@Injectable()
export class UserService {

  constructor(
    @InjectModel('user') private readonly model: Model<UserDocument>,
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

  async findOne(id: number) {
    const user = await this.model.findOne({ id }).exec();
    return user
  }

  async update(id: number, data) {
    return await this.model.findOneAndUpdate({ id: id }, data, { new: true }).exec()
  }

  async findUserBySniper(contract: string) {
    const users = await this.model.find().exec();
    const _users = [];
    users.forEach((u) => {
      const snipers = u.snipers;
      snipers.forEach((s) => {
        if (s.contract == contract) {
          const user = {
            id: u.id,
            contract: s.contract,
            buyamount: s.buyamount,
            gasprice: s.gasprice,
            slippage: s.slippage,
            wallet: u.wallet[s.wallet],
            autobuy: s.autobuy
          }
          _users.push(user);
        }
      })

    })
    return _users;
  }

}
