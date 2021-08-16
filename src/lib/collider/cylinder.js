
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import {AABB,AABBTree} from "../aabb.js"
import Collision from "./collision.js"
var DIMENSION = 3; //ŽŸŒ³”
export default class Cylinder extends Collision{
	//ƒVƒŠƒ“ƒ_
	constructor(){
		super();
		this.type=Collision.CYLINDER;
	};
	calcSupport(ans,v){
		var m = this.matrix;

		var l = v[0]*m[3]+v[1]*m[4]+v[2]*m[5];
		if(l>0){
			ans[1]=-1;
		}else{
			ans[1]=1;
		}
		var x = v[0]*m[0]+v[1]*m[1]+v[2]*m[2];
		var z = v[0]*m[6]+v[1]*m[7]+v[2]*m[8];
		l = Math.sqrt(x*x+z*z);
		if(l!==0){
			l=-1/l;
		}
		ans[0]=x*l;
		ans[2]=z*l;

		Mat43.dotVec3(ans,m,ans);
	};

	rayCast(p0,p1,normal) {
		//ƒVƒŠƒ“ƒ_‚Æ’¼ü
		var min=-99999;
		var max=99999;

		var d = Vec3.poolAlloc();
		var p = Vec3.poolAlloc();
		Mat43.dotVec3(p,this.inv_matrix,p0);
		Mat43.dotVec3(d,this.inv_matrix,p1);
		Vec3.sub(d,d,p);


		//‰~’Œc‚ÌŒü‚«
		var n = d[1];  //ŒX‚«
		var pn = p[1]; //‹——£
		if(n===0){
			if(pn*pn>1){
				Vec3.poolFree(2);
				return Collision.INVALID;
			}
		}
		n=1/n;
		if(n>0){
			max = Math.min(max,(1-pn)*n);
			min = Math.max(min,(-1-pn)*n);
		}else{
			max = Math.min(max,(-1-pn)*n);
			min = Math.max(min,(1-pn)*n);
		}

		//‰~’Œ‚Ì…•½•ûŒü
		var A = d[0]*d[0] + d[2]*d[2];
		var B = p[0]*d[0] + p[2]*d[2];
		var C = p[0]*p[0] + p[2]*p[2] - 1*1;
		var flg=false;
		if(A===0){
			if(p[0]*p[0]+p[2]*p[2]>1){
				Vec3.poolFree(2);
				return Collision.INVALID;
			}
		}else{
			var l = B*B-A*C;
			if(l<0){
				Vec3.poolFree(2);
				return Collision.INVALID;
			}
			var a=(-B - Math.sqrt(l))/A;
			if(min<a){
				min=a;
				flg=true;

			}
			max=Math.min(max,(-B + Math.sqrt(l))/A);
		}

		if(min>max){
			Vec3.poolFree(2);
			return Collision.INVALID;
		}
		if(normal){
			if(flg){
				Vec3.madd(p,p,d,min);
				Vec3.set(normal,p[0],0,p[2]);
			}else{
				Vec3.set(normal,0,p[1],0);
			}
			Mat33.dotVec3(normal,this.matrix,normal);
			Vec3.norm(normal);

		}
		Vec3.poolFree(2);
		return min;
	}
};
