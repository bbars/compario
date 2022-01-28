import { ApiClientBase, HttpApiClient, SioApiClient } from './ApiClient.js';
import JSONSchema from './JSONSchema.js';

function registerFunctionWithJSONSchema(_this, _superFunc, funcName, def) {
	if (def.returnJSONSchema) {
		def.returnJSONSchema = JSONSchema.make(JSONSchema, def.returnJSONSchema);
		_this[funcName] = eval('(async function ' + funcName + '(' + def.args + ') { const res = await _this._call(funcName, ...Array.from(arguments)); return def.returnJSONSchema.make(res); })');
		return _this[funcName];
	}
	else {
		_superFunc.call(_this, funcName, def);
	}
}

export class ApiClientBaseJSONSchema extends ApiClientBase {
	_registerFunction(funcName, def) {
		return registerFunctionWithJSONSchema(this, super._registerFunction, funcName, def);
	}
}

export class HttpApiClientJSONSchema extends HttpApiClient {
	_registerFunction(funcName, def) {
		return registerFunctionWithJSONSchema(this, super._registerFunction, funcName, def);
	}
}

export class SioApiClientJSONSchema extends SioApiClient {
	_registerFunction(funcName, def) {
		return registerFunctionWithJSONSchema(this, super._registerFunction, funcName, def);
	}
}
