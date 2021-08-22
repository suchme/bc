
import O3o from "./o3o.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
import PoseBone from "./posebone.js"
export default class Pose{
	constructor(armature){
		this.armature = armature;
		this.poseBones = []; // ボーンの状態
		this.matrices=[];
		for(var i=0;i<armature.bones.length;i++){
			this.poseBones.push(new PoseBone());
			this.matrices.push(new Mat43());
		}
	}

	setAction(action,frame){
		var armature = this.armature;
		var poseBones = this.poseBones;
		for(var i=0;i<poseBones.length;i++){
			//ボーンの数だけ計算する
			var poseBone = poseBones[i];
			var bone = armature.bones[i];
			//対象ボーンのアクションを計算
			O3o.addaction(poseBone,bone.name,action,frame)
		}
	}

	reset(){
		for(var i=0;i<this.poseBones.length;i++){
			this.poseBones[i].reset();
		}
	}
	copy(a,b){
		for(var i=0;i<b.poseBones.length;i++){
			PoseBone.copy(a.poseBones[i],b.poseBones[i]);
		}
	}
	add(a,b,c){
		for(var i=0;i<b.poseBones.length;i++){
			PoseBone.add(a.poseBones[i],b.poseBones[i],c.poseBones[i]);
		}
	}
	sub(a,b,c){
		for(var i=0;i<b.poseBones.length;i++){
			PoseBone.sub(a.poseBones[i],b.poseBones[i],c.poseBones[i]);
		}
	}
	madd(a,b,c,d){
		for(var i=0;i<b.poseBones.length;i++){
			PoseBone.madd(a.poseBones[i],b.poseBones[i],c.poseBones[i],d);
		}
	}
	mul(a,b,c){
		for(var i=0;i<b.poseBones.length;i++){
			PoseBone.mul(a.poseBones[i],b.poseBones[i],c);
		}
	}
}
