import SqlModel from './utils/SqlModel.js';
import Compario from './Compario.js';
import ComparioCrit from './ComparioCrit.js';
import ComparioCritBool from './ComparioCritBool.js';
import ComparioCritNumber from './ComparioCritNumber.js';
import ComparioCritVector from './ComparioCritVector.js';
import ComparioCritSquare from './ComparioCritSquare.js';
import ComparioItem from './ComparioItem.js';
import ComparioValueWrapper from './ComparioValueWrapper.js';

export default {
	Compario,
	ComparioCrit,
	...ComparioCrit.implementations,
	ComparioItem,
	ComparioValueWrapper,
};
