#!/usr/bin/env node
import models from './src/models.js';
import DB from './src/utils/DB.js';
import Api from './src/Api.js';
import ProcessArgs from './src/utils/ProcessArgs.js';

import * as http from 'http';
import httpServeDirectory from './src/utils/httpServeDirectory.js';

const ARGV = new ProcessArgs(process.argv);
const CONFIG = ARGV.fillTree({
	http: {
		staticDir: '.',
		bind: '127.0.0.1',
		port: '8080',
	},
	db: {
		filename: './main.db',
		journalMode: 'PERSIST',
	},
	collectMediaDirs: false,
});
console.warn('CONFIG', CONFIG);




const db = new DB(CONFIG.db);
await db.init(Object.values(models));
// console.log(Object.getOwnPropertyNames(db.sqlite.constructor.prototype));

const API = new Api({
	db: db,
});




httpServer: {
	const publicApiFunctions = API.getPublicApiFunctions();
	console.warn('publicApiFunctions', publicApiFunctions);
	
	const httpServer = http.createServer(async function (req, res) {
		// console.warn(req.url);
		try {
			if (await API.$httpMiddleware('/api/', req, res)) {
				// done
			}
			else {
				await httpServeDirectory(CONFIG.http.staticDir, req, res, async (path, req, staticDir) => {
					path = await httpServeDirectory.defaultRewriter(path, req, staticDir);
					if (/\bnode_modules\b|\/[^\/]*\.db$/.test(path)) {
						throw new Error("Forbidden");
					}
					return path;
				});
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
			return;
		}
	});
	
	console.log("Listen", CONFIG.http.bind, CONFIG.http.port);
	httpServer.listen(CONFIG.http.port, CONFIG.http.bind);
}
