import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDocument } from './log.schema';


@Injectable()
export class LogService implements OnModuleInit {

    constructor(
        @InjectModel('log') private readonly model: Model<LogDocument>,
    ) { }

    async onModuleInit() {

    }

    async create(data: any) {
        await new this.model({ ...data }).save();
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
