const tplBase = document.createElement('template');
tplBase.innerHTML = `
	<style>
	
	:host {
		display: block;
		width: 350px;
		height: 200px;
		--max-offset: 100%;
		--gap: 20px;
	}
	:host #elWrapper {
		position: relative;
		overflow: hidden;
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
		transition: opacity 0.4s ease, transform 0.4s ease;
		opacity: 1;
		z-index: 1;
		transform: translateX(0);
	}
	:host ::slotted([hide]) {
		opacity: 0;
		z-index: 0;
	}
	:host ::slotted([hide="left"]) {
		transform: translateX(calc(calc(-1 * var(--max-offset)) + calc(-1 * var(--gap))));
	}
	:host ::slotted([hide="right"]) {
		transform: translateX(calc(calc(+1 * var(--max-offset)) + calc(+1 * var(--gap))));
	}
	
	:host .touchCaptured ::slotted(*) {
		transition: none;
	}
	
	:host .side-btn {
		position: absolute;
		z-index: 1;
		width: 3em;
		height: 6em;
		cursor: pointer;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(0,0,0, 0.5);
		user-select: none;
	}
	:host .side-btn.side-btn-disabled {
		display: none;
	}
	:host #elBtnPrev:before {
	}
	:host #elBtnNext:before {
	}
	:host #elBtnPrev {
		left: 0;
		--background-image: url('data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="50" height="100" viewport="0 0 50 100" preserveAspectRatio="none" transform="scale(-1, 1)"> <path fill="rgba(0,0,0, 0.5)" d="M 50 0 A 50 50 0 0 0 50 100 Z" /> <path fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M 24 37 L 36 50 L 24 63" /></svg>');
		background-image: url('data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="50" height="100" viewport="0 0 50 100" preserveAspectRatio="none" transform="scale(-1, 1)" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M 24 37 L 36 50 L 24 63" /></svg>');
		background-size: contain;
		background-position: left center;
		background-repeat: no-repeat;
		border-top-right-radius: 8em;
		border-bottom-right-radius: 8em;
	}
	:host #elBtnNext {
		right: 0;
		background-image: url('data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="50" height="100" viewport="0 0 50 100" preserveAspectRatio="none" transform="scale(+1, 1)" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M 24 37 L 36 50 L 24 63" /></svg>');
		background-size: contain;
		background-position: right center;
		background-repeat: no-repeat;
		border-top-left-radius: 8em;
		border-bottom-left-radius: 8em;
	}
	
	:host #elWrapper.fadeOut #elBtnPrev,
	:host #elWrapper.fadeOut #elBtnNext {
		animation: fadeOut 0.6s ease 2s;
		animation-fill-mode: both;
		animation-iteration-count: 1;
		animation-play-state: running;
	}
	
	@keyframes fadeOut {
		0% { opacity: 1; }
		100% { opacity: 0; }
	}
	
	</style>
	<div id="elWrapper">
		<slot id="elContainer"></slot>
		<div id="elBtnPrev" class="side-btn side-btn-disabled"></div>
		<div id="elBtnNext" class="side-btn side-btn-disabled"></div>
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

export default class PagerView extends HTMLElement {
	_index = -1;
	
	static get observedAttributes() {
		return ['disabled'];
	}
	
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.appendChild(tplBase.content.cloneNode(true));
		this.shadowRoot.elWrapper = this.shadowRoot.getElementById('elWrapper');
		this.shadowRoot.elBtnPrev = this.shadowRoot.getElementById('elBtnPrev');
		this.shadowRoot.elBtnNext = this.shadowRoot.getElementById('elBtnNext');
		this.shadowRoot.elContainer = this.shadowRoot.getElementById('elContainer');
		
		this.addEventListener('setIndex', this.$$onSetIndex);
		this.setIndex(0);
	}
	
	connectedCallback() {
		this.tabIndex = Math.max(0, this.tabIndex);
		this.disabled = this.getAttribute('disabled') || 0;
		
		this.shadowRoot.$$onKeyDown = this.$$onKeyDown.bind(this);
		this.shadowRoot.$$onSideBtnClick = this.$$onSideBtnClick.bind(this);
		this.shadowRoot.$$onMouseMove = this.$$onMouseMove.bind(this);
		this.shadowRoot.$$onTouchStart = this.$$onTouchStart.bind(this);
		this.shadowRoot.$$onTouchMove = this.$$onTouchMove.bind(this);
		this.shadowRoot.$$onTouchEnd = this.$$onTouchEnd.bind(this);
		
		this.shadowRoot.elBtnPrev.addEventListener('click', this.shadowRoot.$$onSideBtnClick);
		this.shadowRoot.elBtnNext.addEventListener('click', this.shadowRoot.$$onSideBtnClick);
		this.addEventListener('mousemove', this.shadowRoot.$$onMouseMove);
		this.addEventListener('touchstart', this.shadowRoot.$$onTouchStart);
		window.addEventListener('touchmove', this.shadowRoot.$$onTouchMove);
		window.addEventListener('touchend', this.shadowRoot.$$onTouchEnd);
	}
	disconnectedCallback() {
		this.removeEventListener('keydown', this.shadowRoot.$$onKeyDown);
		this.shadowRoot.elBtnPrev.removeEventListener('click', this.shadowRoot.$$onSideBtnClick);
		this.shadowRoot.elBtnNext.removeEventListener('click', this.shadowRoot.$$onSideBtnClick);
		this.removeEventListener('mousemove', this.shadowRoot.$$onMouseMove);
		this.removeEventListener('touchstart', this.shadowRoot.$$onTouchStart);
		window.removeEventListener('touchmove', this.shadowRoot.$$onTouchMove);
		window.removeEventListener('touchend', this.shadowRoot.$$onTouchEnd);
	}
	
	get disabled() {
		return this.hasAttribute('disabled');
	}
	set disabled(value) {
		value = !!value;
		if (!value) {
			this.removeAttribute('disabled');
		}
		else {
			this.cap = null;
			this.setAttribute('disabled', '');
		}
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
	
	async prev() {
		if (this.index <= 0) {
			return null;
		}
		return this.setIndex(this.index - 1);
	}
	
	async next() {
		if (this.index >= this.children.length - 1) {
			return null;
		}
		return this.setIndex(this.index + 1);
	}
	
	async setIndex(value) {
		const oldIndex = this._index;
		const index = +value | 0;
		this._index = index;
		const oldView = this.children[oldIndex];
		const view = this.children[index];
		const event = dispatchEvent(this, 'setIndex', {
			index: index,
			view: view,
			oldIndex: oldIndex,
			oldView: oldView,
		});
		for (let i = this.children.length - 1; i >= 0; i--) {
			let hide = this.children[i].getAttribute('hide');
			if (!hide) {
				this.children[i].setAttribute('hide', index < i ? 'right' : 'left');
			}
		}
		if (!view) {
			return null;
		}
		
		view.removeAttribute('hide');
		
		return view;
	}
	
	get index() {
		return this._index;
	}
	
	set index(value) {
		this.setIndex(value);
	}
	
	$$onSetIndex(event) {
		const index = +event.detail.index;
		this.shadowRoot.elBtnPrev.classList.toggle('side-btn-disabled', index <= 0);
		this.shadowRoot.elBtnNext.classList.toggle('side-btn-disabled', index >= this.children.length - 1);
	}
	
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	
	$$onKeyDown(event) {
		if ([16, 17, 18, 91].indexOf(event.keyCode) > -1) {
			return;
		}
		var keys = [
			event.ctrlKey ? 'ctrl' : '',
			event.altKey ? 'alt' : '',
			event.shiftKey ? 'shift' : '',
			String.fromCharCode(event.keyCode),
		].join('+').replace(/^\+*|\+*$/g, '').replace(/\++/g, '+');
		// console.log(event.keyCode, event.keyCode.toString(16), keys, event.key);
		
		if (keys === 'ctrl+X' || keys === '\x2e') {
			this.focus();
			// event.preventDefault();
			// dispatchEvent(this, 'remove', selectedNotes);
		}
	}
	
	$$onSideBtnClick(event) {
		if (event.target === this.shadowRoot.elBtnPrev) {
			this.prev();
		}
		else if (event.target === this.shadowRoot.elBtnNext) {
			this.next();
		}
	}
	
	$$onMouseMove(_) {
		// clearTimeout(this.$$onMouseMove._tmr);
		clearTimeout(this.$$onMouseMove._tmr)
		this.shadowRoot.elWrapper.classList.remove('fadeOut');
		this.$$onMouseMove._tmr = setTimeout(() => {
			this.shadowRoot.elWrapper.classList.add('fadeOut');
		}, 0);
	}
	
	$$onTouchStart(event) {
		if (this.$$onTouchStart._active === undefined) {
			this.$$onTouchStart._active = event;
			this.$$onTouchStart._width = this.clientWidth;
			this.$$onTouchStart._prevProgress = 0;
			this.$$onTouchStart._dProgressAvg = null;
			this.shadowRoot.elWrapper.classList.add('touchCaptured');
		}
		else {
			this.$$onTouchStart._active = false;
			this.$$onTouchEnd(event); // ???
		}
	}
	
	$$onTouchEnd(event) {
		if (this.$$onTouchStart._active === undefined) {
			return;
		}
		delete this.$$onTouchStart._active;
		this.shadowRoot.elWrapper.classList.remove('touchCaptured');
		let view;
		if (view = this.children[this.index]) {
			view.style.opacity = '';
			view.style.transform = '';
		}
		if (view = this.children[this.index - 1]) {
			view.style.opacity = '';
			view.style.transform = '';
		}
		if (view = this.children[this.index + 1]) {
			view.style.opacity = '';
			view.style.transform = '';
		}
		let offIndex = 0;
		
		if (!offIndex && Math.abs(this.$$onTouchStart._progress) > 2 / 5) {
			offIndex = this.$$onTouchStart._progress < 0 ? +1 : -1;
		}
		if (!offIndex
			&& Math.abs(this.$$onTouchStart._progress) > 1 / 7
			&& Math.abs(this.$$onTouchStart._dProgressAvg) >= 0.0025)
		{
			offIndex = -Math.round(this.$$onTouchStart._progress / (1/7));
		}
		
		if (offIndex > 0) {
			this.next();
		}
		else if (offIndex < 0) {
			this.prev();
		}
		this.$$onTouchStart._progress = null;
		this.$$onTouchStart._prevX = null;
	}
	
	$$onTouchMove(event) {
		const MAX_TRANSLATE_PERC = 100;
		if (!this.$$onTouchStart._active) {
			return;
		}
		const dx = event.touches[0].pageX - this.$$onTouchStart._active.touches[0].pageX;
		const dy = event.touches[0].pageY - this.$$onTouchStart._active.touches[0].pageY;
		if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= 2) {
			// return false;
		}
		const progress = Math.max(-1, Math.min(dx / this.$$onTouchStart._width, +1));
		const direction = progress > 0 ? -1 : +1;
		const newIndex = this.index + direction;
		const curView = this.children[this.index];
		const newView = this.children[newIndex];
		if (!curView || !newView) {
			return;
		}
		
		this.$$onTouchStart._progress = progress;
		const dProgress = this.$$onTouchStart._progress - this.$$onTouchStart._prevProgress;
		this.$$onTouchStart._dProgressAvg = this.$$onTouchStart._dProgressAvg === null
			? dProgress
			: (this.$$onTouchStart._dProgressAvg + dProgress) / 2
		;
		this.$$onTouchStart._prevProgress = progress;
		
		curView.style.opacity = Math.pow(1 - Math.abs(progress), 1 / 2);
		curView.style.transform = 'translateX(calc(calc(' + progress + ' * var(--max-offset))))';
		
		newView.style.opacity = Math.pow(Math.max(0, Math.min(Math.abs(progress), 1)), 1 / 2);
		newView.style.transform = 'translateX(calc(calc(' + (progress + direction) + ' * var(--max-offset)) + calc(' + (direction) + ' * var(--gap))))';
	}
}

window.customElements.define('pager-view', PagerView);
