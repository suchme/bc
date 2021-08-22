
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
import RotationMode from "./rotationmode.js"
export default class PoseBone{
	constructor(){
		//ボーン状態
		this.location=new Vec3();
		this.rotation_mode=RotationMode.QUATERNION;
		this.rotation=new Vec4();
		this.scale=new Vec3();
		this.constraints=[];

		Vec3.set(this.location,0,0,0);
		Vec3.set(this.rotation,0,0,0,0);
		Vec3.set(this.scale,1,1,1);
	}
	reset(){
		Vec3.set(this.location,0,0,0);
		Vec3.set(this.rotation,0,0,0,0);
		Vec3.set(this.scale,1,1,1);
	}

	copy(a,b){
		Vec3.copy(a.location,b.location);
		Vec3.copy(a.scale,b.scale);
		Vec4.copy(a.rotation,b.rotation);
	}
	add(a,b,c){
		Vec3.add(a.location,b.location,c.location);
		for(var i=0;i<3;i++){
			a.scale[i]=b.scale[i]*c.scale[i];
		}
		Vec4.qdot(a.rotation,b.rotation,c.rotation);
	}
	sub(a,b,c){
		Vec3.sub(a.location,b.location,c.location);
		for(var i=0;i<3;i++){
			a.scale[i]=b.scale[i]/c.scale[i];
		}
		Vec4.qmdot(a.rotation,b.rotation,c.rotation);
	}
	mul(a,b,c){
		Vec3.mul(a.location,b.location,c);
		for(var i=0;i<3;i++){
			a.scale[i]=(b.scale[i]-1)*c+1;
		}
		Vec4.qmul(a.rotation,b.rotation,c);
	}
	madd(a,b,c,d){
		Vec3.madd(a.location,b.location,c,d);
		Vec3.madd(a.scale,b.scale,c,d);
		var vec4 = Vec4.poolAlloc();
		iVec4.qmul(vec4,c,d);
		Vec4.qdot(a.rotation,b.rotation,vec4);
		Vec4.poolFree(1);
	}
};
