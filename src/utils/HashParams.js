export default class HashParams extends URLSearchParams {
	prefix;
	
	constructor(url) {
		if (typeof url === 'string') {
			let pos;
			let s = (url || '').toString();
			let prefix;
			if ((pos = s.indexOf('#')) > -1) {
				s = s.replace(/^(.*?#)+/, '');
				if ((pos = s.indexOf('!')) > -1) {
					prefix = s.slice(0, pos);
					s = s.slice(pos + 1);
				}
			}
			super(s);
			this.prefix = prefix;
		}
		else {
			super(url);
		}
	}
	
	static onChange(listener) {
		const listenerWrapper = (event) => {
			let oldParams = null;
			let newParams = null;
			Object.defineProperties(event, {
				oldParams: {
					get: function () {
						return oldParams || (oldParams = new HashParams(this.oldURL));
					},
				},
				newParams: {
					get: function () {
						return newParams || (newParams = new HashParams(this.newURL));
					},
				},
			});
			listener(event);
		};
		window.addEventListener('hashchange', listenerWrapper);
		return {
			removeListener: () => {
				window.removeEventListener('hashchange', listenerWrapper);
			},
		};
	}
	
	toString() {
		return '#' + (this.prefix === undefined ? '' : this.prefix) + '!' + super.toString();
	}
	
	static set(name, value) {
		let map = typeof name === 'object' ? name : { [name]: value };
		const params = new this(document.location.hash);
		for (const k in map) {
			params.set(k, map[k]);
		}
		document.location.hash = params.toString();
		return params;
	}
}