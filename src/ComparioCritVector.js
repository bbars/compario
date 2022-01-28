import ComparioCrit from './ComparioCrit.js';
import ComparioInputViewWrapper from './ComparioInputViewWrapper.js';

export default class ComparioCritVector extends ComparioCrit {
	constructor(...args) {
		super(...args);
		if (typeof this.options.minX === 'undefined') {
			this.options.minX = null;
		}
		if (typeof this.options.maxX === 'undefined') {
			this.options.maxX = null;
		}
		if (typeof this.options.minY === 'undefined') {
			this.options.minY = null;
		}
		if (typeof this.options.maxY === 'undefined') {
			this.options.maxY = null;
		}
	}
	
	createValueInputViewWrapper() {
		return new this.constructor.ValueInputViewWrapper(this);
	}
	
	static createOptionsInputViewWrapper() {
		return new this.OptionsInputViewWrapper(this);
	}
	
	static ValueInputViewWrapper = class extends ComparioInputViewWrapper {
		constructor(crit) {
			super();
			this.views = {};
			
			this.views.x = document.createElement('input');
			this.views.x.type = 'number';
			this.views.x.min = crit.options.minX;
			this.views.x.max = crit.options.maxX;
			this.views.x.step = 0.001;
			this.views.x.addEventListener('change', (event) => {
				super._dispatchEvent('change');
				this.views.x.reportValidity();
			});
			
			this.views.y = document.createElement('input');
			this.views.y.type = 'number';
			this.views.y.min = crit.options.minY;
			this.views.y.max = crit.options.maxY;
			this.views.y.step = 0.001;
			this.views.y.addEventListener('change', (event) => {
				super._dispatchEvent('change');
				this.views.y.reportValidity();
			});
		}
		
		get value() {
			return [
				!this.views.x.checkValidity() ? null : +this.views.x.value,
				!this.views.y.checkValidity() ? null : +this.views.y.value,
			];
		}
		
		set value(value) {
			if (value == null) {
				return;
			}
			this.views.x.value = value[0];
			this.views.x.reportValidity();
			this.views.y.value = value[1];
			this.views.y.reportValidity();
			super._dispatchEvent('change');
		}
		
		toString() {
			const value = this.value;
			return '' + value[0] + ', ' + value[1];
		}
		
		getViews() {
			return Object.assign({}, this.views);
		}
	}
}

ComparioCrit.registerImplementation(ComparioCritVector);

ComparioCritVector.OptionsInputViewWrapper = class extends ComparioCrit.OptionsInputViewWrapper {
	constructor() {
		super();
		
		this.views.minX = document.createElement('input');
		this.views.minX.type = 'number';
		// this.views.minX.step = 0.001;
		
		this.views.maxX = document.createElement('input');
		this.views.maxX.type = 'number';
		// this.views.maxX.step = 0.001;
		
		this.views.minY = document.createElement('input');
		this.views.minY.type = 'number';
		// this.views.minY.step = 0.001;
		
		this.views.maxY = document.createElement('input');
		this.views.maxY.type = 'number';
		// this.views.maxY.step = 0.001;
	}
	
	get value() {
		return Object.assign(super.value, {
			minX: this.views.minX.value,
			maxX: this.views.maxX.value,
			minY: this.views.minY.value,
			maxY: this.views.maxY.value,
		});
	}
	
	set value(value) {
		super.value = value;
		this.views.minX.value = value.minX;
		this.views.maxX.value = value.maxX;
		this.views.minY.value = value.minY;
		this.views.maxY.value = value.maxY;
	}
	
	getViews() {
		return Object.assign({}, this.views);
	}
};
