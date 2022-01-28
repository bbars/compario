const tplBase = document.createElement('template');
tplBase.innerHTML = `
	<style>
	
	:host {
		display: inline-block;
		width: 350px;
		height: 200px;
	}
	:host #elWrapper {
		position: relative;
		width: 100%;
		height: 100%;
	}
	:host #elContainer {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}
	
	:host ::slotted(*) {
		display: block;
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		
		transition: all 0.2s ease;
		opacity: 0;
	}
	:host ::slotted(:last-child) {
		opacity: 1;
	}
	:host #elBtnBack {
		position: absolute;
		left: 1em;
		top: 1em;
		width: 3em;
		height: 3em;
		cursor: pointer;
		background-color: rgba(0,0,0, 0.5);
		background-image: url('data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewport="0 0 80 80" preserveAspectRatio="none" transform="scale(-1, 1)" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M 44 27 L 56 40 L 44 53  M 56 40 h -30" /></svg>');
		background-size: contain;
		background-position: right center;
		background-repeat: no-repeat;
		border-radius: 8em;
		user-select: none;
		
		display: none;
	}
	
	</style>
	<div id="elWrapper">
		<slot id="elContainer"></slot>
		<div id="elBtnBack"></div>
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

export default class FragmentView extends HTMLElement {
	static get observedAttributes() {
		return [];
	}
	
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(tplBase.content.cloneNode(true));
		this.shadowRoot.elWrapper = this.shadowRoot.getElementById('elWrapper');
		this.shadowRoot.elBtnBack = this.shadowRoot.getElementById('elBtnBack');
		this.shadowRoot.elContainer = this.shadowRoot.getElementById('elContainer');
	}
	
	connectedCallback() {
		this.shadowRoot.$$onBackBtnClick = this.$$onBackBtnClick.bind(this);
		
		this.shadowRoot.elBtnBack.addEventListener('click', this.shadowRoot.$$onBackBtnClick);
	}
	disconnectedCallback() {
		this.shadowRoot.elBtnBack.removeEventListener('click', this.shadowRoot.$$onBackBtnClick);
	}
	
	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		else if (this.constructor.observedAttributes.indexOf(name) > -1) {
			this[name] = newValue;
		}
	}
	
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	
	back() {
		if (!this.children.length) {
			return null;
		}
		const fragment = this.children[this.children.length - 1];
		this.removeChild(fragment);
		return fragment;
	}
	
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	
	$$onBackBtnClick(event) {
		if (event.target === this.shadowRoot.elBtnBack) {
			this.back();
		}
	}
}

window.customElements.define('fragment-view', FragmentView);
