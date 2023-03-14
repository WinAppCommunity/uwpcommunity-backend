import { Column, CreatedAt, Model, Table, UpdatedAt, PrimaryKey, AutoIncrement, DataType, HasMany } from 'sequelize-typescript';
import Project from './Project';


/** @summary Due to time contraints, this is no longer in use. Might be re-enabled again in the future if needed */
@Table
export default class Category extends Model<Category> {

    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id: number;

    @Column
    name!: string;

    @HasMany(() => Project, 'categoryId')
    projects?: Project[];

    @CreatedAt
    @Column
    declare createdAt: Date;

    @UpdatedAt
    @Column
    declare updatedAt: Date;
}

async function GetCategoryIdFromName(name: string): Promise<number | undefined> {
    const catDb = await Category.findOne({ where: { name: name } }).catch(() => { });
    if (!catDb) return;
    return (catDb.id);
}

async function GetCategoryNameFromId(id: number): Promise<string | undefined> {
    const catDb = await Category.findOne({ where: { id: id } }).catch(() => { });
    if (!catDb) return;
    return (catDb.name);
}
