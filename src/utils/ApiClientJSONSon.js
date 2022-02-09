import { ApiClientBase, HttpApiClient, SioApiClient } from './ApiClient.js';
import JSONSon from './JSONSon.js';

function registerFunctionWithJSONSon(_this, _superFunc, funcName, def) {
	if (def.returnJSONSon) {
		def.returnJSONSon = JSONSon.make(JSONSon, def.returnJSONSon);
		_this[funcName] = eval('(async function ' + funcName + '(' + def.args + ') { const res = await _this._call(funcName, ...Array.from(arguments)); return def.returnJSONSon.make(res); })');
		return _this[funcName];
	}
	else {
		_superFunc.call(_this, funcName, def);
	}
}

export class ApiClientBaseJSONSon extends ApiClientBase {
	_registerFunction(funcName, def) {
		return registerFunctionWithJSONSon(this, super._registerFunction, funcName, def);
	}
}

export class HttpApiClientJSONSon extends HttpApiClient {
	_registerFunction(funcName, def) {
		return registerFunctionWithJSONSon(this, super._registerFunction, funcName, def);
	}
}

export class SioApiClientJSONSon extends SioApiClient {
	_registerFunction(funcName, def) {
		return registerFunctionWithJSONSon(this, super._registerFunction, funcName, def);
	}
}
