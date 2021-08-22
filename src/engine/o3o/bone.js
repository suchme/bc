
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
export default class Bone{
	//骨
	constructor(){
		this.name="";
		this.parent="";
		this.length=0;
		this.matrix = new Mat43();
		this.imatrix = new Mat43();
	};
}
