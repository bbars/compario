import SqlModel from './utils/SqlModel.js';
import ComparioInputViewWrapper from './ComparioInputViewWrapper.js';

export default class ComparioCrit extends SqlModel {
	// name = ''
	// options = {}
	// critIndex = -1
	
	static implementations = {};
	
	static registerImplementation(implementationClass) {
		this.implementations[implementationClass.name] = implementationClass;
	}
	
	constructor(compario, name, options = {}) {
		super({ name, options: options || {} });
		this.compario = compario;
		if (typeof this.options.multiplier === 'undefined') {
			this.options.multiplier = 1;
		}
	}
	
	static getDefinition() {
		return {
			name: 'ComparioCrit',
			columns: {
				type: 'varchar(1024) not null',
				comparioId: 'integer not null', // parent
				critIndex: 'integer not null', // position in cliteria list
				name: 'varchar(1024) not null',
				options: 'json',
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
		data.options = JSON.parse(data.options);
		const res = this.fromJSON(data);
		return res;
	}
	
	toSQL() {
		const res = this.toJSON();
		res.options = JSON.stringify(res.options);
		return res;
	}
	
	static fromJSON(data) {
		const constructor = this.implementations[data.type];
		if (!constructor) {
			throw new Error(`Unknown Crit type: '${data.type}'`);
		}
		const res = new constructor(null, data.name, data.options);
		Object.assign(res, data);
		return res;
	}
	
	toJSON() {
		const res = Object.assign({}, this);
		delete res.compario;
		res.type = this.type;
		res.comparioId = this.getComparioId();
		res.critIndex = this.getCritIndex();
		return res;
	}
	
	get type() {
		return this.constructor.name;
	}
	
	set type(value) {
		if (value !== this.constructor.name) {
			throw new Error(`Wrong Crit type '${value}' != '${this.constructor.name}'`);
		}
	}
	
	getComparioId() {
		return !this.compario ? undefined : this.compario.comparioId;
	}
	
	getCritIndex() {
		return !this.compario ? -1 : this.compario.crits.indexOf(this);
	}
	
	compare(a, b) {
		a = this.score(a);
		b = this.score(b);
		if (!a === !b) {
			return 0;
		}
		else {
			return (!a && b) ? 1 : -1;
		}
	}
	
	normValue(value) {
		value = typeof value === 'undefined' ? [] : [].concat(value);
		if (value.length === 0) {
			return null;
		}
		if (value.length === 1) {
			return value[0];
		}
		let powSum = value.reduce((l, r) => l + r * r, 0);
		return Math.pow(powSum, 1 / value.length);
	}
	
	createOptionsInputViews() {
		const multiplier = document.createElement('input');
		multiplier.type = 'number';
		return {
			multiplier,
		};
	}
	
	createValueInputViewWrapper() {
		throw new Error("Method 'createValueInputViewWrapper' is abstract");
	}
	
	static createOptionsInputViewWrapper() {
		return new this.OptionsInputViewWrapper();
	}
}

ComparioCrit.OptionsInputViewWrapper = class extends ComparioInputViewWrapper {
	constructor() {
		super();
		this.views = {};
		this.views.multiplier = document.createElement('input');
		this.views.multiplier.type = 'number';
		this.views.multiplier.step = 0.001;
	}
	
	get value() {
		return {
			multiplier: +this.views.multiplier.value,
		};
	}
	
	set value({ multiplier }) {
		this.views.multiplier.value = multiplier;
	}
	
	getViews() {
		return this.views;
	}
};
