export default class ApiBase {
	R;
	
	constructor(R) {
		this.R = R;
	}
	
	getPublicApiFunctions() {
		return []
			.concat(Object.getOwnPropertyNames(this))
			.concat(Object.getOwnPropertyNames(this.constructor.prototype))
			.reduce((res, k) => {
				if (k[0] !== '_' && k[0] !== '$' && k !== 'constructor' && typeof this[k] === 'function') {
					res[k] = {
						args: /[^\(]*\(([^\)]*)/.exec(this[k].toString())[1],
					};
				}
				return res;
			}, {})
		;
	}
	
	async $invoke(apiFunction, args) {
		const publicApiFunctions = this.getPublicApiFunctions();
		
		const fn = this[apiFunction];
		if (!fn || publicApiFunctions[apiFunction] == null) {
			throw new Error("Unknown API function: " + apiFunction);
		}
		return fn.apply(this, args);
	}
	
	async $httpMiddleware(pathPrefix, req, res) {
		pathPrefix = pathPrefix || '/api/';
		const publicApiFunctions = this.getPublicApiFunctions();
		const url = new URL(req.url, 'http://0.0.0.0/');
		
		if (url.pathname.slice(0, pathPrefix.length) !== pathPrefix) {
			return false;
		}
		
		try {
			const parts = url.pathname.slice(pathPrefix.length).split('/').filter(Boolean);
			let result;
			if (req.headers.origin) {
				res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
				res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
				res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, TRACE');
				res.setHeader('Access-Control-Allow-Credentials', 'true');
			}
			if (parts.length === 0) {
				result = Object.keys(publicApiFunctions);
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(result));
			}
			else if (parts.length > 1) {
				throw "Invalid API call URL";
			}
			else if (req.method === 'GET' || req.method === 'POST') {
				const apiFunction = parts[0];
				const jsonBody = req.method !== 'POST' ? null : await new Promise((resolve, reject) => {
					let jsonBody = '';
					req.setEncoding('utf8');
					req.on('data', (chunk) => {
						jsonBody += chunk;
						if (jsonBody > 1024 * 1024 * 20) {
							reject("Post body is too large");
						}
					});
					req.on('end', () => {
						resolve(jsonBody);
					});
				});
				const args = jsonBody ? [].concat(JSON.parse(jsonBody)) : url.searchParams.getAll('p');
				// console.log('apiFunction', apiFunction, fn, fn.constructor.name);
				result = await this.$invoke(apiFunction, args);
				const fn = this[apiFunction];
				// console.log('apiFunction result', result, result.constructor.name);
				// if (result && result.constructor && result.constructor.name === 'Generator') {
				if (fn.constructor.name === 'GeneratorFunction' || fn.constructor.name === 'AsyncGeneratorFunction') {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.write('{"type":"generator","res":[');
					let i = -1;
					for await (const item of result) {
						i++;
						if (i > 0) {
							res.write(',');
						}
						res.write(JSON.stringify(await item));
					}
					res.end(']}');
				}
				else {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({
						res: result,
					}));
				}
			}
			else {
				throw "Unsupported method";
			}
		}
		catch (err) {
			// console.warn('HTTP', 'err', err);
			if (err.code === 'ENOENT') {
				res.writeHead(404, { 'Content-Type': 'application/json' });
			}
			else {
				res.writeHead(400, { 'Content-Type': 'application/json' });
			}
			let errStr = JSON.stringify(err);
			errStr = !errStr || errStr === '{}' ? err + '' : JSON.parse(errStr);
			res.end(JSON.stringify({
				err: errStr,
			}));
		}
		return true;
	}
	
	async $initSocketIOMiddleware(eventName, socket) {
		const publicApiFunctions = this.getPublicApiFunctions();
		
		socket.on(eventName, async (...args) => {
			const apiFunction = args.shift();
			const sendResponse = typeof args[args.length - 1] === 'function' ? args.pop() : null;
			let res, err;
			try {
				res = await this.$invoke(apiFunction, args);
			}
			catch (err2) {
				// console.warn('SOCKETIO', 'err', err2);
				err = err2 + '';
			}
			if (sendResponse) {
				sendResponse(res, err);
			}
		});
	}
}
