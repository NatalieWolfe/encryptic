import * as config from 'config';
import {Sequelize} from 'sequelize';

export const sequelize = new Sequelize(config.get('database.connectionString'));
