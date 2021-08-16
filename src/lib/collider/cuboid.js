
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import {AABB,AABBTree} from "../aabb.js"
import Collision from "./collision.js"
var DIMENSION = 3; //ŽŸŒ³”
export default class Cuboid  extends Collision{
		//’¼•û‘Ì
		constructor(){
			super();
			this.type=Collision.CUBOID;
			this.bold=0;
		}
		calcSupport(ans,v){
			var m=this.matrix;
			if(m[0]*v[0] + m[1]*v[1] + m[2]*v[2] > 0){
				ans[0]=-1;
			}else{
				ans[0]=1;
			}
			if(m[3]*v[0] + m[4]*v[1] + m[5]*v[2] > 0){
				ans[1]=-1;
			}else{
				ans[1]=1;
			}
			if(m[6]*v[0] + m[7]*v[1] + m[8]*v[2] > 0){
				ans[2]=-1;
			}else{
				ans[2]=1;
			}

			Mat43.dotVec3(ans,m,ans);
		}
		rayCast(p0,p1,normal) {
			var min=-99999;
			var max=99999;
			var aaa;
			var d = Vec3.poolAlloc();
			var p = Vec3.poolAlloc();
			Mat43.dotVec3(p,this.inv_matrix,p0);
			Mat43.dotVec3(d,this.inv_matrix,p1);
			Vec3.sub(d,d,p);

			for(var i=0;i<DIMENSION;i++){
				var n = d[i];  //ŒX‚«
				var pn = p[i]; //‹——£
				
				if(n===0){
					if(pn*pn>1){
						Vec3.poolFree(2);
						return Collision.INVALID;
					}
					continue;
				}
				n=1/n;
				max = Math.min(max,(Math.sign(n)-pn)*n);
				var l=(-Math.sign(n)-pn)*n;
				if(min<l){
					min=l;
					aaa=i;
				}
			}
			Vec3.poolFree(2);
			if(min<max){
				if(normal){
					normal[0]=this.matrix[aaa*3];
					normal[1]=this.matrix[aaa*3+1];
					normal[2]=this.matrix[aaa*3+2];
					Vec3.mul(normal,normal,-Math.sign(d[aaa]));
					Vec3.norm(normal);
				}
				return min;
			}else{
				return Collision.INVALID;
			}
		}
	};

