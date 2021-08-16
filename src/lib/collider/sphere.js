
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import {AABB,AABBTree} from "../aabb.js"
import Collision from "./collision.js"
var DIMENSION = 3; //ŸŒ³”
export default class Sphere extends Collision{
	//‹…
	constructor(){
		super()
		this.type=Collision.SPHERE;
	};
	calcSupport(ans,v){
		ans[0]=this.matrix[9];
		ans[1]=this.matrix[10];
		ans[2]=this.matrix[11];
	};
	refresh(){
		//Õ“Ë”»’è‘Oˆ—
		this.calcAABB();
	};
	rayCast(p0,p1,normal) {
		var p = Vec3.poolAlloc();
		Vec3.set(p,this.matrix[9],this.matrix[10],this.matrix[11]);
		var l =Collision.SPHERE_LINE(p0,p1,p,this.bold,normal);
		Vec3.poolFree(1);
		return l;
	}
};
