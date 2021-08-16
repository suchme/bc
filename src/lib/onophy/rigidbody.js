import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import PhyObj from "./phyobj.js"
import OnoPhy from "./onophy.js"
import Collider from "../collider/collider.js"

var MIN = Math.min;
var MAX = Math.max;

export default class RigidBody extends PhyObj{
	//剛体オブジェクト
	constructor(){
		super();
		//物理オブジェクト
		this.name; //オブジェクト名称
		this.type = OnoPhy.RIGID;
		this.fix=1; //1固定 0挙動計算対象
		this.moveflg=1;
		this.matrix =new Mat43(); //オブジェクトの姿勢等
		this.inv_matrix=new Mat43(); //逆行列

		this.collision=null; //コリジョン
		this.collisionSize = new Vec3(); //コリジョンの大きさ

		this.mass=1.0; //質量
		this.inv_mass = 0; //質量の逆数
		this.COMBase = new Vec3(); //初期姿勢での重心
		this.COM = new Vec3(); //重心
		this.inertiaTensorBase=new Mat33(); //初期姿勢での慣性テンソル
		this.inertiaTensor=new Mat33; //慣性テンソル
		this.inv_inertiaTensor=new Mat33;//慣性テンソルの逆行列
		this.friction=0.2; //摩擦力(動摩擦力)
		this.restitution= 0; //反発係数

		this.location=new Vec3(); //位置
		this.scale=new Vec3(); //スケール
		this.rotq=new Vec4(); //回転状態(クォータニオン)

		this.v = new Vec3(); //速度
		this.oldv = new Vec3(); //計算前の速度
	}

	calcPre(){
		//ステップ前処理
		var rotL = Vec3.poolAlloc();
		var r = Mat33.poolAlloc();

		var m=this.matrix;
		//位置サイズクォータニオンから行列と逆行列をつくる
		Mat43.fromLSR(m,this.location,this.scale,this.rotq);

		//慣性テンソルと角速度から前ステップの角運動量を求める
		Mat33.dotVec3(rotL,this.inertiaTensor,this.rotV);
		//現在の傾きと直交慣性モーメントから慣性テンソルを求める
		Vec4.toMat33(r,this.rotq);
		Mat33.dot(this.inertiaTensor,r,this.inertiaTensorBase);
		Mat33.getInv(r,r);
		Mat33.dot(this.inertiaTensor,this.inertiaTensor,r);
		Mat33.getInv(this.inv_inertiaTensor,this.inertiaTensor);
		//前ステップの角運動量から角速度を求める
		Mat33.dotVec3(this.rotV,this.inv_inertiaTensor,rotL);


		//重心位置
		Vec4.rotVec3(this.COM,this.rotq,this.COMBase);
		Vec3.add(this.COM,this.COM,this.location);

		this.refreshCollision();

		Vec3.poolFree(1);
		Mat33.poolFree(1);
	}

	refreshInertia(){
		//剛体の細かいパラメータを計算する
		if(!this.collision){
			return;
		}
		var type = this.collision.type;
		var obj = this .parent;
		var sx = obj.bound_box[3]*obj.scale[0];
		var sy = obj.bound_box[4]*obj.scale[1];
		var sz = obj.bound_box[5]*obj.scale[2];
			
		//慣性テンソルベースの計算
		Mat33.mul(this.inertiaTensorBase,this.inertiaTensorBase,0);
		Vec3.set(this.COMBase,0,0,0 );
		switch(type){
		case Collider.CAPSULE:
		case Collider.CYLINDER:
			var a =MAX(sx,sz);
			var l = sy*2;
			var xz=(a*a/4.0 + l*l/12.0);
			this.inertiaTensorBase[0]=xz;
			this.inertiaTensorBase[4]=1/2*a*a;
			this.inertiaTensorBase[8]=xz;
			break;
		case Collider.CUBOID:
			this.inertiaTensorBase[0]=1/3*(sy*sy+sz*sz);
			this.inertiaTensorBase[4]=1/3*(sx*sx+sz*sz);
			this.inertiaTensorBase[8]=1/3*(sx*sx+sy*sy);
			break;
		case Collider.CONE:
			var r = MAX(sx,sy);
			var xy=3/80*(4.0*r*r + 4*sz*sz);
			var z=3/10*r*r;
			this.inertiaTensorBase[0]=xy;
			this.inertiaTensorBase[4]=xy;
			this.inertiaTensorBase[8]=z;
			Vec3.set(this.COMBase,0,0,-sz*0.5 );
			break;
		case Collider.CONVEX_HULL:
		case Collider.MESH:
			var faces=this.mesh.faces;
			var vertices=this.mesh.vertices;
			var S=0; //総体積
			var PS = Vec3.poolAlloc(); //体積*重心
			Vec3.set(PS,0,0,0);
			var p = Vec3.poolAlloc(); //部分の重心
			var p1 = Vec3.poolAlloc(); //四面体の頂点(４つ目は原点)
			var p2 = Vec3.poolAlloc();
			var p3 = Vec3.poolAlloc();
			var I = Mat33.poolAlloc(); //慣性モーメント
			for(var i=0;i<faces.length;i++){ //ポリゴン数分ループ
				for(var j=0;j<faces[i].idxnum-2;j++){ //trianglefan対応
					Vec3.vecmul(p1,vertices[faces[i].idx[0]].pos,obj.scale);
					Vec3.vecmul(p2,vertices[faces[i].idx[1+j]].pos,obj.scale);
					Vec3.vecmul(p3,vertices[faces[i].idx[2+j]].pos,obj.scale);
					var s = (p1[1]*p2[2]*p3[0]
						+ p1[2]*p2[0]*p3[1]
						+ p1[0]*p2[1]*p3[2]
						- p1[2]*p2[1]*p3[0]
						- p1[0]*p2[2]*p3[1]
						-  p1[1]*p2[0]*p3[2]) * (1/6); //部分体積
					Vec3.add(p,p1,p2);
					Vec3.add(p,p,p3);
					Vec3.mul(p,p,0.25);//部分重心
					calcInertia(I,p1,p2,p3); //慣性テンソル係数

					Vec3.madd(PS,PS,p,s);//重心*体積 の合計
					S+=s; //体積の合計

					//慣性テンソル比*体積
					//慣性テンソル係数*質量としたいところだが質量を求めるためには
					//体積比が必要だが総体積がわからないため先に部分体積だけを掛けておく
					Mat33.madd(this.inertiaTensorBase,this.inertiaTensorBase,I,s);
				}
			}
			if(S!==0){
				S = 1/S;
			}
			Vec3.mul(this.COMBase,PS,S); //重心
			Mat33.mul(this.inertiaTensorBase,this.inertiaTensorBase,S);//重心周りの慣性テンソル
			calcTranslateInertia(I,this.COMBase); //重心ズレ分の慣性テンソル
			Mat33.madd(this.inertiaTensorBase,this.inertiaTensorBase,I,-1); //中心周りの慣性テンソル
			
			Vec3.poolFree(5);
			Mat33.poolFree(1);
			break;
		case Collider.SPHERE:
		default:
			var a =MAX(sx,MAX(sy,sz));
			var i=(2.0/5.0)*a*a;
			this.inertiaTensorBase[0]=i;
			this.inertiaTensorBase[4]=i;
			this.inertiaTensorBase[8]=i;
			break;
		}

		this.inv_mass = 1.0/this.mass;
		if(this.fix===1){
			this.mass=9999999;
			this.inv_mass = 0;
		}
		Mat33.mul(this.inertiaTensorBase,this.inertiaTensorBase,this.mass);
	}
	refreshCollision(){
		//コリジョンの状態を更新
		//
		var m=this.matrix;
		var collision=this.collision;
		if(!collision)return;
		var sx=this.collisionSize[0]*this.scale[0];
		var sy=this.collisionSize[1]*this.scale[1];
		var sz=this.collisionSize[2]*this.scale[2];
		var bold = 0;
		switch(collision.type){
		case Collider.SPHERE:
			bold = MAX(MAX(sx,sy),sz);
			sx=sy=sz=0;
			break;
		case Collider.CAPSULE:
			bold = Math.max(sx,sz);
			sy=Math.max(this.collisionSize[1]*this.scale[1]-bold,0)
			break;
		case Collider.MESH:
		case Collider.CONVEX_HULL:
			var vertices = this.mesh.vertices;
			for(var i=0;i<vertices.length;i++){
				Mat43.dotVec3(collision.poses[i],m,vertices[i].pos);
			}
			sx=this.scale[0];
			sy=this.scale[1];
			sz=this.scale[2];
			break;
		}
		var scale = Vec3.poolAlloc();
		Vec3.set(scale,sx,sy,sz);
		Mat43.fromLSR(collision.matrix,this.location,scale,this.rotq);
		Vec3.poolFree(1);
		collision.bold = bold;

		if(collision.type !== Collider.MESH || !collision.aabbTreeRoot){
			collision.refresh();
		}
	}

	update(dt){
		//状態更新
		if(this.fix){
			//固定オブジェクトは何もしない
			return;
		}

		var rq= Vec4.poolAlloc();
		var bV0=Vec3.poolAlloc();

		Vec3.mul(this.rotV,this.rotV,this.onophy.ANGDAMP);//回転摩擦
		var l=Vec3.scalar(this.rotV);
		if(l>0){
			//角速度がある場合回転処理を行う
			
			//角速度ベクトルから今回回転分のクォータニオンを求める
			var d=1/l;
			Vec4.fromRotVector(rq,l*dt,this.rotV[0]*d,this.rotV[1]*d,this.rotV[2]*d);
			Vec4.qdot(this.rotq,rq,this.rotq);//姿勢のクォータニオンにかける
			
			//オブジェクト中心と重心のズレ補正
			Vec3.sub(bV0,this.COM,this.location);
			Vec4.rotVec3(bV0,rq,bV0);
			Vec3.sub(bV0,this.COM,bV0);
			Vec3.sub(bV0,bV0,this.location);
			Vec3.add(this.location,this.location,bV0);
		}

		Vec3.mul(this.v,this.v,this.onophy.LINDAMP);//平行移動摩擦
		Vec3.madd(this.location,this.location,this.v,dt);//移動量を足す


		this.impFlg=0;

		Vec4.poolFree(1);
		Vec3.poolFree(1);

		//this.calcPre();
	}

	calcEfficM(m,r1){
		//点r1に力を加えたとき点がどれだけ加速するかを計算するための行列を求める
		var r = Vec3.poolAlloc();
		var R1 = Mat33.poolAlloc();

		Vec3.sub(r,r1,this.COM);
		Mat33.set(R1,0,r[2],-r[1],-r[2],0,r[0],r[1],-r[0],0);

		Mat33.dot(m,R1,this.inv_inertiaTensor);
		Mat33.dot(m,m,R1);
		Mat33.mul(m,m,-1);
		m[0]+=this.inv_mass;
		m[4]+=this.inv_mass;
		m[8]+=this.inv_mass;

		Vec3.poolFree(1);
		Mat33.poolFree(1);
	}
	calcVelocity(v,pos){
		Vec3.sub(v,pos,this.COM);
		Vec3.cross(v,this.rotV,v);
		Vec3.add(v,v,this.v);
	}
	addImpulse(pos,impulse){
		//衝撃を与える
		if(this.fix){
			//固定の場合は無視
			return;
		}

		Vec3.madd(this.v,this.v,impulse, this.inv_mass);//並行

		//回転
		var addimpulseBuf = Vec3.poolAlloc();
		Vec3.sub(addimpulseBuf,pos,this.COM);//重心からの差
		Vec3.cross(addimpulseBuf,addimpulseBuf,impulse); //角運動量
		Mat33.dotVec3(addimpulseBuf,this.inv_inertiaTensor,addimpulseBuf);//角加速度
		Vec3.add(this.rotV,this.rotV,addimpulseBuf); //角速度に加える

		Vec3.poolFree(1);
	}
	
	addImpulse2(pos,impulse){
		//衝撃を与える
		if(this.fix){
			//固定の場合は無視
			return;
		}
		var v1= Vec3.poolAlloc();
		var v2= Vec3.poolAlloc();
		var dpos= Vec3.poolAlloc();
		var l1,l2;

		Vec3.mul(v1,impulse, this.inv_mass);//並行
		l1 = Vec3.scalar(v1);

		//回転
		Vec3.sub(dpos,pos,this.COM);//重心からの差
		Vec3.cross(v2,dpos,impulse); //角運動量
		Mat33.dotVec3(v2,this.inv_inertiaTensor,v2);//角加速度
		Vec3.cross(dpos,dpos,v2);
		l2 = Vec3.scalar(dpos);


		if(l1+l2){
			var l=1/(l1+l2);
			l1*=l;
			l2*=l;
			Vec3.madd(this.v,this.v,v1,l1);//並行
			Vec3.madd(this.rotV,this.rotV,v2,l2); //角速度に加える
		}
		

		Vec3.poolFree(3);
	}
	

	addImpulseR(impulse){
		//衝撃を与える(回転のみ
		if(this.fix){
			//固定の場合は無視
			return;
		}
		var addimpulseBuf = Vec3.poolAlloc();
		Mat33.dotVec3(addimpulseBuf,this.inv_inertiaTensor,impulse);
		Vec3.add(this.rotV,this.rotV,addimpulseBuf);
		Vec3.poolFree(1);
	}

	getExPos(a,b){
		//ワールド座標を剛体のローカル座標にする
		Mat43.getInv(this.inv_matrix,this.matrix);
		Mat43.dotVec3(a,this.inv_matrix,b);
	}
	getFriction(){
		//摩擦力を返す
		return this.friction;
	}
	getRestitution(){
		//反発係数を返す
		return this.restitution;
	}
	getInvInertiaTensor(){
		//逆慣性テンソルを返す
		return this.inv_inertiaTensor;
	}

};
	var calcTranslateInertia=function(I,v){
		//平行移動の慣性テンソルを求める
		var x =v[0];
		var y =v[1];
		var z =v[2];
		I[0] = y*y+z*z;
		I[1] = -x*y;
		I[2] = -x*z;
		I[3] = -y*x;
		I[4] = x*x+z*z;
		I[5] = -y*z;
		I[6] = -z*x;
		I[7] = -z*y;
		I[8] = x*x+y*y;
	}
	var calcInertia=function(I,a,b,c){
		//頂点a,b,c,0で構成される単位重量(1グラム)の
		//四面体の慣性テンソルを求める
		var kx=a[0]+b[0]+c[0];
		var kxx=a[0]*a[0]+b[0]*b[0]+c[0]*c[0];
		var kxy=a[0]*a[1]+b[0]*b[1]+c[0]*c[1];
		var ky=a[1]+b[1]+c[1];
		var kyy=a[1]*a[1]+b[1]*b[1]+c[1]*c[1];
		var kyz=a[1]*a[2]+b[1]*b[2]+c[1]*c[2];
		var kz=a[2]+b[2]+c[2];
		var kzz=a[2]*a[2]+b[2]*b[2]+c[2]*c[2];
		var kxz=a[2]*a[0]+b[2]*b[0]+c[2]*c[0];

		I[0]=ky*ky + kyy + kz*kz + kzz;
		I[1]=- (kx*ky + kxy);
		I[2]=- (kx*kz + kxz);
		I[3]=- (kx*ky + kxy);
		I[4]=kx*kx + kxx + kz*kz + kzz;
		I[5]=- (ky*kz + kyz);
		I[6]=- (kx*kz + kxz);
		I[7]=- (ky*kz + kyz);
		I[8]=kx*kx + kxx + ky*ky + kyy;

		Mat33.mul(I,I,1/20);
	}
