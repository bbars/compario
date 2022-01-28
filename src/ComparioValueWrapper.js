import SqlModel from './utils/SqlModel.js';
import { CustomEvent } from './utils/events.js';

const PROP_VALUE = Symbol('value');

export default class ComparioValueWrapper extends SqlModel {
	constructor(compario, value) {
		super({ value });
		this.compario = compario;
	}
	
	get value() {
		return this[PROP_VALUE];
	}
	
	set value(value) {
		const prevValue = this[PROP_VALUE];
		this[PROP_VALUE] = value;
		if (this.compario) {
			this.compario.events.dispatchEvent(new CustomEvent('value.change', {
				detail: {
					compario: this.compario,
					valueWrapper: this,
					value: value,
					prevValue: value,
				},
			}));
		}
	}
	
	static getDefinition() {
		return {
			name: this.name,
			columns: {
				comparioId: 'integer not null', // parent-parent
				critIndex: 'integer not null', // position in cliteria list
				itemIndex: 'integer not null', // position in item list
				value: 'json',
			},
			indexes: {
				comparioId: ['comparioId'],
			},
			uniqueKeys: {
				// name: ['comparioId', 'name'],
			},
		};
	}
	
	static fromSQL(data) {
		const res = this.fromJSON(data);
		res.value = JSON.parse(res.value);
		return res;
	}
	
	toSQL() {
		const res = this.toJSON();
		res.value = JSON.stringify(res.value);
		return res;
	}
	
	static fromJSON(data) {
		const res = new this(null, data.value);
		Object.assign(res, data);
		return res;
	}
	
	toJSON() {
		const res = Object.assign({}, this);
		delete res.compario;
		res.comparioId = this.getComparioId();
		res.value = this.value;
		Object.assign(res, this.getCritItemIndexes());
		return res;
	}
	
	getComparioId() {
		return !this.compario ? undefined : this.compario.comparioId;
	}
	
	getCritItemIndexes() {
		const res = { critIndex: -1, itemIndex: -1 };
		if (this.compario) {
			for (let itemIndex = this.compario.values.length - 1; itemIndex >= 0; itemIndex--) {
				let critIndex = this.compario.values[itemIndex].indexOf(this);
				if (critIndex > -1) {
					res.critIndex = critIndex;
					res.itemIndex = itemIndex;
					return res;
				}
			}
		}
		return res;
	}
	
	getCrit() {
		if (!this.compario) {
			return null;
		}
		const { critIndex } = this.getCritItemIndexes();
		return this.compario.crits[critIndex];
	}
	
	getItem() {
		if (!this.compario) {
			return null;
		}
		const { itemIndex } = this.getCritItemIndexes();
		return this.compario.items[itemIndex];
	}
	
	createInputViewWrapper() {
		const crit = this.getCrit();
		if (!crit) {
			return null;
		}
		const valueWrapper = crit.createValueInputViewWrapper();
		valueWrapper.value = this.value;
		return valueWrapper;
	}
}
