import { EventTarget, CustomEvent } from './utils/events.js';

export default class ComparioInputViewWrapper {
	constructor() {
		this.events = new EventTarget();
	}
	
	get value() {
		throw new Error("Getter-method 'value' is abstract");
	}
	
	set value(value) {
		throw new Error("Setter-method 'value' is abstract");
	}
	
	getViews() {
		throw new Error("Method 'getViews' is abstract");
	}
	
	_dispatchEvent(eventName, eventDetails) {
		this.events.dispatchEvent(new CustomEvent(eventName, {
			details: eventDetails,
		}));
	}
}
