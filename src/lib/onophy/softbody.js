import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import PhyObj from "./phyobj.js"
import RigidBody from "./rigidbody.js"
import OnoPhy from "./onophy.js"
import Collider from "../collider/collider.js"
import Geono from "../geono.js"
import {AABB} from "../aabb.js";
import Cloth from "./cloth.js"

var MIN = Math.min;
var MAX = Math.max;

var AIR_DAMPER=1;
var DIMENSION=3;

export default class SoftBody extends Cloth{
	constructor(v,e,f){
		super();
		this.type=OnoPhy.CLOTH;
		this.bold=0.015;
		this.points=[]; //頂点位置
		this.edges= []; //エッジ
		this.bends= []; //曲がり抵抗
		this.faces = []; //面
		this.facesSort=[];

		this.structual_stiffness= 400;//構造
		this.bending_stiffness = 0; //まげ
		this.spring_damping = 5;//ばね抵抗
		this.air_damping = 0;//空気抵抗
		this.vel_damping = 0;//速度抵抗

		this.restitution=0;//反発係数
		this.friction=0.1;


		for(var i=0;i<v;i++){
			this.points.push(new Cloth.Point());
			this.points[i].cloth=this;
		}
		for(var i=0;i<e;i++){
			this.edges.push(new Edge());
			this.edges[i].cloth=this;
		}
		for(var i=0;i<f;i++){
			this.faces.push(new Cloth.Face());
			this.faces[i].cloth=this;
			this.facesSort.push(this.faces[i]);
		}
		
		this.aabb= new AABB();
	}

	init(){
		var points=this.points;
		var edges=this.edges;

		for(var i=0;i<points.length;i++){
			Vec4.set(points[i].rotq,0,0,0,1);
		}
		for(var i=0;i<edges.length;i++){
			Vec3.sub(edges[i].sabun,edges[i].point2.location
				,edges[i].point1.location);
			Vec3.mul(edges[i].sabun,edges[i].sabun,0.5);
			edges[i].point1.rotq[0]*=-1;
			Vec4.rotVec3(edges[i].sabun,edges[i].point1.rotq,edges[i].sabun);
			edges[i].point1.rotq[0]*=-1;
		}
		this.inv_pointMass = 1/(this.mass/this.points.length);
	}
	calcPre(onophy){
		Cloth.prototype.calcPre.call(this,onophy);
	}

	calcConstraintPre(){ }
	calcConstraint(m){ }

};

class Edge{
	constructor(){
		this.point1 = null;
		this.point2 = null;
		this.len;
		this.sabun = new Vec3();
		this.cloth=null;
		this.impulse = 0;
		this.n = new Vec3();
	};

	calcPre(){
			var pos1=Vec3.poolAlloc();
			var pos2=Vec3.poolAlloc();
			var dv = Vec3.poolAlloc();
			var impulse = Vec3.poolAlloc();
			var rotq = Vec4.poolAlloc();

			Vec4.rotVec3(pos1,this.point1.rotq,this.sabun);
			Vec4.rotVec3(pos2,this.point2.rotq,this.sabun);
			Vec3.add(dv,pos1,pos2);
			Vec3.sub(dv,this.point2.location,dv);
			Vec3.sub(dv,dv,this.point1.location);
			var l = Vec3.scalar(dv);
			if(l!==0){
				Vec3.mul(impulse,dv,1/l);
				l*= this.cloth.push*30;
				Vec3.sub(dv,this.point2.v,this.point1.v);
				l += Vec3.dot(dv,impulse)* this.cloth.damping;

				Vec3.mul(impulse,impulse,l*this.cloth.inv_pointMass*this.cloth.onophy.dt);

				if(!this.point1.fix){
					Vec3.add(this.point1.v,this.point1.v,impulse);

					Vec3.cross(dv,pos1,impulse); 
					Vec3.add(this.point1.rotV,this.point1.rotV,dv); //回転
				}
				if(!this.point2.fix){
					Vec3.mul(impulse,impulse,-1);
					Vec3.add(this.point2.v,this.point2.v,impulse);

					Vec3.mul(dv,pos2,-1);
					Vec3.cross(dv,dv,impulse); 
					Vec3.add(this.point2.rotV,this.point2.rotV,dv); //回転
				}
			}

			Vec4.qmdot(rotq,this.point2.rotq,this.point1.rotq,-1);
			Vec4.toTorque(impulse,rotq);
			Vec3.mul(impulse,impulse,this.cloth.onophy.DT*this.cloth.inv_pointMass*this.cloth.bending_stiffness*2);
			Vec3.add(this.point1.rotV,this.point1.rotV,impulse);
			Vec3.sub(this.point2.rotV,this.point2.rotV,impulse);

			Vec3.mul(this.point1.rotV,this.point1.rotV,0.999);
			Vec3.mul(this.point2.rotV,this.point2.rotV,0.999);

			Vec4.poolFree(1);


			Vec3.poolFree(4);
		}

	};
