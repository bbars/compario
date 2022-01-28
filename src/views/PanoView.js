import * as THREE from '../utils/three.module.js';

function dispatchEvent(element, eventType, detail) {
	const event = new CustomEvent(eventType, {
		detail: detail,
		bubbles: true,
	});
	element.dispatchEvent(event);
	return event;
}

export default class PanoView extends HTMLCanvasElement {
	_camera;
	_scene;
	_renderer;
	
	_isUserInteracting;
	_onPointerDownMouseX;
	_onPointerDownMouseY;
	_lon;
	_lat;
	_curLon;
	_curLat;
	_onPointerDownLon;
	_onPointerDownLat;
	_fov;
	_animate;
	
	static get observedAttributes() {
		return [
			'panoSrc',
			'animate',
			'autosize',
			'croppedAreaImageWidth',
			'croppedAreaImageHeight',
			'croppedAreaLeft',
			'croppedAreaTop',
			'fullPanoWidth',
			'fullPanoHeight',
		];
	}
	
	static get boolAttributes() {
		return ['animate', 'autosize'];
	}
	
	constructor() {
		super();
		
		this._isUserInteracting = false;
		this._onPointerDownMouseX = 0;
		this._onPointerDownMouseY = 0;
		this._lon = this._curLon = 180;
		this._lat = this._curLat = 0;
		this._onPointerDownLon = 0;
		this._onPointerDownLat = 0;
		this._onPointerDownPrevLon = 0;
		this._onPointerDownPrevLat = 0;
		this._onPointerDownPrevTime = 0;
		this._onPointerDownDTime = 0;
		
		this.$$onWindowResize = this.$$onWindowResize.bind(this);
		this.$$onDocumentMouseWheel = this.$$onDocumentMouseWheel.bind(this);
		this.$$onTouchStart = this.$$onTouchStart.bind(this);
		this.$$onPointerDown = this.$$onPointerDown.bind(this);
		this.$$onPointerMove = this.$$onPointerMove.bind(this);
		this.$$onPointerUp = this.$$onPointerUp.bind(this);
		this.$$animate = this.$$animate.bind(this);
		
		this._fov = 75;
		this._camera = new THREE.PerspectiveCamera(this._fov, window.innerWidth / window.innerHeight, 1, 1100);
		
		this._scene = new THREE.Scene();
		
		this._geometry = new THREE.SphereGeometry(500, 60, 40);
		this._geometry.scale(-1, 1, 1);
		
		this._material = new THREE.MeshBasicMaterial({ map: this._texture });
		this._mesh = new THREE.Mesh(this._geometry, this._material);
		this._scene.add(this._mesh);
		
		this._renderer = new THREE.WebGLRenderer({ canvas: this });
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this.$$onWindowResize();
	}
	
	connectedCallback() {
		this.tabIndex = Math.max(0, this.tabIndex);
		this.disabled = this.getAttribute('disabled') || 0;
		
		window.addEventListener('resize', this.$$onWindowResize);
		document.addEventListener('wheel', this.$$onDocumentMouseWheel);
		this.addEventListener('touchstart', this.$$onTouchStart);
		this.addEventListener('pointerdown', this.$$onPointerDown);
		
		this.$$animate.stop = false;
		
		setTimeout(() => {
			this.$$onWindowResize();
			this.$$animate();
		}, 0);
	}
	disconnectedCallback() {
		window.removeEventListener('resize', this.$$onWindowResize);
		document.removeEventListener('wheel', this.$$onDocumentMouseWheel);
		this.removeEventListener('touchstart', this.$$onTouchStart);
		this.removeEventListener('pointerdown', this.$$onPointerDown);
		document.removeEventListener('pointermove', this.$$onPointerMove);
		document.removeEventListener('pointerup', this.$$onPointerUp);
		
		this.$$animate.stop = true;
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
			document.removeEventListener('pointermove', this.$$onPointerMove);
			document.removeEventListener('pointerup', this.$$onPointerUp);
			this._isUserInteracting = false;
			this.setAttribute('disabled', '');
		}
	}
	
	get animate() {
		return this.hasAttribute('animate');
	}
	set animate(value) {
		value = !!value;
		this._animate = value;
		if (!value) {
			this.removeAttribute('animate');
		}
		else {
			this.setAttribute('animate', '');
		}
	}
	
	get autosize() {
		return this.hasAttribute('autosize');
	}
	set autosize(value) {
		value = !!value;
		if (!value) {
			this.removeAttribute('autosize');
		}
		else {
			this.setAttribute('autosize', '');
		}
	}
	
	get panoSrc() {
		return this._material && this._material.map && this._material.map.image && this._material.map.image.src || this.getAttribute('pano-src');
	}
	set panoSrc(value) {
		this._texture = new THREE.TextureLoader().load(
			value
			, () => {
				console.log('texture loaded');
				this._material.map.needsUpdate = true;
				this._requestAnimate();
			}
			// Function called when download progresses
			, (xhr) => {
				console.log((xhr.loaded / xhr.total * 100) + '% loaded');
			}
			// Function called when download errors
			, (xhr) => {
				console.log('An error happened');
			}
		);
		this._material.map = this._texture;
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
	
	get croppedAreaImageWidth() {
		return +this._linkAttributeGet('croppedAreaImageWidth');
	}
	set croppedAreaImageWidth(value) {
		this._linkAttributeSet('croppedAreaImageWidth', value);
		this._remapTexture();
	}
	
	get croppedAreaImageHeight() {
		return +this._linkAttributeGet('croppedAreaImageHeight');
	}
	set croppedAreaImageHeight(value) {
		this._linkAttributeSet('croppedAreaImageHeight', value);
		this._remapTexture();
	}
	
	get croppedAreaLeft() {
		return +this._linkAttributeGet('croppedAreaLeft');
	}
	set croppedAreaLeft(value) {
		this._linkAttributeSet('croppedAreaLeft', value);
		this._remapTexture();
	}
	
	get croppedAreaTop() {
		return +this._linkAttributeGet('croppedAreaTop');
	}
	set croppedAreaTop(value) {
		this._linkAttributeSet('croppedAreaTop', value);
		this._remapTexture();
	}
	
	get fullPanoWidth() {
		return +this._linkAttributeGet('fullPanoWidth');
	}
	set fullPanoWidth(value) {
		this._linkAttributeSet('fullPanoWidth', value);
		this._remapTexture();
	}
	
	get fullPanoHeight() {
		return +this._linkAttributeGet('fullPanoHeight');
	}
	set fullPanoHeight(value) {
		this._linkAttributeSet('fullPanoHeight', value);
		this._remapTexture();
	}
	
	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}
		else if (this.constructor.observedAttributes.indexOf(name) > -1) {
			if (this.constructor.boolAttributes.indexOf(name) > -1) {
				newValue = newValue != null;
			}
			this[name] = newValue;
		}
	}
	
	_remapTexture() {
		const croppedAreaImageWidth = this.croppedAreaImageWidth || (this._material.map.image && this._material.map.image.naturalWidth);
		const croppedAreaImageHeight = this.croppedAreaImageHeight || (this._material.map.image && this._material.map.image.naturalHeight);
		const fullPanoWidth = this.fullPanoWidth;
		const fullPanoHeight = this.fullPanoHeight;
		const croppedAreaLeft = this.croppedAreaLeft || ((fullPanoWidth - croppedAreaImageWidth) / 2);
		const croppedAreaTop = this.croppedAreaTop || ((fullPanoHeight - croppedAreaImageHeight) / 2);
		this._material.map.repeat.x = !croppedAreaImageWidth ? 1 : fullPanoWidth / croppedAreaImageWidth;
		this._material.map.repeat.y = !croppedAreaImageHeight ? 1 : fullPanoHeight / croppedAreaImageHeight;
		// this._material.map.offset.x = 90/(2*Math.PI);
		this._material.map.offset.y = 0;
		if (fullPanoHeight && fullPanoHeight > croppedAreaImageHeight) {
			this._material.map.offset.y = -Math.PI * (croppedAreaTop / fullPanoHeight);
			// this._material.map.offset.y = -(croppedAreaTop / (fullPanoHeight - croppedAreaImageHeight)) * (this._material.map.repeat.y - 1);
		}
		this._material.map.offset.x = 0;
		if (fullPanoWidth && fullPanoWidth > croppedAreaImageWidth) {
			this._material.map.offset.x = -(croppedAreaLeft / (fullPanoWidth - croppedAreaImageWidth)) * (this._material.map.repeat.x - 1);
		}
		
		this._requestAnimate();
	}
	
	_requestAnimate() {
		debounceAnimationFrame(this.$$animate, this.$$animate);
	}
	
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	
	$$onWindowResize() {
		const W = this.clientWidth;
		const H = this.clientHeight;
		this._camera.aspect = W / H;
		this._camera.updateProjectionMatrix();
		
		if (this.autosize) {
			this._renderer.setSize(W, H, false);
		}
	}
	
	$$onTouchStart(event) {
		event.stopPropagation();
		return false;
	}
	
	$$onPointerDown(event) {
		if (event.isPrimary === false) {
			return;
		}
		
		this._isUserInteracting = true;
		
		this._onPointerDownMouseX = event.clientX;
		this._onPointerDownMouseY = event.clientY;
		
		this._onPointerDownLon = this._lon;
		this._onPointerDownLat = this._lat;
		
		this._onPointerDownPrevLon = this._curLon;
		this._onPointerDownPrevLat = this._curLat;
		this._onPointerDownAvgDTime = new AvgN(5);
		this._onPointerDownPrevTime = Date.now();
		
		document.addEventListener('pointermove', this.$$onPointerMove);
		document.addEventListener('pointerup', this.$$onPointerUp);
		
		this._requestAnimate();
	}
	
	$$onPointerMove(event) {
		if (event.isPrimary === false) {
			return;
		}
		
		const now = Date.now();
		this._onPointerDownPrevLon = this._curLon;
		this._onPointerDownPrevLat = this._curLat;
		this._onPointerDownAvgDTime.add(now - this._onPointerDownPrevTime);
		this._onPointerDownPrevTime = now;
		
		const moveK = this._camera.fov * Math.PI / 2 / 1000;
		this._lon = this._curLon = (this._onPointerDownMouseX - event.clientX) * moveK + this._onPointerDownLon;
		this._lat = this._curLat = (event.clientY - this._onPointerDownMouseY) * moveK + this._onPointerDownLat;
		this._lat = this._curLat = Math.max(-85, Math.min(this._lat, 85));
		
		this._requestAnimate();
	}
	
	$$onPointerUp(event) {
		if (event.isPrimary === false) {
			return;
		}
		document.removeEventListener('pointermove', this.$$onPointerMove);
		document.removeEventListener('pointerup', this.$$onPointerUp);
		
		this._isUserInteracting = false;
		
		this._onPointerDownAvgDTime.add(Date.now() - this._onPointerDownPrevTime);
		let dTime = +this._onPointerDownAvgDTime || 20;
		let dLon = (this._curLon - this._onPointerDownPrevLon) / (dTime / 100);
		let dLat = (this._curLat - this._onPointerDownPrevLat) / (dTime / 100);
		
		dLon = Math.max(-100, Math.min(dLon, 100));
		dLat = Math.max(-100, Math.min(dLat, 100));
		
		if (Math.abs(dLat) > 90) {
			debugger;
		}
		this._lon += dLon;
		this._lat += dLat;
		
		this._requestAnimate();
	}
	
	$$onDocumentMouseWheel(event) {
		this._fov = Math.max(10, Math.min(this._fov + event.deltaY * 0.05, 75));
		
		this._requestAnimate();
	}
	
	$$animate() {
		let animChanges = false;
		
		if (this.$$animate.stop) {
			return;
		}
		
		if (this._isUserInteracting === false && this._animate) {
			this._lon += 0.1;
			animChanges = true;
		}
		
		let d;
		
		d = (this._lat - this._curLat) / 10;
		if (d) {
			this._curLat = Math.abs(d) < 0.001 ? this._lat : this._curLat + d;
			animChanges = true;
		}
		
		d = (this._lon - this._curLon) / 10;
		if (d) {
			this._curLon = Math.abs(d) < 0.001 ? this._lon : this._curLon + d;
			animChanges = true;
		}
		
		d = (this._fov - this._camera.fov) / 10;
		if (d) {
			this._camera.fov = Math.abs(d) < 0.01 ? this._fov : this._camera.fov + d;
			this._camera.updateProjectionMatrix();
			animChanges = true;
		}
		
		this.forceRedraw();
		if (animChanges) {
			this._requestAnimate();
		}
	}
	
	forceRedraw() {
		this._lat = Math.max(-85, Math.min(this._lat, 85));
		this._curLat = Math.max(-85, Math.min(this._curLat, 85));
		const phi = THREE.MathUtils.degToRad(90 - this._curLat);
		const theta = THREE.MathUtils.degToRad(this._curLon);
		
		const x = 500 * Math.sin(phi) * Math.cos(theta);
		const y = 500 * Math.cos(phi);
		const z = 500 * Math.sin(phi) * Math.sin(theta);
		
		this._camera.lookAt(x, y, z);
		
		this._renderer.render(this._scene, this._camera);
	}
	
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	/////////////////////////////////////////////
	
}

window.customElements.define('pano-view', PanoView, { extends: 'canvas' });

class AvgN {
	n = 0;
	value = 0;
	_maxN;
	
	constructor(maxN) {
		this._maxN = !isFinite(maxN) ? 0 : maxN;
	}
	
	add(value) {
		if (this._maxN > 0) {
			this.n++;
			const l = Math.min(this.n, this._maxN);
			this.value = this.value * ((l - 1) / l) + value * (1 / l);
		}
		else {
			if (!this.n) {
				this.value = value;
			}
			else {
				this.value = (this.value * this.n + value) / (this.n + 1);
			}
			this.n++;
		}
		return this;
	}
	
	valueOf() {
		return this.value;
	}
	
	toString() {
		return '' + this.value;
	}
}

function debounceAnimationFrame(syncer, func, ...args) {
	syncer._args = args;
	if (syncer._animationFrameRequested) {
		return false;
	}
	syncer._animationFrameRequested = true;
	requestAnimationFrame(function () {
		syncer._animationFrameRequested = false;
		func.apply(syncer._context, syncer._args);
	});
	return true;
}
