export default class SqlModel {
	constructor(data) {
		const definition = this.constructor.getDefinition();
		if (data && typeof data === 'object') {
			for (const k in definition.columns) {
				if (typeof data[k] === 'undefined') {
					continue;
				}
				this[k] = data[k];
			}
		}
	}
	
	static getDefinition() {
		throw new Error("Not implemented");
	}
	
	static getTableName() {
		return this.getDefinition().name;
	}
	
	static fromSQL(data) {
		return new this(data);
	}
	
	toSQL() {
		return this;
	}
	
	static getUpsertSQL(items, columns) {
		const definition = this.getDefinition();
		columns = !columns ? Object.keys(definition.columns) : columns.filter((column) => {
			return !!definition.columns[column];
		});
		const tableName = this.getTableName();
		items = [].concat(items);
		let sql = '';
		const values = [];
		
		let insertRows = [];
		for (let i = 0; i < items.length; i++) {
			const item = !items[i].toSQL ? items[i] : items[i].toSQL();
			for (const column of columns) {
				values.push(typeof item[column] === 'undefined' ? null : item[column]);
			}
		}
		
		const insertColumns = '(' + columns.join(', ') + ')';
		insertRows = new Array(items.length).fill('(' + new Array(columns.length).fill('?').join(', ') + ')').join('\n, ');
		
		let uniqueKeys = [];
		if (definition.primaryKey) {
			uniqueKeys.push(definition.primaryKey);
		}
		uniqueKeys = !definition.uniqueKeys ? [] : uniqueKeys.concat(Object.values(definition.uniqueKeys));
		const onConflicts = uniqueKeys.map(function (uniqueColumns) {
			uniqueColumns = [].concat(uniqueColumns).reduce((res, column) => {
				if (column) {
					res[column] = column;
				}
				return res;
			}, {});
			
			let updateColumns = [];
			for (const column of columns) {
				if (uniqueColumns[column]) {
					continue;
				}
				updateColumns.push(column + ' = IFNULL(excluded.' + column + ', ' + column + ')');
			}
			return 'ON CONFLICT (' + Object.keys(uniqueColumns).join(', ') + ') DO UPDATE SET\n  ' + updateColumns.join('\n, ');
		});
		
		sql = 'INSERT OR REPLACE INTO ' + tableName
			+ '\n  ' + insertColumns
			+ '\nVALUES'
			+ '\n  ' + insertRows
			+ '\n' + onConflicts.join('\n')
		;
		
		return [sql, values];
	}
	
	static getCreateTableSQL() {
		const definition = this.getDefinition();
		const tableName = this.getTableName();
		let sql = [];
		for (const k in definition.columns) {
			sql.push('[' + k + '] ' + definition.columns[k]);
		}
		sql = '\t  ' + sql.join('\n\t, ');
		
		if (definition.uniqueKeys) {
			for (const indexName in definition.uniqueKeys) {
				sql += '\n, CONSTRAINT "' + indexName + '" UNIQUE("' + definition.uniqueKeys[indexName].join('", "') + '")';
			}
		}
		
		sql = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' (\n' + sql + '\n)';
		
		if (definition.indexes) {
			for (const indexName in definition.indexes) {
				sql += '\n; CREATE INDEX "' + indexName + '" ON ' + tableName + ' ("' + definition.indexes[indexName].join('", "') + '")';
			}
		}
		
		return sql;
	}
	
	static makeModel(constructor, definition) {
		if (!constructor) {
			constructor = class AnonymousSqlModel extends SqlModel {
				static getDefinition() {
					return definition;
				}
			};
			Object.defineProperty(constructor, 'name', {
				value: definition.name,
				writable: false,
			});
		}
		
		constructor.getDefinition = constructor.getDefinition || definition.getDefinition || (() => definition);
		constructor.getTableName = constructor.getTableName || definition.getTableName || SqlModel.getTableName;
		constructor.fromSQL = constructor.fromSQL || definition.fromSQL || SqlModel.fromSQL;
		constructor.prototype.toSQL = constructor.prototype.toSQL || definition.toSQL || SqlModel.prototype.toSQL;
		constructor.getUpsertSQL = constructor.getUpsertSQL || definition.getUpsertSQL || SqlModel.getUpsertSQL;
		constructor.getCreateTableSQL = constructor.getCreateTableSQL || definition.getCreateTableSQL || SqlModel.getCreateTableSQL;
		
		return constructor;
	}
}
