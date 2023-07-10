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
    other: string;

}

export const LogSchema = SchemaFactory.createForClass(Log);

