
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import {AABB,AABBTree} from "../aabb.js"
import Collision from "./collision.js"
import Cylinder from "./cylinder.js"
var DIMENSION = 3; //次元数
export default class Capsule extends Collision{
	//カプセル
	constructor(){
		super();
		this.type=Collision.CAPSULE;
	};
	calcSupport(ans,v){
		var m=this.matrix;
		Vec3.set(ans,m[3],m[4],m[5]);
		if(Vec3.dot(ans,v)>0){
			Vec3.mul(ans,ans,-1);
		}
		ans[0]+=m[9];
		ans[1]+=m[10];
		ans[2]+=m[11];

	}

	rayCast(p0,p1,normal) {
		//カプセルと線分
		var min=Collision.INVALID;
		var p = Vec3.poolAlloc();
		var n2 = Vec3.poolAlloc();

		var l =Cylinder.prototype.rayCast.call(this,p0,p1,normal);
		if(min === Collision.INVALID || l < min){
			min = l;
		}
		var m = this.matrix;
		Vec3.set(p,m[3]+m[9],m[4]+m[10],m[5]+m[11]);
		l = Collision.SPHERE_LINE(p0,p1,p,this.bold,n2);
		if(min === Collision.INVALID || (l < min && l !== Collision.INVALID)){
			min=l;
			if(normal){
				Vec3.copy(normal,n2);
			}
		}
		Vec3.set(p,-m[3]+m[9],-m[4]+m[10],-m[5]+m[11]);
		l=Collision.SPHERE_LINE(p0,p1,p,this.bold,n2);
		if(min === Collision.INVALID || (l < min && l !== Collision.INVALID)){
			min=l;
			if(normal){
				Vec3.copy(normal,n2);
			}
		}

		Vec3.poolFree(2);
		if(normal && min === Collision.INVALID){
			Vec3.set(normal,0,0,0);
		}
		return min;
	}
};

