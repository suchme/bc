import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../lib/vector.js"
import Collider from "../lib/collider/collider.js"

var scope=[
	[-1,-1,-1]
	,[-1,1,-1]
	,[1,1,-1]
	,[1,-1,-1]
	,[-1,-1,1]
	,[-1,1,1]
	,[1,1,1]
	,[1,-1,1]
];
//カメラ
export default class Camera{
	constructor(){
		this.p=new Vec3();
		this.a=new Vec3();
		this.aov= 0.577;
		this.znear=1;
		this.zfar=10;

		this.cameracol=new Collider.ConvexHull();
		this.cameracol2=new Collider.ConvexHull();
		for(var i=0;i<8;i++){
			this.cameracol.poses.push(new Vec3());
			this.cameracol2.poses.push(new Vec3());
		}
		this.pvMatrix=new Mat44();
		this.matrix=new Mat43();
	}

	calcCollision2(collision,matrix,z_near,z_far){
		var v4=Vec4.poolAlloc();

		for(var i=0;i<8;i++){
			Vec3.copy(v4,scope[i]);
			v4[3]=1;
			if(v4[2]<0){
				Vec4.mul(v4,v4,z_near);
			}else{
				Vec4.mul(v4,v4,z_far);
			}
			
			Mat44.dotVec4(v4,matrix,v4);
			Vec3.copy(collision.poses[i],v4);
		}
		collision.refresh();
		Vec4.poolFree(1);
	}
	calcCollision(collision,matrix){
		var im = Mat44.poolAlloc();
		var v4=Vec4.poolAlloc();
		if(!matrix){
			//Mat44.dot(im,ono3d.projectionMatrix,ono3d.viewMatrix);
			Mat44.getInv(im,this.pvMatrix);
		}else{
			Mat44.getInv(im,matrix);
		}

		for(var i=0;i<8;i++){
			Vec3.copy(v4,scope[i]);
			v4[3]=1;
			if(!matrix){
				if(v4[2]<0){
					Vec4.mul(v4,v4,this.znear);
				}else{
					Vec4.mul(v4,v4,this.zfar);
				}
			}
			Mat44.dotVec4(v4,im,v4);
			Vec3.copy(collision.poses[i],v4);
		}
		collision.refresh();
		Vec4.poolFree(1);
		Mat44.poolFree(1);
	}
}
