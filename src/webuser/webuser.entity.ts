import { Entity, Column, PrimaryColumn, BeforeInsert, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class WebUserEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ length: 192 })
    name: string;

    @Column({ length: 382 })
    email: string;

    @Column({ length: 96, nullable: true })
    password: string;

    @Column()
    banned: number;

    @Column({ type: 'timestamp', nullable: true })
    time_reg: Date;

    @Column({ length: 50 })
    login_via: string;

    @Column()
    confirmed_email: number;

    @Column({ length: 250, nullable: true })
    emailconfirmkey: string;

    @Column({ length: 250, nullable: true })
    publicid: string;

    @Column({ length: 100, nullable: true })
    web3: string;

    @Column()
    firstrain: number;

    @Column({ length: 255 ,nullable: true})
    csrf: string;
}
