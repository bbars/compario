const tplBase = document.createElement('template');
tplBase.innerHTML = `
	<style>
	
	:host {
		display: inline-block;
		width: 350px;
		height: 200px;
		--overlay-background: rgba(0,0,0, 0.2);
		--loader-content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2rem" height="2rem" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"><circle cx="50" cy="50" r="50" fill="HighlightText" /><g fill="Highlight"><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(0 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.9375s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(22.5 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.875s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(45 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.8125s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(67.5 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.75s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(90 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.6875s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(112.5 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.625s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(135 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5625s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(157.5 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(180 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.4375s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(202.5 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.375s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(225 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.3125s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(247.5 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.25s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(270 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.1875s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(292.5 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.125s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(315 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.0625s" repeatCount="indefinite"></animate></rect><rect x="46.5" y="15" rx="3.36" ry="3.36" width="7" height="12" transform="rotate(337.5 50 50)"><animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animate></rect></g></svg>');
	}
	:host #elWrapper {
		position: relative;
		width: 100%;
		height: 100%;
	}
	:host #elOverlay {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background: var(--overlay-background);
		
		transition: opacity 0.2s ease, visibility 0s linear 0.2s;
		opacity: 0;
		visibility: hidden;
	}
	:host #elOverlay.show {
		transition: opacity 0.2s ease, visibility 0s linear 0s;
		opacity: 1;
		visibility: visible;
	}
	:host #elLoader {
		position: absolute;
		display: inline-block;
		vertical-align: middle;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
	:host #elLoader:before {
		content: var(--loader-content);
		display: inline-block;
		margin-top: 0.25em;
	}
	
	</style>
	<div id="elWrapper">
		<slot id="elSlot"></slot>
		<div id="elOverlay">
			<div id="elLoader"></div>
		</div>
	</div>
`;

function dispatchEvent(element, eventType, detail) {
	const event = new CustomEvent(eventType, {
		detail: detail,
		bubbles: true,
	});
	element.dispatchEvent(event);
	return event;
}

export default class LoaderView extends HTMLElement {
	_knownChildren = new Set();
	_loadingChildren = new Set();
	_loading = 0;
	
	attributeChangedCallback(name, oldValue, newValue) {
		if (this._ignoreAttributeChanges) {
			return;
		}
		if (this.constructor.observedAttributes.indexOf(name) > -1) {
			if (this.constructor.boolAttributes.indexOf(name) > -1) {
				newValue = newValue != null;
			}
			name = name.replace(/([a-z])-([a-z])/g, (m0, m1, m2) => {
				return m1 + m2.toUpperCase();
			});
			this[name] = newValue;
		}
	}
	
	_linkAttributeGet(name) {
		if (this.constructor.boolAttributes.indexOf(name) > -1) {
			return this.hasAttribute(name);
		}
		else {
			return this.getAttribute(name);
		}
	}
	
	_linkAttributeSet(name, value) {
		try {
			this._ignoreAttributeChanges++;
			if (this.constructor.boolAttributes.indexOf(name) > -1) {
				value = !!value;
				if (this.hasAttribute(name) === value) {
					return false;
				}
				if (value) {
					this.setAttribute(name, '');
				}
				else {
					this.removeAttribute(name);
				}
			}
			else {
				value = '' + value;
				if (this.getAttribute(name) === value) {
					return false;
				}
				this.setAttribute(name, value);
			}
			return true;
		}
		finally {
			this._ignoreAttributeChanges--;
		}
	}
	
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(tplBase.content.cloneNode(true));
		
		this.shadowRoot.elSlot = this.shadowRoot.getElementById('elSlot');
		this.shadowRoot.elOverlay = this.shadowRoot.getElementById('elOverlay');
		
		this.$$onSlotChange = this.$$onSlotChange.bind(this);
		this.$$onLoadStart = this.$$onLoadStart.bind(this);
		this.$$onLoad = this.$$onLoad.bind(this);
		this.$$onError = this.$$onError.bind(this);
	}
	
	connectedCallback() {
		this.shadowRoot.elSlot.addEventListener('slotchange', this.$$onSlotChange);
	}
	
	disconnectedCallback() {
		this.shadowRoot.elSlot.removeEventListener('slotchange', this.$$onSlotChange);
	}
	
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	
	get loading() {
		return this._loading;
	}
	set loading(value) {
		value = +value;
		this._loading = value;
		this.shadowRoot.elOverlay.classList.toggle('show', this._loading > 0);
	}
	
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	
	_onAddChild(el) {
		el.addEventListener('loadstart', this.$$onLoadStart);
		el.addEventListener('load', this.$$onLoad);
		el.addEventListener('error', this.$$onError);
		
		if (el.complete === false) {
			this.loading++;
			this._loadingChildren.add(el);
		}
	}
	
	_onDeleteChild(el) {
		
		el.removeEventListener('loadstart', this.$$onLoadStart);
		el.removeEventListener('load', this.$$onLoad);
		el.removeEventListener('error', this.$$onError);
		
		if (this._loadingChildren.has(el)) {
			this.loading--;
			this._loadingChildren.delete(el);
		}
	}
	
	$$onSlotChange(event) {
		const _current = new Set(this.children);
		for (let el of this._knownChildren) {
			if (!_current.has(el)) {
				// removed
				this._knownChildren.delete(el);
				this._onDeleteChild(el);
			}
		}
		for (let el of _current) {
			if (!this._knownChildren.has(el)) {
				// added
				this._knownChildren.add(el);
				this._onAddChild(el);
			}
		}
	}
	
	$$onLoadStart(event) {
		if (this._loadingChildren.has(event.target)) {
			return;
		}
		this.loading++;
		this._loadingChildren.add(event.target);
	}
	
	$$onLoad(event) {
		if (!this._loadingChildren.has(event.target)) {
			return;
		}
		this.loading--;
		this._loadingChildren.delete(event.target);
	}
	
	$$onError(event) {
		if (!this._loadingChildren.has(event.target)) {
			return;
		}
		this.loading--;
		this._loadingChildren.delete(event.target);
	}
}

window.customElements.define('loader-view', LoaderView);
