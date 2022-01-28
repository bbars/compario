import SqlModel from './utils/SqlModel.js';

export default class ComparioItem extends SqlModel {
	// name
	// description
	// image
	// itemIndex = -1
	
	constructor(compario, name, description, image) {
		super({ name, description, image });
		this.compario = compario;
	}
	
	static getDefinition() {
		return {
			name: this.name,
			columns: {
				comparioId: 'integer not null', // parent
				itemIndex: 'integer not null', // position in item list
				name: 'varchar(1024) not null',
				description: 'text',
				image: 'text',
				score: 'float null default null',
			},
			indexes: {
				comparioId: ['comparioId'],
			},
			uniqueKeys: {
				// name: ['comparioId', 'name'],
			},
		};
	}
	
	static fromSQL(data) {
		return this.fromJSON(data);
	}
	
	toSQL() {
		const res = this.toJSON();
		try {
			res.score = this.getScore();
		}
		catch (err) {
			res.score = null;
		}
		return res;
	}
	
	static fromJSON(data) {
		const res = new this(null, data.name, data.description, data.image);
		Object.assign(res, data);
		return res;
	}
	
	toJSON() {
		const res = Object.assign({}, this);
		delete res.compario;
		res.comparioId = this.getComparioId();
		res.itemIndex = this.getItemIndex();
		return res;
	}
	
	getComparioId() {
		return !this.compario ? undefined : this.compario.comparioId;
	}
	
	getItemIndex() {
		return !this.compario ? -1 : this.compario.items.indexOf(this);
	}
	
	getScore() {
		if (!this.compario) {
			return;
		}
		const scores = this.compario.getScores();
		return !scores ? undefined : scores[this.getItemIndex()];
	}
}
