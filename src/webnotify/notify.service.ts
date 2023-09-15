import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotifyDocument } from './notify.schema';
import { log } from 'console';
import { UserService } from 'src/user/user.service';
import { PlatformService } from 'src/platform/platform.service';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class NotifyService implements OnModuleInit {

    constructor(
        @InjectModel('notify') private readonly model: Model<NotifyDocument>,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        @Inject(forwardRef(() => PlatformService)) private platformService: PlatformService,
    ) { }

    async onModuleInit() {

    }

    async create(data: any) {
        await new this.model({ ...data }).save();
    }

    async findAllById(id: string) {
        const c = {
            id: id,
            read: false
        }
        return await this.model.find(c).exec();
    }

    async readById(id: string) {
        await this.model.findByIdAndUpdate(id, { read: true })
    }

}
