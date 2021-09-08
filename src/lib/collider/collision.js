
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import {AABB,AABBTree} from "../aabb.js"
var DIMENSION = 3; //次元数
var INVALID = -9999999; //無効値
export default class Collision{
	constructor(){
		this.aabb= new AABB();
		this.bold = 0; //太さ
		this.parent=null;
		this.matrix=new Mat43();
		this.inv_matrix=new Mat43();
		this.groups=1;
		this.notgroups=0;
		this.callbackFunc=null;
		this.parent=null;
		this.name="";
	}
	calcSupport(ret,axis){
		return;
	}
	calcSupportB(ret,axis){
		this.calcSupport(ret,axis);
		Vec3.madd(ret,ret,axis,-(this.bold/Vec3.scalar(axis)));
		return;
	}
	calcAABB(aabb){
		if(!aabb){
			aabb=this.aabb;
		}
		//AABBを求める
		var axis = Vec3.poolAlloc();
		var ret = Vec3.poolAlloc();

		for(var i=0;i<DIMENSION;i++){
			Vec3.set(axis,0,0,0);
			axis[i]=-1;
			this.calcSupport(ret,axis);
			aabb.max[i]=ret[i]+this.bold;
			axis[i]=1;
			this.calcSupport(ret,axis);
			aabb.min[i]=ret[i]-this.bold;
		}
		Vec3.poolFree(2);
	}
	refresh(){
		//衝突判定前処理
		Mat43.getInv(this.inv_matrix,this.matrix);
		this.calcAABB();
	};
	rayCast(p0,p1,normal){
		if(normal){
			Vec3.set(normal,0,0,0);
		}
		return INVALID;
	}
};
var i=0;
Collision.MESH = i++
Collision.CUBOID = i++
Collision.SPHERE = i++
Collision.CYLINDER= i++
Collision.CAPSULE = i++
Collision.CONE= i++
Collision.CONVEX_HULL= i++
Collision.TRIANGLE= i++
Collision.INVALID =INVALID;

	Collision.SPHERE_LINE = function(p0,p1,p2,r,normal) {
		var p = Vec3.poolAlloc();
		var d = Vec3.poolAlloc();
		Vec3.sub(p,p0,p2);
		Vec3.sub(d,p1,p0);
		var A = Vec3.dot(d,d);
		var B = Vec3.dot(p,d);
		var C = Vec3.dot(p,p) - r*r;

		Vec3.poolFree(2);
		if(A===0){
			return Collision.INVALID;
		}
		var l = B*B-A*C;
		if(l<0){
			return Collision.INVALID;
		}
		l=(-B - Math.sqrt(l))/A;
		if(normal){
			//交差点の法線
			Vec3.madd(normal,p0,d,l);
			Vec3.sub(normal,normal,p2);
			Vec3.norm(normal);
		}

		return l;

	}
