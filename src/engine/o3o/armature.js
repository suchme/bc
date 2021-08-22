
import ObjectType from "./objecttype.js"
export default class Armature{
	constructor(){
		//骨組み
		this.name=""; //名前
		this.bones=[]; //骨
	}
}
Armature.prototype.objecttype=ObjectType.ARMATURE;
