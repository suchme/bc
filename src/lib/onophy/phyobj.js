import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
export default class PhyObj{
	//�����I�u�W�F�N�g
	constructor(){
		this.rotV = new Vec3();//��]���x
		this.oldrotV = new Vec3(); //�p�^����(�Â�)
		this.type = 0;
		this.impFlg=false;
		this.points=[];
	}
	
	addImpulse(){};
	addImpulseR(){};

};

