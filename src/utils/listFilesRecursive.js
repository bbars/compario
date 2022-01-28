import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

export default async function *listFilesRecursive(rootDir, filterFn) {
	rootDir = rootDir.replace(/[\/\\]+$/, '') + '/';
	const readDir = async (subDir) => {
		subDir = subDir.replace(/[\/\\]+$/, '') + '/';
		const res = {
			files: [],
			dirs: [],
		};
		try {
			await fsPromises.access(rootDir + subDir, fs.constants.R_OK | fs.constants.X_OK);
		}
		catch (err) {
			// console.warn(err);
			return res;
		}
		const dirents = await fsPromises.readdir(rootDir + subDir, { withFileTypes: true });
		if (filterFn && false === filterFn(rootDir, subDir, dirents)) {
			return res;
		}
		for (let dirent of dirents) {
			if (dirent.isDirectory()) {
				res.dirs.push(subDir + dirent.name + '/');
			}
			else {
				res.files.push(subDir + dirent.name);
			}
		}
		return res;
	};
	
	const subdirs = [
		'',
	];
	while (subdirs.length > 0) {
		const subDir = subdirs.shift();
		const dir = await readDir(subDir);
		for (const file of dir.files) {
			yield file.slice(1);
		}
		subdirs.push(...dir.dirs);
	}
}
