import SqlModel from './utils/SqlModel.js';
import JSONSchema from './utils/JSONSchema.js';
import ComparioCrit from './ComparioCrit.js';
import ComparioItem from './ComparioItem.js';
import ComparioValueWrapper from './ComparioValueWrapper.js';
import { EventTarget, CustomEvent } from './utils/events.js';

const PROP_SCORES = Symbol('scores');

export default class Compario extends SqlModel {
	// crits: []
	// items: []
	// values: [[]]
	// meta: Object.assign({}, meta || {})
	
	constructor(comparioId, userId, meta) {
		super({ comparioId, userId, meta });
		this.crits = [];
		this.items = [];
		this.values = [];
		this.events = new EventTarget();
		const resetCachedScores = () => delete this[PROP_SCORES];
		const resetCachedScoresEventNames = [
			'crit.add',
			'crit.move',
			'crit.del',
			'item.add',
			'item.move',
			'item.del',
			'value.change',
		];
		resetCachedScoresEventNames.forEach((eventName) => {
			this.events.addEventListener(eventName, resetCachedScores);
		});
		const proxyEventCritChange = (event) => {
			this.events.dispatchEvent(new CustomEvent('crit.modify', {
				detail: {
					compario: event.detail.compario,
					crit: event.detail.crit,
				},
			}));
		};
		this.events.addEventListener('crit.add', proxyEventCritChange);
		this.events.addEventListener('crit.move', proxyEventCritChange);
		this.events.addEventListener('crit.del', proxyEventCritChange);
		const proxyEventItemChange = (event) => {
			this.events.dispatchEvent(new CustomEvent('item.modify', {
				detail: {
					compario: event.detail.compario,
					item: event.detail.item,
				},
			}));
		};
		this.events.addEventListener('item.add', proxyEventItemChange);
		this.events.addEventListener('item.move', proxyEventItemChange);
		this.events.addEventListener('item.del', proxyEventItemChange);
	}
	
	static getDefinition() {
		return {
			name: this.name,
			columns: {
				comparioId: 'INTEGER PRIMARY KEY',
				userId: 'number not null',
				btime: 'timestamp not null',
				mtime: 'timestamp not null',
				meta: 'json null',
			},
			indexes: {
				parentDir: ['parentDir'],
			},
			uniqueKeys: {
				// comparioId: ['comparioId'],
			},
		};
	}
	
	static fromSQL(data) {
		return new this(data.comparioId, data.userId, JSON.parse(data.meta));
	}
	
	toSQL() {
		const res = Object.assign({}, this);
		res.meta = JSON.stringify(res.meta);
		res.btime = res.btime instanceof Date ? res.btime.getTime() : Date.now();
		res.mtime = res.mtime instanceof Date ? res.mtime.getTime() : res.btime;
		return res;
	}
	
	static fromJSON(data) {
		const res = new this(data.comparioId, data.userId, data.meta);
		data = Object.assign({}, data);
		delete data.comparioId;
		delete data.userId;
		delete data.meta;
		Object.assign(res, data);
		return res;
	}
	
	toJSON() {
		const res = Object.assign({}, this);
		delete res.events;
		return res;
	}
	
	static getJSONSchema() {
		return JSONSchema.mix(this, {
			crits: [ComparioCrit],
			items: [ComparioItem],
			values: [[ComparioValueWrapper]],
		});
	}
	
	init() {
		for (let itemIndex = 0; itemIndex < this.items.length; itemIndex++) {
			const item = this.items[itemIndex];
			if (item.compario && item.compario !== this) {
				throw new Error(`Foreign ComparioItem found: '${item.name}'`);
			}
			item.compario = this;
			
			if (!this.values[itemIndex]) {
				this.values[itemIndex] = [];
			}
			
			for (let critIndex = 0; critIndex < this.crits.length; critIndex++) {
				const crit = this.crits[critIndex];
				if (crit.compario && crit.compario !== this) {
					throw new Error(`Foreign ComparioCrit found: '${crit.name}'`);
				}
				crit.compario = this;
				
				const valueWrapper = this.values[itemIndex][critIndex];
				if (!valueWrapper) {
					this.values[itemIndex][critIndex] = new ComparioValueWrapper(this);
				}
				else {
					if (valueWrapper.compario && valueWrapper.compario !== this) {
						throw new Error(`Foreign ComparioValueWrapper found: '${valueWrapper.name}'`);
					}
					valueWrapper.compario = this;
				}
			}
		}
		
		for (let itemIndex = 0; itemIndex < this.items.length; itemIndex++) {
			this.events.dispatchEvent(new CustomEvent('item.modify', {
				detail: {
					compario: this,
					item: this.items[itemIndex],
				},
			}));
			
			for (let critIndex = 0; critIndex < this.crits.length; critIndex++) {
				this.events.dispatchEvent(new CustomEvent('crit.modify', {
					detail: {
						compario: this,
						crit: this.crits[critIndex],
					},
				}));
				
				this.events.dispatchEvent(new CustomEvent('value.modify', {
					detail: {
						compario: this,
						valueWrapper: this.values[itemIndex][critIndex],
					},
				}));
			}
		}
		
		this.events.dispatchEvent(new CustomEvent('init', {
			detail: {
				compario: this,
			},
		}));
		
		return this;
	}
	
	getCrit(critIndex) {
		if (critIndex instanceof ComparioCrit) {
			if (crit.compario !== this) {
				throw new Error(`Foreign ComparioCrit found: '${crit.name}'`);
			}
			critIndex = critIndex.getCritIndex();
		}
		return this.crits[critIndex];
	}
	
	addCrit(crit, critIndex) {
		if (!(crit instanceof ComparioCrit)) {
			crit = this.crits[crit];
			if (!(crit instanceof ComparioCrit)) {
				throw new Error(`Invalid ComparioCrit`);
			}
		}
		const prevCritIndex = this.crits.indexOf(crit);
		let move = false;
		if (prevCritIndex > -1) {
			move = true;
			this.crits.splice(prevCritIndex, 1);
		}
		if (critIndex < 0 || critIndex == null) {
			critIndex = prevCritIndex > -1 ? prevCritIndex : this.crits.length;
		}
		this.crits.splice(critIndex, 0, crit);
		crit.compario = this;
		
		const modifiedValueWrappers = [];
		for (let itemIndex = this.items.length - 1; itemIndex >= 0; itemIndex--) {
			if (move && this.values[itemIndex]) {
				const valueWrappers = this.values[itemIndex];
				if (valueWrappers[prevCritIndex] && valueWrappers[critIndex]) {
					const valueWrapper = valueWrappers.splice(prevCritIndex, 1)[0];
					valueWrappers.splice(critIndex, 0, valueWrapper);
					modifiedValueWrappers.push(valueWrapper);
				}
			}
			else {
				const valueWrapper = this.getValueWrapper(critIndex, itemIndex, true);
				modifiedValueWrappers.push(valueWrapper);
			}
		}
		
		this.events.dispatchEvent(new CustomEvent(!move ? 'crit.add' : 'crit.move', {
			detail: {
				compario: this,
				crit,
				critIndex,
				prevCritIndex,
			},
		}));
		
		for (const valueWrapper of modifiedValueWrappers) {
			this.events.dispatchEvent(new CustomEvent('value.modify', {
				detail: {
					compario: this,
					valueWrapper,
				},
			}));
		}
		
		return crit;
	}
	
	delCrit(critIndex) {
		const crit = this.getCrit(critIndex);
		if (!crit) {
			return null;
		}
		this.crits.splice(crit.getCritIndex(), 1);
		crit.compario = null;
		
		this.events.dispatchEvent(new CustomEvent('crit.del', {
			detail: {
				compario: this,
				crit,
			},
		}));
		
		return crit;
	}
	
	getItem(itemIndex) {
		if (itemIndex instanceof ComparioItem) {
			if (item.compario !== this) {
				throw new Error(`Foreign ComparioItem found: '${item.name}'`);
			}
			itemIndex = itemIndex.getitemIndex();
		}
		return this.items[itemIndex];
	}
	
	addItem(item, itemIndex) {
		if (!(item instanceof ComparioItem)) {
			item = this.items[item];
			if (!(item instanceof ComparioItem)) {
				throw new Error(`Invalid ComparioItem`);
			}
		}
		const prevItemIndex = this.items.indexOf(item);
		let move = false;
		if (prevItemIndex > -1) {
			move = true;
			this.items.splice(prevItemIndex, 1);
		}
		if (itemIndex < 0 || itemIndex == null) {
			itemIndex = prevItemIndex > -1 ? prevItemIndex : this.items.length;
		}
		this.items.splice(itemIndex, 0, item);
		item.compario = this;
		
		const modifiedValueWrappers = [];
		if (move && this.values[prevItemIndex] && this.values[itemIndex]) {
			const valueWrappers = this.values.splice(prevItemIndex, 1)[0];
			this.values.splice(itemIndex, 0, valueWrappers);
			modifiedValueWrappers.push(...valueWrappers);
		}
		else {
			this.values[itemIndex] = [];
			for (const crit of this.crits) {
				const valueWrapper = this.getValueWrapper(crit, itemIndex, true);
				modifiedValueWrappers.push(valueWrapper);
			}
		}
		
		this.events.dispatchEvent(new CustomEvent(!move ? 'item.add' : 'item.move', {
			detail: {
				compario: this,
				item,
				itemIndex,
				prevItemIndex,
			},
		}));
		
		for (const valueWrapper of modifiedValueWrappers) {
			this.events.dispatchEvent(new CustomEvent('value.modify', {
				detail: {
					compario: this,
					valueWrapper,
				},
			}));
		}
		
		return item;
	}
	
	delItem(itemIndex) {
		const item = this.getItem(itemIndex);
		if (!item) {
			return null;
		}
		this.items.splice(item.getItemIndex(), 1);
		item.compario = null;
		
		this.events.dispatchEvent(new CustomEvent('item.del', {
			detail: {
				compario: this,
				item,
			},
		}));
		
		return item;
	}
	
	getValueWrapper(critIndex, itemIndex, force) {
		if (itemIndex instanceof ComparioItem) {
			itemIndex = itemIndex.getItemIndex();
		}
		if (!this.values[itemIndex]) {
			if (!force || !this.items[itemIndex]) {
				return;
			}
			this.values[itemIndex] = [];
		}
		if (critIndex instanceof ComparioCrit) {
			critIndex = critIndex.getCritIndex();
		}
		if (!this.values[itemIndex][critIndex]) {
			if (!force || !this.crits[critIndex]) {
				return;
			}
			this.values[itemIndex][critIndex] = new ComparioValueWrapper(this);
		}
		return this.values[itemIndex][critIndex];
	}
	
	getValue(critIndex, itemIndex) {
		const valueWrapper = this.getValueWrapper(itemIndex, critIndex);
		return valueWrapper && valueWrapper.value;
	}
	
	setValue(critIndex, itemIndex, value) {
		const valueWrapper = this.getValueWrapper(itemIndex, critIndex, true);
		return valueWrapper.value = value;
	}
	
	getScores(forceRecalc) {
		return cachedExecution(this, PROP_SCORES, forceRecalc, this.calcScores, this);
	}
	
	calcScores() {
		const res = [];
		const normValues = [];
		
		for (let itemIndex = this.items.length - 1; itemIndex >= 0; itemIndex--) {
			if (!this.items[itemIndex] || !this.values[itemIndex]) {
				continue;
			}
			res[itemIndex] = 0;
			for (let critIndex = this.crits.length - 1; critIndex >= 0; critIndex--) {
				if (!normValues[critIndex]) {
					normValues[critIndex] = [];
				}
				if (!this.crits[critIndex] || this.values[itemIndex][critIndex] == null) {
					continue;
				}
				normValues[critIndex][itemIndex] = this.crits[critIndex].normValue(this.values[itemIndex][critIndex].value);
			}
		}
		for (let itemIndex = this.items.length - 1; itemIndex >= 0; itemIndex--) {
			for (let critIndex = this.crits.length - 1; critIndex >= 0; critIndex--) {
				if (!normValues[critIndex]) {
					continue;
				}
				if (!normValues[critIndex].normalized) {
					const min = Math.min(...normValues[critIndex]);
					const max = Math.max(...normValues[critIndex]);
					normValues[critIndex] = normValues[critIndex].map((val) => {
						return min === max ? 0 : (val - min) / (max - min);
					});
					normValues[critIndex].normalized = true;
				}
				const crit = this.crits[critIndex];
				if (!crit) {
					continue;
				}
				res[itemIndex] += crit.options.multiplier * normValues[critIndex][itemIndex];
			}
		}
		
		return res;
	}
	
	static calcPercentage(arr, zeroWhenEquals) {
		let min = +Infinity;
		let max = -Infinity;
		for (let i = arr.length - 1; i >= 0; i--) {
			min = Math.min(min, arr[i]);
			max = Math.max(max, arr[i]);
		}
		if (max === min) {
			return new Array(arr.length).fill(zeroWhenEquals ? 0 : 1 / arr.length);
		}
		let normSum = 0;
		const res = arr.map((val) => {
			const normVal = (val - min) / (max - min);
			normSum += normVal;
			return normVal;
		});
		let percSum = 0;
		for (let i = res.length - 1; i >= 1; i--) {
			res[i] = res[i] / normSum;
			percSum += res[i];
		}
		res[0] = 1 - percSum;
		return res;
	}
}

function cachedExecution(obj, cachePropName, forceExecute, func, ctx, ...args) {
	if (typeof obj[cachePropName] !== 'undefined' && !forceExecute) {
		if (obj[cachePropName].err) {
			throw obj[cachePropName].err;
		}
		return obj[cachePropName].res;
	}
	
	try {
		const res = func.apply(ctx || obj, args);
		obj[cachePropName] = { res };
		return res;
	}
	catch (err) {
		obj[cachePropName] = { err };
		throw err;
	}
}
