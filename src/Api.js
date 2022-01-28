import ApiBase from './utils/ApiBase.js';
import JSONSchema from './utils/JSONSchema.js';
import DB from './utils/DB.js';
import models from './models.js';
import fsPromises from 'fs/promises';

export default class Api extends ApiBase {
	async $invoke(...args) {
		try {
			return await super.$invoke(...args);
		}
		catch (err) {
			console.warn("API ERR", err);
			throw err;
		}
	}
	
	getPublicApiFunctions() {
		const res = super.getPublicApiFunctions();
		for (const name in res) {
			res[name].returnJSONSchema = this[name + '_JSONSchema'];
		}
		return res;
	}
	
	test(s1, s2) {
		return new String(s1 + ' ' + s2);
	}
	
	test_JSONSchema = new JSONSchema(String);
	
	async saveCompario(comp) {
		comp.comparioId = null;
		comp = JSONSchema.make(models.Compario, comp);
		await comp.init();
		let rows, dbRes;
		
		rows = [comp];
		dbRes = await this.R.db.run(...models.Compario.getUpsertSQL(rows));
		comp.comparioId = dbRes.lastID;
		
		rows = comp.crits;
		await this.R.db.run(`
			DELETE
			FROM ComparioCrit
			WHERE comparioId = ?
		`, [comp.comparioId]);
		if (rows.length > 0) {
			dbRes = await this.R.db.run(...models.ComparioCrit.getUpsertSQL(rows));
		}
		
		rows = comp.items;
		await this.R.db.run(`
			DELETE
			FROM ComparioItem
			WHERE comparioId = ?
		`, [comp.comparioId]);
		if (rows.length > 0) {
			dbRes = await this.R.db.run(...models.ComparioItem.getUpsertSQL(rows));
		}
		
		rows = [].concat(...comp.values);
		await this.R.db.run(`
			DELETE
			FROM ComparioValueWrapper
			WHERE comparioId = ?
		`, [comp.comparioId]);
		if (rows.length > 0) {
			dbRes = await this.R.db.run(...models.ComparioValueWrapper.getUpsertSQL(rows));
		}
		
		return comp;
	}
	
	saveCompario_JSONSchema = new JSONSchema(models.Compario);
	
	async getCompario(comparioId) {
		const comp = await this.R.db.queryOne(`
			SELECT * from Compario where comparioId = ?
		`, [comparioId], models.Compario);
		if (!comp) {
			return null;
		}
		let rows;
		
		rows = await this.R.db.query(`
			SELECT * from ComparioCrit where comparioId = ?
		`, [comparioId], models.ComparioCrit);
		// console.log('ComparioCrit', rows);
		for (const row of rows) {
			comp.crits[row.critIndex] = row;
		}
		
		rows = await this.R.db.query(`
			SELECT * from ComparioItem where comparioId = ?
		`, [comparioId], models.ComparioItem);
		// console.log('ComparioItem', rows);
		for (const row of rows) {
			comp.items[row.itemIndex] = row;
		}
		
		rows = await this.R.db.query(`
			SELECT * from ComparioValueWrapper where comparioId = ?
		`, [comparioId], models.ComparioValueWrapper);
		// console.log('ComparioValueWrapper', rows);
		for (const row of rows) {
			if (!comp.values[row.itemIndex]) {
				comp.values[row.itemIndex] = [];
			}
			comp.values[row.itemIndex][row.critIndex] = row;
		}
		
		// console.log('Compario', comp);
		
		comp.init();
		return comp;
	}
	
	getCompario_JSONSchema = new JSONSchema(models.Compario);
}
