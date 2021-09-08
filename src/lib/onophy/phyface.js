import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import PhyObj from "./phyobj.js"
import RigidBody from "./rigidbody.js"
import OnoPhy from "./onophy.js"

var MIN = Math.min;
var MAX = Math.max;

export default class PhyFace extends PhyObj{
	constructor(){
		super();
		this.p=new Array(3);//new Vec3();
		this.face=null;
		this.bold = 0;
		this.cloth=null;
		this.ratio=new Vec3();
		this.type = OnoPhy.FACE;
	}

	calcVelocity(dv){
		Vec3.mul(dv,this.p[0].v,this.ratio[0]);
		Vec3.madd(dv,dv,this.p[1].v,this.ratio[1]);
		Vec3.madd(dv,dv,this.p[2].v,this.ratio[2]);
	}

	addImpulse(pos,impulse){
		for(var i=0;i<OnoPhy.DIMENSION;i++){
			if(!this.p[i].fix){
				Vec3.madd(this.p[i].v
					,this.p[i].v,impulse,this.ratio[i]*this.cloth.inv_pointMass);
			}
		}
	}
	addImpulse2(pos,impulse){
		for(var i=0;i<OnoPhy.DIMENSION;i++){
			if(!this.p[i].fix){
				Vec3.madd(this.p[i].v
					,this.p[i].v,impulse,this.ratio[i]*this.cloth.inv_pointMass);
			}
		}
	}
	calcEfficM(m){
		var r = 0;
		for(var i=0;i<OnoPhy.DIMENSION;i++){
			if(!this.p[i].fix){
				r += this.ratio[i]*this.ratio[i];
			}
		}
		r*=this.cloth.inv_pointMass;
		m[0]=m[4]=m[8]=r;
		m[1]=m[2]=m[3]=m[5]=m[6]=m[7]=0;
	}

	getFriction(){
		return this.cloth.friction;
	}
	getRestitution(){
		return this.cloth.restitution;
	}
	getInvInertiaTensor(){
		return Mat33.ZERO;
	}
	getExPos(a,b){
		Vec3.copy(a,this.ratio);
	}

};
