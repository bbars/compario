import ComparioCrit from './ComparioCrit.js';
import ComparioInputViewWrapper from './ComparioInputViewWrapper.js';

export default class ComparioCritNumber extends ComparioCrit {
	constructor(...args) {
		super(...args);
		if (typeof this.options.min === 'undefined') {
			this.options.min = null;
		}
		if (typeof this.options.max === 'undefined') {
			this.options.max = null;
		}
	}
	
	createValueInputViewWrapper() {
		return new this.constructor.ValueInputViewWrapper(this);
	}
	
	static ValueInputViewWrapper = class extends ComparioInputViewWrapper {
		constructor(crit) {
			super();
			
			this.view = document.createElement('input');
			this.view.type = 'number';
			this.view.min = crit.options.min;
			this.view.max = crit.options.max;
			this.view.step = 0.001;
			this.view.addEventListener('change', (event) => {
				super._dispatchEvent('change');
				this.view.reportValidity();
			});
		}
		
		get value() {
			return !this.view.checkValidity() ? null : +this.view.value;
		}
		
		set value(value) {
			this.view.value = value;
			this.view.reportValidity();
			super._dispatchEvent('change');
		}
		
		toString() {
			return '' + this.value;
		}
		
		getViews() {
			return { number: this.view };
		}
	}
}

ComparioCrit.registerImplementation(ComparioCritNumber);

ComparioCritNumber.OptionsInputViewWrapper = class extends ComparioCrit.OptionsInputViewWrapper {
	constructor() {
		super();
		
		this.views.min = document.createElement('input');
		this.views.min.type = 'number';
		// this.views.min.step = 0.001;
		
		this.views.max = document.createElement('input');
		this.views.max.type = 'number';
		// this.views.max.step = 0.001;
	}
	
	get value() {
		return Object.assign(super.value, {
			min: this.views.min.value,
			max: this.views.max.value,
		});
	}
	
	set value(value) {
		super.value = value;
		this.views.min.value = value.min;
		this.views.max.value = value.max;
	}
	
	getViews() {
		return this.views;
	}
};
