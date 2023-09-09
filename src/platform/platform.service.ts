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
        const platform_snipe = await this.model.findOne({ id: 'snipe' }).exec();
        if (!platform_snipe) {
            const data = {
                id: 'snipe',
                contracts: []
            }
            return await new this.model({ ...data }).save();
        }

        const platform_limit = await this.model.findOne({ id: 'limit' }).exec();
        if (!platform_limit) {
            const data = {
                id: 'limit',
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

    async update24hAff(data: any) {
        const h24 = await this.model.findOne({ id: "h24_aff" }).exec();
        if (h24) {
            await this.model.findOneAndUpdate({ id: "h24_aff" }, { contracts: data.contracts })
        } else {
            await new this.model({ ...data }).save()
        }
    }

    async update24hLead(data: any) {
        const h24 = await this.model.findOne({ id: "h24_lead" }).exec();
        if (h24) {
            await this.model.findOneAndUpdate({ id: "h24_lead" }, { contracts: data.contracts })
        } else {
            await new this.model({ ...data }).save()
        }
    }

    // call this function to get last 24 hours's top 50 volume(both aff and lead)
    async getTop50Volume(id: string) { 
        const res = await this.model.findOne({ id }); 
        const contracts = res.contracts;
        var v_list = [];
        contracts.forEach((c) => {
            const l = JSON.parse(c)
            v_list.push(l)
        })
        return v_list;
    }

}
