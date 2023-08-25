import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDocument } from './log.schema';
import { log } from 'console';
import { UserService } from 'src/user/user.service';


@Injectable()
export class LogService implements OnModuleInit {

    constructor(
        @InjectModel('log') private readonly model: Model<LogDocument>,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
    ) { }

    async onModuleInit() {

    }

    async create(data: any) {
        await new this.model({ ...data }).save();
    }

    async findAll() {
        return await this.model.find().exec();
    }

    async findAllById(id: string) {
        return await this.model.find({ id }).exec();
    }

    async findOne(id: string) {
        const platform = await this.model.findOne({ id }).exec();
        return platform
    }

    async getTotalVolume(userid: string) {
        try {
            const logs = await this.model.find({ id: userid }).exec();
            var tv = 0;
            logs.forEach((l) => {
                tv = tv + Number(l.amount)
            })
            const user = await this.userService.findOne(userid)
            if (user.username != "") {
                return { status: true, u: user.username, t: tv }
            } else {
                return { status: true, u: user.wallet[0].address, t: tv }
            }
        } catch (e) {
            return { status: false }
        }

    }

}
