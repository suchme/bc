import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
export default class PhyObj{
	//物理オブジェクト
	constructor(){
		this.rotV = new Vec3();//回転速度
		this.oldrotV = new Vec3(); //角運動量(古い)
		this.type = 0;
		this.impFlg=false;
		this.points=[];
	}
	
	addImpulse(){};
	addImpulseR(){};

};

