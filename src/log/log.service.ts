import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDocument } from './log.schema';
import { log } from 'console';
import { UserService } from 'src/user/user.service';
import { PlatformService } from 'src/platform/platform.service';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class LogService implements OnModuleInit {

    constructor(
        @InjectModel('log') private readonly model: Model<LogDocument>,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
    ) { }

    async onModuleInit() {

    }

    @Cron(CronExpression.EVERY_10_MINUTES, { name: 'h24_bot' })
    async priceBot() { 
        await this.getTop50AffVolume()
        await this.getLead50Volume()
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

    async get24hVolume(userid: string) {
        try {
            const logs = await this.model.find(
                {
                    id: userid,
                    createdat: { $gte: Date.now() - 24 * 3600 * 1000 }
                }
            ).exec();
            var tv = 0;
            logs.forEach((l) => {
                tv = tv + Number(l.amount)
            })
            const user = await this.userService.findOne(userid)
            if (user.username != "") {
                return { n: user.username, h24: tv }
            } else {
                return { n: this.beautyAddress(user.wallet[0].address), h24: tv }
            }
        } catch (e) {
            return { status: false }
        }
    }

    async getAffVolume(userId: string) {
        try {
            const user = await this.userService.findOne(userId);
            const me = user.id;
            const ref = user.referral;
            var ref_v = 0;
            for (var i = 0; i < ref.length; i++) {
                if (ref[i] != me) {
                    const ref_vol = await this.get24hVolume(ref[i])
                    ref_v = ref_v + ref_vol.h24 * 1
                } 
            }
            const u_vol = await this.get24hVolume(me);
            ref_v = ref_v + u_vol.h24
            if (user.username != "") {
                return { n: user.username, h24: ref_v }
            } else {
                return { n: this.beautyAddress(user.wallet[0].address), h24: ref_v }
            }
        } catch (e) {
            return { n: "", h24: 0 }
        }
    }

    async getTop50AffVolume() {
        try {
            const users = await this.userService.findAll();
            var h24_list = [];
            for (var i = 0; i < users.length; i++) {
                const id = users[i].id;
                const h24 = await this.getAffVolume(id);
                h24_list.push(h24)
            }
            h24_list.sort((a, b) => { return b.h24 - a.h24 })
            var c_list = []
            for (var j = 0; j < h24_list.length; j++) {
                if (j == 50) {
                    break;
                }
                const c = JSON.stringify(h24_list[j]);
                c_list.push(c)
            }
            await this.platformService.update24hAff({ id: "h24_aff", contracts: c_list })
        } catch (e) {
        }
    }

    async getLead50Volume() {
        try {
            const users = await this.userService.findAll();
            var h24_list = [];
            for (var i = 0; i < users.length; i++) {
                const id = users[i].id;
                const h24 = await this.get24hVolume(id);
                h24_list.push(h24)
            }
            h24_list.sort((a, b) => { return b.h24 - a.h24 })
            var c_list = []
            for (var j = 0; j < h24_list.length; j++) {
                if (j == 50) {
                    break;
                }
                const c = JSON.stringify(h24_list[j]);
                c_list.push(c)
            }
            await this.platformService.update24hLead({ id: "h24_lead", contracts: c_list }) 
        } catch (e) {
        }
    }

    beautyAddress(address: string) {
        return address.substring(0, 4) + "..." + address.substring(address.length - 4, address.length)
    }

}
