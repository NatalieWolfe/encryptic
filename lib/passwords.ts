import {
  Association,
  DataTypes,
  HasManyGetAssociationsMixin,
  HasManySetAssociationsMixin,
  HasOneGetAssociationMixin,
  Model,
  Optional
} from 'sequelize';

import {sequelize} from './database';

interface PasswordAttributes {
  id: number;
  username: string | null;
  email: string;
  hint: string;
}
interface PasswordCreationAttributes extends Optional<PasswordAttributes, 'id'>
{}

export class Password
  extends Model<PasswordAttributes, PasswordCreationAttributes>
  implements PasswordAttributes
{
  public readonly id!: number;
  public readonly username!: string | null;
  public readonly email!: string;
  public readonly hint!: string;

  public readonly createdAt!: Date;

  public getChunks!: HasManyGetAssociationsMixin<PasswordChunk>;
  public setChunks!: HasManySetAssociationsMixin<PasswordChunk, number>;

  public static associations: {
    chunks: Association<Password, PasswordChunk>
  };
}

interface ChunkAttributes {
  id: number;
  chunk: string;
}
interface ChunkCreationAttributes extends Optional<ChunkAttributes, 'id'> {}

export class Chunk
  extends Model<ChunkAttributes, ChunkCreationAttributes>
  implements ChunkAttributes
{
  public readonly id!: number;
  public readonly chunk!: string;

  public readonly createdAt!: Date;

  public getPasswords!: HasManyGetAssociationsMixin<PasswordChunk>;

  public static associations: {
    passwords: Association<Chunk, PasswordChunk>
  };
}

interface PasswordChunkAttributes {
  passwordId: number;
  chunkId: number;
  chunkOrder: number;
}

export class PasswordChunk
  extends Model<PasswordChunkAttributes>
  implements PasswordChunkAttributes
{
  public readonly passwordId!: number;
  public readonly chunkId!: number;
  public readonly chunkOrder!: number;

  public readonly createdAt!: Date;

  public getPassword!: HasOneGetAssociationMixin<Password>;
  public getChunk!: HasOneGetAssociationMixin<Chunk>;
}

Password.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(128),
    unique: true
  },
  email: {
    type: DataTypes.STRING(128),
    unique: true,
    allowNull: false
  },
  hint: {
    type: DataTypes.STRING(512),
    allowNull: false
  }
}, {sequelize, updatedAt: false});

Chunk.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  chunk: {
    type: DataTypes.CHAR(16),
    unique: true,
    allowNull: false
  }
}, {sequelize, updatedAt: false});

PasswordChunk.init({
  passwordId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  chunkId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  chunkOrder: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: false
  }
}, {
  sequelize,
  updatedAt: false,
  indexes: [{unique: true, fields: ['passwordId', 'chunkOrder']}]
});

Password.hasMany(PasswordChunk, {foreignKey: 'passwordId', as: 'chunks'});
PasswordChunk.belongsTo(Password, {foreignKey: 'passwordId'});

Chunk.hasMany(PasswordChunk, {foreignKey: 'chunkId', as: 'passwords'});
PasswordChunk.belongsTo(Chunk, {foreignKey: 'chunkId'});
