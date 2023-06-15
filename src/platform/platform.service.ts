import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformDocument } from './platform.schema';


@Injectable()
export class PlatformService implements OnModuleInit {

    constructor(
        @InjectModel('platform') private readonly model: Model<PlatformDocument>,
    ) { }

    async onModuleInit() {
        const platform = await this.model.findOne({ id: 'snipe' }).exec();
        if (!platform) {
            const data = {
                id: 'snipe',
                contracts: []
            }
            return await new this.model({ ...data }).save();
        }
    }

    async create(data: any) {
        const id = data.id;
        const platform = await this.model.findOne({ id: id }).exec();
        if (!platform) {
            return await new this.model({ ...data }).save();
        }
    }

    async findAll() {
        return await this.model.find().exec();
    }

    async findOne(id: string) {
        const platform = await this.model.findOne({ id }).exec();
        return platform
    }

    async update(id: string, data) {
        return await this.model.findOneAndUpdate({ id: id }, data, { new: true }).exec()
    }

}
