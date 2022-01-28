import ComparioCrit from './ComparioCrit.js';
import ComparioCritVector from './ComparioCritVector.js';

export default class ComparioCritSquare extends ComparioCritVector {
	createValueInputViewWrapper() {
		return new this.constructor.ValueInputViewWrapper(this);
	}
	
	normValue(value) {
		value = typeof value === 'undefined' ? [] : [].concat(value);
		if (value.length === 0) {
			return null;
		}
		if (value.length === 1) {
			return value[0];
		}
		let mul = value.reduce((l, r) => l * r, 1);
		return mul;
	}
	
	static ValueInputViewWrapper = class extends ComparioCritVector.ValueInputViewWrapper {
		toString() {
			const value = this.value;
			return '' + value[0] + ' * ' + value[1];
		}
	}
}

ComparioCrit.registerImplementation(ComparioCritSquare);
