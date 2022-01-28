export class ApiClientBase {
	async init() {
		const publicApiFunctions = await this._call('getPublicApiFunctions');
		for (const funcName in publicApiFunctions) {
			this._registerFunction(funcName, publicApiFunctions[funcName]);
		}
	}
	
	async _call(funcName, ...args) {
		throw new Error("Descendant must implement method ApiClientBase._call");
	}
	
	_registerFunction(funcName, def) {
		const _this = this;
		this[funcName] = eval('(async function ' + funcName + '(' + def.args + ') { return _this._call(funcName, ...Array.from(arguments)); })');
		return this[funcName];
	}
}

export class HttpApiClient extends ApiClientBase {
	_endpoint;
	_accessToken;
	
	constructor(endpoint, accessToken) {
		super();
		this._endpoint = new URL(endpoint || '', document.location.origin);
		this._accessToken = accessToken || '';
		this._timezone = this._getTimezoneString();
	}
	
	/*async*/ _call(funcName, ...args) {
		const requestMethod = 'POST'; // TODO: implement GET for getters
		const xhr = new XMLHttpRequest();
		const promise = new Promise((resolve, reject) => {
			const url = new URL(funcName, this._endpoint);
			let contentType = '';
			let payload;
			
			if (requestMethod === 'GET') {
				for (const arg of args) {
					url.searchParams.append('p', arg);
				}
			}
			else {
				payload = this._packPayload(args);
				contentType = payload instanceof FormData ? 'multipart/form-data' : 'application/json';
			}
			
			xhr.open(requestMethod, url, true);
			xhr.withCredentials = true;
			xhr.setRequestHeader('X-Timezone', this._timezone);
			if (this._accessToken) {
				xhr.setRequestHeader('X-Token', this._accessToken);
			}
			if (contentType && contentType !== 'multipart/form-data') {
				xhr.setRequestHeader('Content-Type', contentType);
			}
			xhr.onerror = (error) => {
				reject(error);
			};
			xhr.onreadystatechange = () => {
				if (xhr.readyState != 4) {
					return;
				}
				
				try {
					let newAccessToken = xhr.getResponseHeader('X-Token');
					if (newAccessToken) {
						this._accessToken = newAccessToken;
					}
					let response;
					let res;
					let err;
					let contentType = this._extractContentType(xhr.getResponseHeader('Content-Type')) || 'application/octet-stream';
					if (contentType === 'application/json') {
						response = JSON.parse(xhr.responseText);
						res = response.res;
						err = response.err;
						if (err instanceof Array) {
							err = err.shift();
						}
					}
					else {
						let filename = this._extractFileName(xhr.getResponseHeader('Content-Disposition'));
						res = filename
							? new File([xhr.responseText], filename, { type: contentType })
							: new Blob([xhr.responseText], { type: contentType })
						;
						res._text = xhr.responseText;
					}
					if (xhr.status !== 200 || err) {
						reject(err);
					}
					else {
						resolve(res);
					}
				}
				catch (e) {
					reject(e);
				}
			};
			setTimeout(() => {
				xhr.send(payload);
			});
		});
		promise.xhr = xhr;
		return promise;
	}
	
	_getTimezoneString() {
		var timezoneOffsetMinutes = (new Date()).getTimezoneOffset();
		return (timezoneOffsetMinutes < 0 ? '+' : '-') // change sign
			+ ('00' + Math.abs(timezoneOffsetMinutes / 60 | 0)).slice(-2)
			+ ':'
			+ ('00' + Math.abs(timezoneOffsetMinutes % 60)).slice(-2)
		;
	}
	
	_extractContentType(header) {
		if (!header) {
			return null;
		}
		var m = /^([^\s;]+)/.exec(header);
		return m ? m[1] : null;
	}
	
	_extractFileName(header) {
		if (!header) {
			return null;
		}
		var m = /\bfilename\s*=\s*('|")(.*)\1/.exec(header);
		if (m) {
			return m[2];
		}
		else {
			m = /\bfilename\s*=\s*(\S*)/.exec(header);
			return m ? m[1] : null;
		}
	}
	
	_packPayload(args) {
		const errBlobFound = new Error("Blob found");
		
		const tryPackJson = (args) => {
			try {
				return JSON.stringify(args, (k, v) => {
					if (v instanceof Blob) {
						throw errBlobFound;
					}
					return v;
				});
			}
			catch (err) {
				if (err === errBlobFound) {
					return packPayloadFormData(args);
				}
				throw err;
			}
		};
		
		const packPayloadFormData = (args) => {
			const formData = new FormData();
			for (const item of args) {
				if (item instanceof Blob) {
					formData.append('p', item);
				}
				else {
					const jsonBlob = new Blob([JSON.stringify(item)], {
						type: 'application/json',
					});
					formData.append('p', jsonBlob, 'blob');
				}
			}
			return formData;
		};
		
		return tryPackJson(args);
	}
}

export class SioApiClient extends ApiClientBase {
	_socket;
	
	constructor(socket, apiEventName) {
		super();
		this._socket = socket;
		this._apiEventName = apiEventName;
	}
	
	async _call(funcName, ...args) {
		return new Promise((resolve, reject) => {
			args.unshift(funcName);
			if (this._apiEventName != null) {
				args.unshift(this._apiEventName);
			}
			this._socket.emit(...args, function (res, err) {
				if (err) {
					reject(err);
				}
				else {
					resolve(res);
				}
			});
		});
	}
}
