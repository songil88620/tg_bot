import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type LogDocument = Log & Document;

@Schema()
export class Log {

    @Prop()
    id: string;

    @Prop()
    mode: string;

    @Prop()
    hash: string;

    @Prop()
    panel: number;

    @Prop()
    tokenA: string;

    @Prop()
    tokenB: string;

    @Prop()
    amount: string;

    @Prop()
    t_amount: string;

    @Prop()
    created: string;

    @Prop()
    other: string;

    @Prop()
    createdat: number;

}

export const LogSchema = SchemaFactory.createForClass(Log);

