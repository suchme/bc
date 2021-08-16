
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import Collision from "./collision.js"
import Collider from "./collider.js"
import Sphere from "./sphere.js"
var sphere=new Sphere();
Mat43.set(sphere.matrix,1,0,0,0,1,0,0,0,1,0,0,0);
sphere.bold=0;
export default class ConvexHull extends Collision{
		//凸包
		constructor(){
			super();
			this.type=Collision.CONVEX_HULL;
			//this.mesh=null; //メッシュ情報
			this.poses=[]; //頂点座標
		}

		calcSupport(ans,v){
			var n=0;
			var poses=this.poses;
			var l = Vec3.dot(v,poses[n]);
			for(var i=1;i<poses.length;i++){
				var l2 = Vec3.dot(v,poses[i]);
				if(l2<l){
					l=l2;
					n=i;
				}
			}
			Vec3.copy(ans,poses[n]);
		}

		rayCast(p0,p1,normal){
			sphere.matrix[9]=p0[0];
			sphere.matrix[10]=p0[1];
			sphere.matrix[11]=p0[2];
			sphere.refresh();
			var ang=Vec3.poolAlloc();
			var buf=Vec3.poolAlloc();
			Vec3.sub(ang,p1,p0);
			var l =Collider.convexCast(ang,sphere,this,normal,buf);
			Vec3.poolFree(2);

			return l;
		};
	}
