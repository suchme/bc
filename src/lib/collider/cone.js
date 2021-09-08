
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import {AABB,AABBTree} from "../aabb.js"
import Collision from "./collision.js"
var DIMENSION = 3; //ŸŒ³”
var m_sqrt5 = -1/Math.sqrt(5);
export default class Cone extends Collision{
	//‰~
	constructor(){
		super();
		this.type=Collision.CONE;
	};
	calcSupport(ans,v){
		Mat43.dotMat33Vec3(ans,this.inv_matrix,v);
		Vec3.norm(ans);
		if(ans[1]<m_sqrt5){
			//’¸“_
			Vec3.set(ans,0,1,0);
		}else{
			//’ê–Ê
			ans[1]=0;
			Vec3.nrm(ans,ans);
			ans[1]=1;
			Vec3.mul(ans,ans,-1);
		}
		Mat43.dotVec3(ans,this.matrix,ans);
	};

	rayCast(p0,p1,normal) {
		//ƒR[ƒ“‚Æ’¼ü
		var min=-99999;
		var max=99999;
		var flg =false;

		var d = Vec3.poolAlloc();
		var p = Vec3.poolAlloc();
		Mat43.dotVec3(p,this.inv_matrix,p0);
		Mat43.dotVec3(d,this.inv_matrix,p1);
		Vec3.sub(d,d,p);

		var pn = p[1]; //‹——£
		if(d[1]===0){
			//ƒŒƒC‚ª…•½‚Èê‡
			if(pn*pn>1){
				//‚‚³‚ª+-1‚æ‚è‘å‚«‚¢ê‡‚ÍÚG‚µ‚È‚¢
				min=99999;
			}else{
				var r=(1-p)*0.5; //ƒŒƒC‚Ì‚ ‚é‚‚³‚Ì”¼Œa

				var A = d[0]*d[0] + d[2]*d[2];
				var B = p[0]*d[0] + p[2]*d[2];
				var C = p[0]*p[0] + p[2]*p[2] - r*r;
				if(A===0){
					//ƒŒƒC‚ª0ƒxƒNƒgƒ‹‚Ìê‡
					if(p[0]*p[0]+p[2]*p[2]>r*r){
						//”¼Œa‚æ‚èŠO‚È‚çÚG‚µ‚Ä‚¢‚È‚¢
						min = 999999;
					}
				}else{
					var l = B*B-A*C;
					if(l<0){
						//”»•Ê®•‰‚Ìê‡ÚG‚µ‚È‚¢
						min=999999;
					}else{
						min=Math.max(min,(-B - Math.sqrt(l))/A);
					}
				}
			}
		}else{

			//ƒR[ƒ“‚Ì‘¤–Ê
			p[2]-=1;
			var A = (4/5)*(d[0]*d[0] + d[1]*d[1]  +d[2]*d[2]) - d[1]*d[1];
			var B = (4/5)*(p[0]*d[0] + p[1]*d[1] + p[2]*d[2]) - p[1]*d[1];
			var C = (4/5)*(p[0]*p[0] + p[1]*p[1] + p[2]*p[2]) - p[1]*p[1];

			var l = B*B-A*C;
			if(l<0){
				//”»•Ê®‚ª•‰‚Ìê‡ÚG‚µ‚È‚¢
				min=99999;
			}else{

				if(A>0){
					min=(-B - Math.sqrt(l))/A;
					max=(-B + Math.sqrt(l))/A;
				}else if(A<0){
					if(d[2]>0){
						//max = Math.min(max,(-B-Math.sqrt(l))/A);
						max = (-B+Math.sqrt(l))/A;
					}else{
						//min= Math.max(min,(-B+Math.sqrt(l))/A);
						min= (-B-Math.sqrt(l))/A;
					}
				}else{
					if(B<0){
						min=-C/(2*B);
					}else{
						max=-C/(2*B);
					}
				}

				//‚‚³ÚG”ÍˆÍ +-1
				var invz=1/d[1];
				if(invz>0){
					max = Math.min(max,(1-pn)*invz);
					var min2 = (-1-pn)*invz;
					if(min2>min){
						min = min2;
						flg=true;
					}
				}else{
					max = Math.min(max,(-1-pn)*invz);
					min = Math.max(min,(1-pn)*invz);
				}
			}
		}

		if(min>max){
			//”ÍˆÍ‹t“]‚Ìê‡ÚG‚µ‚Ä‚¢‚È‚¢
			min=Collision.INVALID;
			if(normal){
				Vec3.set(normal,0,0,0);
			}
		}else{
			if(normal){
				Vec3.madd(p,p,d,min);
				if(flg){
					Vec3.set(normal,0,-1,0);
				}else{
					var l = this.matrix[9]*this.matrix[9]+this.matrix[10]*this.matrix[10]+this.matrix[11]*this.matrix[11];
					Vec3.set(normal,p[0],0.5/l,p[2]);
				}
				Mat33.dotVec3(normal,this.matrix,normal);
				Vec3.norm(normal);
			}
		}

		Vec3.poolFree(2);
		return min;
	}
};
