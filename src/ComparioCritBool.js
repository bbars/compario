import ComparioCrit from './ComparioCrit.js';
import ComparioInputViewWrapper from './ComparioInputViewWrapper.js';

export default class ComparioCritBool extends ComparioCrit {
	createValueInputViewWrapper() {
		return new this.constructor.ValueInputViewWrapper(this);
	}
	
	static ValueInputViewWrapper = class extends ComparioInputViewWrapper {
		constructor(crit) {
			super();
			
			this.view = document.createElement('input');
			this.view.type = 'checkbox';
			this.view.addEventListener('change', (event) => super._dispatchEvent('change'));
		}
		
		get value() {
			return +this.view.checked;
		}
		
		set value(value) {
			this.view.checked = !!value;
			super._dispatchEvent('change');
		}
		
		toString() {
			return this.value ? 'Yes' : 'No';
		}
		
		getViews() {
			return { checkbox: this.view };
		}
	};
}

ComparioCrit.registerImplementation(ComparioCritBool);
