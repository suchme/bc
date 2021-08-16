"use strict"
import Collider from "../collider/collider.js"
import PhyObj from "./phyobj.js"
import RigidBody from "./rigidbody.js"
import PhyFace from "./phyface.js"
import Cloth from "./cloth.js"
import SoftBody from "./softbody.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
var OnoPhy = (function(){
	var MIN = Math.min;
	var MAX = Math.max;

	var REPETITION_MAX=10; //繰り返しソルバ最大回数
	var DT; //ステップ時間
	var CFM=0.99; //柔らかい拘束
	var ERP= 0.1*60.0;//めり込み補正値
	
	var OnoPhy = function(){
		this.rigidBodies = []; //剛体
		this.springs= []; //ばね
		this.clothes =[]; //布
		this.joints = []; //ジョイント
		this.repetition=0; //ソルバ繰り返した回数

		this.collider=new Collider(); //コライダ
		this.hitConstraints=[]; //コリジョン接触情報
		this.disableList=new Array(1024); //コリジョン無効リスト

		this.ANGDAMP = 0;//回転摩擦
		this.LINDAMP = 0;//平行移動摩擦
		this.GRAVITY = 9.81; //重力加速度
	}
	var ret = OnoPhy;

	var i=0;


	ret.prototype.init = function(){
		//剛体削除
		var rigidBodies = this.rigidBodies;
		for(var i=rigidBodies.length;i--;){
			var rigidBody = rigidBodies[i];
			//コリジョンを削除
			if(rigidBody.collision){
				this.collider.deleteCollision(rigidBody.collision);
			}
			rigidBodies.splice(i,1);
		}
		//ジョイント削除
		var joints=this.joints;
		for(var i=joints.length;i--;){
			joints.splice(i,1);
		}
		//スプリングオブジェクト削除
		var springs=this.springs;
		for(var i=springs.length;i--;){
			springs.splice(i,1);
		}
	}

	
	ret.RigidBody = RigidBody;

	var Constraint=(function(){
		//拘束クラス
		var Constraint=function(){
			this.obj1 = null; //接触物体1
			this.obj2 = null; //接触物体2
			this.pos1= new Vec3(); //接触位置1
			this.pos2 = new Vec3(); //接触位置2

			this.impulse=new Vec3(); //衝撃
			this.axisM = new Mat33();
			this.axis = []; //接触法線と従法線
			this.axis[0]=new Float32Array(this.axisM.buffer,0,3);
			this.axis[1]=new Float32Array(this.axisM.buffer,4*3,3);
			this.axis[2]=new Float32Array(this.axisM.buffer,4*6,3);

			this.coeffM=new Mat33(); // impulse = coeffM x a

			this.offset=new Vec3(); //めり込み位置補正用
		}
		var ret=Constraint;

		ret.prototype.calcDiffVelocity = function(dv){
			//二点間の速度差を求める
			var calcBuf = Vec3.poolAlloc();
			this.obj1.calcVelocity(dv,this.pos1);
			this.obj2.calcVelocity(calcBuf,this.pos2);
			Vec3.sub(dv,calcBuf,dv);
			Vec3.poolFree(1);
		}

		ret.prototype.addImpulse = function(impulse){
			//二点に直線の力を加える
			var mem = Vec3.poolAlloc();
			this.obj1.addImpulse(this.pos1,impulse);
			Vec3.mul(mem,impulse,-1);
			this.obj2.addImpulse(this.pos2,mem);
			Vec3.poolFree(1);
		}
		ret.prototype.addImpulse2 = function(impulse){
			//二点に直線の力を加える
			var mem = Vec3.poolAlloc();
			this.obj1.addImpulse2(this.pos1,impulse);
			Vec3.mul(mem,impulse,-1);
			this.obj2.addImpulse2(this.pos2,mem);
			Vec3.poolFree(1);
		}
		ret.prototype.addImpulseR = function(impulse){
			//二点に回転の力を加える
			var mem = Vec3.poolAlloc();
			this.obj1.addImpulseR(impulse);
			Vec3.mul(mem,impulse,-1);
			this.obj2.addImpulseR(mem);
			Vec3.poolFree(1);
		}

		var calcEffic = ret.calcEffic =function(v,m,X){
			// 制限1軸の場合の係数行列を求める
			// F=(vX/((MX)X)X
			Mat33.dotVec3(v,m,X);
			Vec3.mul(v,X,1/Vec3.dot(v,X));
		}
			
		var calcEffic2 = ret.calcEffic2 =function(v1,v2,m,X,Y){
			// 制限2軸の場合の係数行列を求める
			//F = ((vX*MYY-vYMYX)X - (vxMXY-vYMXX)Y) / (MXX*MYY - MXY*MYX) 
			Mat33.dotVec3(v1,m,X);
			var mxx=Vec3.dot(v1,X);
			var mxy=Vec3.dot(v1,Y);
			Mat33.dotVec3(v1,m,Y);
			var myx=Vec3.dot(v1,X);
			var myy=Vec3.dot(v1,Y);

			var denom = 1/ (mxx*myy  - mxy*myx);
			v1[0]=(myy*X[0] - myx*Y[0])  *denom;
			v1[1]=(myy*X[1] - myx*Y[1])  *denom;
			v1[2]=(myy*X[2] - myx*Y[2])  *denom;
			v2[0]=(- mxy*X[0] + mxx*Y[0])  *denom;
			v2[1]=(- mxy*X[1] + mxx*Y[1])  *denom;
			v2[2]=(- mxy*X[2] + mxx*Y[2])  *denom;
		}
		var calcEffic3 = ret.calcEffic3 =function(v1,v2,v3,m,X,Y,Z){
			// 制限3軸の場合の係数行列を求める
			//F = M^-1 v
			Mat33.getInv(m,m);
			Mat33.calcTranspose(m,m);
			Mat33.dotVec3(v1,m,X);
			Mat33.dotVec3(v2,m,Y);
			Mat33.dotVec3(v3,m,Z);
		}
		ret.prototype.calcEfficM= function(m){
			//接触点に力を加えたときどれだけ加速するかを計算するための行列を求める
			var mat1 = Mat33.poolAlloc();
			this.obj1.calcEfficM(mat1,this.pos1);
			this.obj2.calcEfficM(m,this.pos2);
			Mat33.add(m,m,mat1);
			Mat33.poolFree(1);
		}

		return ret;
	})();

	class HitConstraint extends Constraint{
		//物体の接触拘束
		constructor(){
			super();

			this.pos1ex = new Vec3(); //接触相対位置1
			this.pos2ex = new Vec3(); //接触相対位置2

			this.impulseR=new Vec3(); //回転摩擦関係
			this.rM=new Mat33();

			this.fricCoe = 0; //2物体間の摩擦係数
		}

		calcPre(){
			var obj1=this.obj1;
			var obj2=this.obj2;
			var dv=Vec3.poolAlloc();
			var nM=Mat33.poolAlloc();

			if(!obj1.fix){
				obj1.impFlg=1;
			}
			if(!obj2.fix){
				obj2.impFlg=1;
			}

			//法線方向と従法線方向
			//Vec3.sub(this.axis[0],this.pos2,this.pos1);
			Vec3.norm(this.axis[0]);
			this.axis[1][0] = this.axis[0][2];
			this.axis[1][1] = this.axis[0][0];
			this.axis[1][2] = -this.axis[0][1];
			this.axis[2][0] = -this.axis[0][1];
			this.axis[2][1] = this.axis[0][2];
			this.axis[2][2] = this.axis[0][0];
			//for(var i=0;i<3;i++){
			//	for(var j=0;j<3;j++){
			//		this.axisM[i*3+j]=this.axis[i][j];
			//	}
			//}


			Mat33.add(this.rM,obj1.getInvInertiaTensor(),obj2.getInvInertiaTensor());
			Mat33.getInv(this.rM,this.rM);

			//位置補正
			Vec3.sub(this.offset,this.pos2,this.pos1);
			Vec3.nrm(dv,this.offset);
			Vec3.madd(this.offset,this.offset,dv,-0.005); //少しだけめりこみを残す
			Vec3.mul(this.offset,this.offset,ERP); //めり込み補正係数
			
			//2物体間の摩擦係数
			this.fricCoe = obj1.getFriction() * obj2.getFriction(); 

			//反発力
			this.calcDiffVelocity(dv);//速度差
			Vec3.madd(this.offset,this.offset,this.axis[0]
				, Vec3.dot(dv, this.axis[0])
				*(obj1.getRestitution() * obj2.getRestitution()));//反発分

			//加速に必要な力を求めるための行列
			this.calcEfficM(nM);
			//垂直方向
			var coeff = Vec3.poolAlloc();
			var coeff2 = Vec3.poolAlloc();
			Constraint.calcEffic(coeff,nM,this.axis[0]);
			for(var i=0;i<3;i++){
				this.coeffM[i*3] =coeff[i];
			}
			//水平方向
			Constraint.calcEffic2(coeff,coeff2,nM,this.axis[1],this.axis[2]);
			for(var i=0;i<3;i++){
				this.coeffM[i*3+1] =coeff[i];
				this.coeffM[i*3+2] =coeff2[i];
			}
			Vec3.poolFree(2);

			//次のフレームでの持続判定に使うための相対位置
			obj1.getExPos(this.pos1ex,this.pos1);
			obj2.getExPos(this.pos2ex,this.pos2);

			this.counter++;

			Vec3.poolFree(1);
			Mat33.poolFree(1);
		}
		calcConstraintPre(){
			//前処理
			this.calcPre();

			var impulse = Vec3.poolAlloc();
			Vec3.set(impulse,0,0,0);
			Mat33.dotVec3(impulse,this.axisM,this.impulse);
			this.addImpulse(impulse);
			this.addImpulseR(this.impulseR);

			Vec3.poolFree(1);
		}

		calcConstraint(){
			var dv = Vec3.poolAlloc();
			var impulse = Vec3.poolAlloc();
			//法線方向
			var o = this.impulse[0]; //前の値
			var old2 = this.impulse[1]; //前の値
			var old3 = this.impulse[2]; //前の値
			this.calcDiffVelocity(dv); //衝突点の速度差
			Vec3.add(dv,dv,this.offset);//位置補正分
			Mat33.dotVec3(impulse,this.coeffM,dv);
			Vec3.add(this.impulse,this.impulse,impulse);

			this.impulse[0]= MAX(this.impulse[0],0); //撃力が逆になった場合は無しにする
			this.impulse[0]*=CFM; //やわらか拘束補正
			Vec3.mul(impulse, this.axis[0], this.impulse[0]-o); 
			this.addImpulse(impulse); //撃力差分を剛体の速度に反映

			//従法線方向(摩擦力)

			var max =this.impulse[0] * this.fricCoe; //法線撃力から摩擦最大量を算出
			var maxr = max * 0.01; //法線撃力から最大転がり抵抗を算出
			if(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]>0.0001){
				max*=0.9; //静止していない場合はちょっと減らす
			}
			
			var l =this.impulse[1]*this.impulse[1]+this.impulse[2]*this.impulse[2];
			if (l > max*max) { //摩擦力が最大量を上回る場合は最大量でセーブ
				l = max/Math.sqrt(l);
				this.impulse[1]*=l;
				this.impulse[2]*=l;
			}
			Vec3.mul(impulse,this.axis[1],this.impulse[1]-old2);
			Vec3.madd(impulse,impulse,this.axis[2],this.impulse[2]-old3);
			this.addImpulse(impulse); //差分摩擦力を速度に反映

			//転がり抵抗
			var old = Vec3.poolAlloc();
			Vec3.copy(old,this.impulseR);
			Vec3.sub(dv,this.obj2.rotV,this.obj1.rotV);
			Vec3.madd(dv,dv,this.axis[0],-Vec3.dot(dv,this.axis[0])); //摩擦方向の力
			Mat33.dotVec3(impulse,this.rM,dv);
			Vec3.add(this.impulseR,this.impulseR,impulse);
			Vec3.copy(impulse,this.impulseR);
			var l =Vec3.dot(impulse,impulse);
			if (l > maxr*maxr) { //摩擦力が最大量を上回る場合は最大量でセーブ
				Vec3.madd(this.impulseR,this.impulseR,impulse,maxr/Math.sqrt(l) - 1);
			}
			Vec3.mul(this.impulseR,this.impulseR,CFM);
			Vec3.sub(impulse,this.impulseR,old);
			this.addImpulseR(impulse);
			
			Vec3.poolFree(3);
		}

	};

	var disableHitConstraints=[];
	for(var i=0;i<1024;i++){
		disableHitConstraints.push(new HitConstraint());
	}

		var fv=[];
		for(var i=0;i<3;i++){
			fv.push(new Vec3());
		}
		var a=new Array(3);
		var b=new Array(3);
	class LinConstraint extends Constraint{
		//並進速度拘束
		constructor(){
			super();

			this.lim=new Array(3);
			this.motorMax=0; //モーター最大力
			this.bane=new Vec3();
		}

		calcPre(){
			var m=Mat33.poolAlloc();
			this.calcEfficM(m);

			this.calcCoeffM(m);
			
			Mat33.poolFree(1);
			return;
		};

		calcConstraintPre(){
			this.calcPre();

			//ウォームスタート
			var impulse = Vec3.poolAlloc();
			Mat33.dotVec3(impulse,this.axisM,this.impulse);
			this.addImpulse(impulse);
			Vec3.poolFree(1);

		}

		calcConstraint(){
			var old = Vec3.poolAlloc();
			var impulse = Vec3.poolAlloc();

			Vec3.copy(old,this.impulse); //現在の拘束力保存
			this.calcDiffVelocity(impulse); //速度差
			Vec3.add(impulse,impulse,this.offset); //位置差(めり込み)補正分追加
			Mat33.dotVec3(impulse,this.coeffM,impulse);//速度差位置差0にするための力算出
			Vec3.add(this.impulse,this.impulse,impulse);//合計の力に加える
			Vec3.mul(this.impulse,this.impulse,CFM);//やわらか拘束補正

			for(var i=0;i<OnoPhy.DIMENSION;i++){
				//与える力の制限
				if(this.motorMax!==0 && i===0){
					//モーター最大力積を超えないようにする
					this.impulse[i]= MAX(this.impulse[i],this.motorMax);
				}else{
					//片方のみ制限の場合は逆方向の力は加えない
					if(!this.lim[i]){
						this.impulse[i]= MAX(this.impulse[i],0); 
					}
				}
			}
			Vec3.sub(impulse,this.impulse,old); //前回との力の差
			Mat33.dotVec3(impulse,this.axisM,impulse); //力を向きをワールド座標に変換
			this.addImpulse(impulse); //オブジェクトに力を加える

			Vec3.poolFree(2);
		}

		calcCoeffM(m){
			var idx=0;
			for(var i=0;i<OnoPhy.DIMENSION;i++){
				if( Vec3.scalar(this.axis[i])){
					a[idx]=this.axis[i];
					b[idx]=fv[i];
					idx++;
				}else{
					fv[i].fill(0);
				}
			}

			if(idx==1){
				Constraint.calcEffic(b[0],m,a[0]);
			}else if(idx==2){
				Constraint.calcEffic2(b[0],b[1],m,a[0],a[1]);
			}else if(idx==3){
				Constraint.calcEffic3(b[0],b[1],b[2],m,a[0],a[1],a[2]);
			}

			for(var i=0;i<OnoPhy.DIMENSION;i++){
				this.coeffM[i]=fv[i][0];
				this.coeffM[i+3]=fv[i][1];
				this.coeffM[i+6]=fv[i][2];
			}
		}
	};

		var vec=new Vec3();
		var m = new Mat33();
		var impulse = new Vec3();
	class AngConstraint  extends LinConstraint{
		//回転速度拘束
		constructor(){
			super();
		}

		calcPre(){
			Mat33.add(m,this.obj1.inv_inertiaTensor,this.obj2.inv_inertiaTensor);

			this.calcCoeffM(m);
			return;
		};

		calcConstraintPre(){
			this.calcPre();

			var impulse = Vec3.poolAlloc();
			Mat33.dotVec3(impulse,this.axisM,this.impulse);
			this.addImpulseR(impulse);
			Vec3.poolFree(1);
		}
		calcConstraint(){
			var old = Vec3.poolAlloc();
			var imp= Vec3.poolAlloc();
			Vec3.copy(old,this.impulse);
			Vec3.sub(imp,this.obj2.rotV,this.obj1.rotV); //回転速度差
			Vec3.add(imp,imp,this.offset); //補正
			Mat33.dotVec3(imp,this.coeffM,imp);
			Vec3.add(this.impulse,this.impulse,imp);
			Vec3.mul(this.impulse,this.impulse,CFM);

			for(var i=0;i<OnoPhy.DIMENSION;i++){
				//与える力の制限
				var a =this.impulse[i];
				if(this.motorMax!==0 && i===0){
					//モーター最大力積を超えないようにする
					if(a > this.motorMax){
						this.impulse[i]=this.motorMax;
					}
					if(a < -this.motorMax){
						this.impulse[i]=-this.motorMax;
					}
				}else{
					//逆方向の力は加えない
					if(a< 0){
						this.impulse[i]=0;
					}
				}
				
			}
			Vec3.sub(imp,this.impulse,old);
			Mat33.dotVec3(imp,this.axisM,imp);
			this.addImpulseR(imp);
			
			Vec3.poolFree(2);
		}
	};

	class Joint{
		constructor(){
			this.use_breaking=0;
			this.breaking_threshold=0.0; //これ以上力が加わるとジョイントがなくなる(未実装)
			this.disable_collisions=false; //ジョイントされたオブジェクト同士の衝突可否
			this.enabled= false; //有効無効
			this.object1=null; //被ジョイントオブジェクト
			this.object2=null;
			this.matrix = new Mat43(); //ジョイントとオブジェクトとのオフセット行列
			this.matrix2 = new Mat43();

			//位置制限
			this.use_limit_lin=new Vec3();
			this.limit_lin_lower=new Vec3(); 
			this.limit_lin_upper=new Vec3();
			this.use_spring=new Vec3();
			this.spring_damping=new Vec3(); //バネダンパ
			this.spring_stiffness=new Vec3(); //バネ力
			this.use_motor_lin=0;
			this.motor_lin_max_impulse=1; //直線モーター力上限
			this.motor_lin_target_velocity=1; //モーター速度
			//角度制限
			this.use_limit_ang=new Vec3();
			this.limit_ang_lower=new Vec3(); //角度制限
			this.limit_ang_upper=new Vec3();
			this.use_spring_ang=new Vec3();
			this.spring_damping_ang=new Vec3();//角度バネダンパ
			this.spring_stiffness_ang=new Vec3();　
			this.use_motor_ang=0;
			this.motor_ang_max_impulse=1; //角度モーター力上限
			this.motor_ang_target_velocity=1; //モーター角速度

			//拘束オブジェクト
			this.linConstraint = new LinConstraint();
			this.angConstraint = new AngConstraint();
		}

		setConstraint(){

			var vec= Vec3.poolAlloc();
			var dp = Vec3.poolAlloc();
			var dv = Vec3.poolAlloc();
			var trueq= Vec4.poolAlloc();
			var quat = Vec4.poolAlloc();
			var rotmat= Mat33.poolAlloc();
			var bM = Mat43.poolAlloc();
			var bM2 = Mat43.poolAlloc();

			var axis;
			var object1= this.object1;
			var object2= this.object2;

			//ジョイント位置
			Mat43.dot(bM,this.object1.matrix,this.matrix);
			Mat43.dot(bM2,this.object2.matrix,this.matrix2);

			Vec3.set(this.linConstraint.pos1,bM[9],bM[10],bM[11]);
			Vec3.set(this.linConstraint.pos2,bM2[9],bM2[10],bM2[11]);

			//ジョイント角度
			for(var i=0;i<3;i++){
				var j=i*3;
				var l = 1/Math.sqrt(bM[j]*bM[j]+bM[j+1]*bM[j+1]+bM[j+2]*bM[j+2]);
				bM[i*3]=bM[j]*l;
				bM[i*3+1]=bM[j+1]*l;
				bM[i*3+2]=bM[j+2]*l;
				l = 1/Math.sqrt(bM2[j]*bM2[j]+bM2[j+1]*bM2[j+1]+bM2[j+2]*bM2[j+2]);
				bM2[i*3]=bM2[j]*l;
				bM2[i*3+1]=bM2[j+1]*l;
				bM2[i*3+2]=bM2[j+2]*l;
			}
			if(this.parent===this.object1){
				//Mat33.copy(rotmat,bM);
				//Mat33.copy(bM,bM2);
				//Mat33.copy(bM2,rotmat);
			}else{
//				Vec4.toMat33(obj1m,bM2);
//				Mat33.copy(obj2m,bM);
			}

			this.linConstraint.obj1=object1;
			this.linConstraint.obj2=object2;
			this.angConstraint.obj1=object1;
			this.angConstraint.obj2=object2;

			//差
			Vec3.sub(dp,this.linConstraint.pos2,this.linConstraint.pos1); //位置差
			this.linConstraint.calcDiffVelocity(dv);//速度差

			//位置制限
			Vec3.set(this.linConstraint.offset,0,0,0);
			for(var i=0;i<OnoPhy.DIMENSION;i++){
				//軸
				axis = this.linConstraint.axis[i];
				Vec3.set(axis,bM[i*3]
					,bM[i*3+1]
					,bM[i*3+2]);
				//ばね
				if(this.use_spring[i]){
					Vec3.mul(vec,axis,DT*Vec3.dot(axis,dp)*this.spring_stiffness[i]);
					Vec3.madd(vec,vec,axis,DT*Vec3.dot(axis,dv)*this.spring_damping[i]);
					this.linConstraint.addImpulse2(vec);
				}

				if(this.use_limit_lin[i]){
					//位置差
					var l = Vec3.dot(axis,dp);
					//制限範囲を超えている場合
					if(l< this.limit_lin_lower[i]){
						l= this.limit_lin_lower[i] - l;
						Vec3.mul(axis,axis,-1);
					}else if(l> this.limit_lin_upper[i]){
						l= l - this.limit_lin_upper[i];
					}else{
						Vec3.mul(axis,axis,0);
					}
					if(this.limit_lin_lower[i]==this.limit_lin_upper[i]){
						//両制限の場合フラグを立てる
						this.linConstraint.lim[i]=1;
					}else{
						this.linConstraint.lim[i]=0;
					}
					Vec3.madd(this.linConstraint.offset
						,this.linConstraint.offset,axis,l);//本来の位置
				}else{
					Vec3.mul(axis,axis,0);
				}
				if(this.use_motor_lin && i===0){
					this.linConstraint.motorMax=this.motor_lin_max_impulse;
				}
			}

			Vec3.mul(this.linConstraint.offset,this.linConstraint.offset,ERP);
			if(this.use_motor_lin){
				Vec3.madd(this.linConstraint.offset,
					this.linConstraint.offset
					,this.linConstraint.axis[0],this.motor_lin_target_velocity); //モータ影響
			}


			//角度制限
			Mat33.getInv(rotmat,bM);
			Mat33.dot(rotmat,rotmat,bM2); //差分回転行列
			Mat33.getEuler(dp,rotmat); //オイラー角に変換

			Vec3.sub(dv,this.object2.rotV,this.object1.rotV);//回転速度差
			Vec4.set(trueq,1,0,0,0);
			Vec3.set(this.angConstraint.bane,0,0,0);
			for(var ii=0;ii<OnoPhy.DIMENSION;ii++){
				var i=ii;
				//if(ii==1)i=2;
				//if(ii==2)i=1;

				axis = this.angConstraint.axis[i];
				//軸の向き
				if(i===0){
					Vec3.set(axis,bM2[0],bM2[1],bM2[2]);
				}else if(i===2){
					Vec3.set(axis,bM[3],bM[4],bM[5]);
					Vec3.set(vec,bM2[0],bM2[1],bM2[2]);
					Vec3.cross(axis,vec,axis);
				}else if(i===1){
					Vec3.set(axis,bM[3],bM[4],bM[5]);
					//Vec3.set(vec,bM2[0],bM2[1],bM2[2]);
					//Vec3.cross(axis,vec,axis);
					//Vec3.cross(axis,axis,vec);
				}
				Vec3.norm(axis);
				//Vec3.mul(axis,axis,-1);

				//角度
				var d = dp[i];
				if(this.use_spring_ang[i]){
					//ばね
					var vv=this.angConstraint.bane;
					Vec3.madd(vv,vv,axis,d*this.spring_stiffness_ang[i]*DT);//角度差
					Vec3.madd(vv,vv,axis,Vec3.dot(dv,axis)*this.spring_damping_ang[i]*DT);
					//this.angConstraint.addImpulseR(vec);
				}

				if(this.use_limit_ang[i]){
					//制限範囲を超えている場合
					if(d< this.limit_ang_lower[i]){
						d=  this.limit_ang_lower[i] - d ;
						Vec3.mul(axis,axis,-1);
					}else if(d > this.limit_ang_upper[i]){
						d= d - this.limit_ang_upper[i];
					}else{
						Vec3.mul(axis,axis,0);
					}
					Vec4.fromRotVector(quat,d,axis[0],axis[1],axis[2]);
					Vec4.qdot(trueq,trueq,quat);
				}else{
					Vec3.mul(axis,axis,0);
				}
				if(this.use_motor_ang && i===0){
					//回転モーター
					this.angConstraint.motorMax=this.motor_ang_max_impulse;
				}
			}

			Vec4.toTorque(this.angConstraint.offset,trueq); //クォータニオンから回転ベクトルを求める
			Vec3.mul(this.angConstraint.offset,this.angConstraint.offset,ERP);

			if(this.use_motor_ang){
				Vec3.madd(this.angConstraint.offset,
				this.angConstraint.offset
				,this.angConstraint.axis[0],this.motor_ang_target_velocity); //モータ影響
			}

			if(!object1.fix){
				object1.impFlg=true;
			}
			if(!object2.fix){
				object2.impFlg=true;
			}

			Vec3.poolFree(3);
			Vec4.poolFree(2);
			Mat33.poolFree(1);
			Mat43.poolFree(2);
		}
		calcConstraintPre(){
			this.linConstraint.calcConstraintPre();
			this.angConstraint.calcConstraintPre();
		}
		calcConstraint(){
			this.linConstraint.calcConstraint();
			this.angConstraint.calcConstraint();
		}
		bane(){

			this.angConstraint.addImpulseR(this.angConstraint.bane);
		}
	};
	ret.Joint = Joint;

	var Spring =  (function(){
		var Spring = function(){
			//ばね
			this.defaultLength=0; //デフォルト長さ
			this.k=1; //ばね定数
			this.c=0; //ダンパ係数
			this.p0 = new Vec3(); //ばね先端1座標
			this.p1 = new Vec3(); //ばね先端2座標
			this._p0 = new Vec3(); //前回の座標
			this._p1 = new Vec3(); //前回の座標
			this.con1Obj = null; //接続オブジェクト1
			this.con1Pos = new Vec3(); //オブジェクト接続座標
			this.con2Obj = null; //接続オブジェクト2
			this.con2Pos = new Vec3(); //オブジェクト接続座標
		}
		var ret = Spring;

		ret.prototype.calc =function(){
			var dv= Vec3.poolAlloc();
			var dp=Vec3.poolAlloc();
			var n=Vec3.poolAlloc();
			//接続点
			if(this.con1){
				Mat43.dotVec3(this.p0,this.con1.matrix,this.con1Pos);
				this.con1.calcVelocity(dp,this.p0);
			}else{
				Vec3.sub(dp,this.p0,this._p0);
			}
			if(this.con2){
				if(this.con2.type===OnoPhy.FACE){
					Vec3.set(this.p1,0,0,0);
					for(var i=0;i<3;i++){
						Vec3.madd(this.p1,this.p1,this.con2.p[i].location,this.con2.ratio[i]);
					}
				}else{
					Mat43.dotVec3(this.p1,this.con2.matrix,this.con2Pos);
				}
				this.con2.calcVelocity(dv,this.p1);
			}else{
				Vec3.sub(dv,this.p1,this._p1);
			}
			//速度差
			Vec3.sub(dv,dv,dp);

			//位置差
			Vec3.sub(dp,this.p1,this.p0);
			//バネ長さ
			var defaultLength = this.defaultLength;
			
			//バネのび量
			var l = -defaultLength + Vec3.scalar(dp);
			Vec3.nrm(n,dp);//バネ向き

			var damp=this.c*Vec3.dot(dv,n); //ダンパ力
			var spr = l*this.f; //バネ力
			Vec3.mul(n,n,(damp+spr)*DT);

			if(this.con1){
				//Vec3.sub(dp,this.p0,this.con1.location);
				this.con1.addImpulse2(this.p0,n);
			}
			if(this.con2){
				//Vec3.sub(dp,this.p1,this.con2.location);
				Vec3.mul(n,n,-1);
				this.con2.addImpulse2(this.p1,n);
			}

			Vec3.copy(this._p0,this.p0);
			Vec3.copy(this._p1,this.p1);

			Vec3.poolFree(3);
		}
		return ret;
	})();
	

	ret.prototype.createRigidBody = function(){
		var phyobj=new RigidBody();
		phyobj.parent = this;
		this.rigidBodies.push(phyobj);

		return phyobj;
	}
	ret.prototype.addPhyObj= function(phyObj){
		phyObj.onophy=this;
		if(phyObj.type===OnoPhy.RIGID){
			this.rigidBodies.push(phyObj);
			this.collider.addCollision(phyObj.collision);
		}else{
			this.clothes.push(phyObj);
		}

	}

	ret.prototype.deleteRigidBody = function(object){
		//オブジェクト削除
		var rigidBodies=this.rigidBodies;
		for(var i=rigidBodies.length;i--;){
			if(rigidBodies[i]===object){
				//コリジョンを削除
				if(object.collision){
					this.deleteCollision(object.collision);
				}
				rigidBodies.splice(i,1);
				break;
			}
		}
	}
	ret.prototype.createJoint= function(){
		var joint =new Joint();
		this.joints.push(joint);
		return joint;
	}
	ret.prototype.addJoint= function(joint){
		this.joints.push(joint);
	}

	ret.prototype.deleteJoint= function(joint){
		//ジョイント削除
		var joints=this.joints;
		for(var i=joints.length;i--;){
			if(joints[i]===joint){
				joints.splice(i,1);
				break;
			}
		}
	}

	ret.prototype.createSpring = function(){
		//スプリングオブジェクト作成
		var res=new Spring();
		this.springs.push(res)
		return res
	}
	ret.prototype.deleteSpring = function(obj){
		//スプリングオブジェクト削除
		var springs=this.springs;
		for(var i=0;i<springs.length;i++){
			if(springs[i]===obj){
				springs.splice(i,1);
				break;
			}
		}
	}

	ret.prototype.removeHitConstraint=function(i){
		//削除
		var hitConstraint = this.hitConstraints[i];
		this.hitConstraints.splice(i,1);
		if(hitConstraint.obj1.type===OnoPhy.FACE){
			Cloth.disablePhyFace.push(hitConstraint.obj1);
		}
		if(hitConstraint.obj2.type===OnoPhy.FACE){
			Cloth.disablePhyFace.push(hitConstraint.obj2);
		}
		disableHitConstraints.push(hitConstraint);
	}

	ret.prototype.readjustHitConstraint=function(target){
		var obj1 = target.obj1;
		var obj2 = target.obj2;
		var pos1= target.pos1;
		var pos2= target.pos2;
		var hitConstraint;
		var hitConstraints = this.hitConstraints;

		//座標が近いやつはまとめる
		for(var i=hitConstraints.length;i--;){
			hitConstraint=hitConstraints[i];

			if(Vec3.len2(hitConstraint.pos1,pos1)<0.01
			&& Vec3.len2(hitConstraint.pos2,pos2)<0.01){

				if(hitConstraint === target){
					continue;
				}
				//力をまとめる
				Vec3.add(target.impulse,target.impulse,hitConstraint.impulse);
				Vec3.add(target.impulseR,target.impulseR,hitConstraint.impulseR);

				//削除
				this.removeHitConstraint(i);
			}
		}

		if(!(obj1.type === OnoPhy.RIGID &&  obj2.type === OnoPhy.RIGID)){
			return;
		}

		//同一の組み合わせが一定以上の場合は古いやつから消して一定数以下にする
		var count=0;
		var max=8;
		for(var i=hitConstraints.length;i--;){
			hitConstraint=hitConstraints[i];

			if(hitConstraint.obj1!== obj1|| hitConstraint.obj2!==obj2){
				continue;
			}

			if(Vec3.dot(hitConstraint.axis[0],target.axis[0])<0){
				//めり込み方向が反対の場合は削除
				this.removeHitConstraint(i);
				continue;
			}

			count++;
			if(count>max){
				//一定数以上なので削除
				this.removeHitConstraint(i);
			}
		}
	}
	ret.prototype.registHitConstraint = (function(){
		return function(obj1,pos1,obj2,pos2,hitConstraint){

			if(Vec3.len2(pos1,pos2) === 0 ){
				//例外
				return null;
			}

			if(!hitConstraint){
				//新しく取得する場合
				hitConstraint = disableHitConstraints.pop();
				this.hitConstraints.push(hitConstraint);
				hitConstraint.obj1 = obj1;
				hitConstraint.obj2 = obj2;
				Vec3.set(hitConstraint.impulse,0,0,0);
				Vec3.set(hitConstraint.impulseR,0,0,0);

			}

			Vec3.copy(hitConstraint.pos1,pos1);
			Vec3.copy(hitConstraint.pos2,pos2);

			Vec3.sub(hitConstraint.axis[0],pos2,pos1);
			Vec3.norm(hitConstraint.axis[0]);
			
			hitConstraint.counter=0;


			return hitConstraint;

		};
	})();


	/** dt秒シミュレーションを進める **/
	ret.prototype.calc=function(dt){

		this.DT = dt;
		DT=dt; //ステップ時間をグローバルに格納
		this.dt =dt;
		var rigidBodies = this.rigidBodies ; //剛体配列

		var dv=Vec3.poolAlloc();

		for(i = this.rigidBodies.length;i--;){
			//判定用行列更新
			this.rigidBodies[i].calcPre();
		}

		var idx=0;
		for(var i=0;i<this.joints.length;i++){
			//コリジョン無効リスト作成
			if(this.joints[i].disable_collisions){
				//ジョイント接続されたもの同士の接触無効
				this.disableList[idx]=Collider.getPairId(
					this.joints[i].object1.collision.id
					,this.joints[i].object2.collision.id);
				idx++;

			}
		}
		this.disableList[idx]=-1;

		//すべてのコリジョンの衝突判定
		this.collider.All(this.disableList,idx);
		var hitList = this.collider.hitList;

		for(var i=0;hitList[i].col1;i++){
			//接触拘束作成
			var hit = hitList[i];
			//if(!hit.col1.parent.moveflg && !hit.col2.parent.moveflg){
			//	continue;
			//}
			if(hit.col1.parent && hit.col2.parent){
				var hitConstraint = this.registHitConstraint(hit.col1.parent,hit.pos1,hit.col2.parent,hit.pos2);
				if(hitConstraint){
					this.readjustHitConstraint(hitConstraint);
				}
			}
		}


		for(var i=0;i<this.joints.length;i++){
			//ジョイント拘束セット+ばね
			this.joints[i].setConstraint();
		}

		for(i = this.springs.length;i--;){
			//バネ処理
			this.springs[i].calc();
		}
		for(var i=0;i<this.joints.length;i++){
			//バネ処理
			this.joints[i].bane();
		}

		for(i = this.clothes.length;i--;){
			//クロス処理
			this.clothes[i].calcPre(this);
		}
		for(var i = 0;i<this.clothes.length;i++){
			for(var j = i+1;j<this.clothes.length;j++){
				//クロス同士の接触処理
				this.clothes[i].calcCollision(this.clothes[j],this);
			}
		}
		

		//衝突情報の持続判定
		var ans1=Vec3.poolAlloc();
		var ans2=Vec3.poolAlloc();
		var ans4=Vec3.poolAlloc();
		var t=Vec3.poolAlloc();
		for(var i=0;i<this.hitConstraints.length;i++){
			var hitConstraint = this.hitConstraints[i];

			var obj1=hitConstraint.obj1;
			var obj2=hitConstraint.obj2;
			//if(!obj1.moveflg && !obj2.moveflg){
			//	continue;
			//}
			if(hitConstraint.counter === 0){
				//接触1フレーム目は無視
				continue;
			}

			if(obj1.type !== OnoPhy.RIGID || obj2.type !== OnoPhy.RIGID){
				if(obj1.type===OnoPhy.FACE){
					Cloth.disablePhyFace.push(hitConstraint.obj1);
				}
				if(obj2.type===OnoPhy.FACE){
					Cloth.disablePhyFace.push(hitConstraint.obj2);
				}
				this.hitConstraints.splice(i,1);
				disableHitConstraints.push(hitConstraint);
				i--;
				continue;
			}

			//前回の衝突点の現在位置を求めてめり込み具合を調べる
			var l,l2;
			Mat43.dotVec3(ans1,obj1.matrix,hitConstraint.pos1ex);
			Vec3.sub(t,ans1,hitConstraint.axis[0]);
			if(obj2.collision.type==Collider.MESH){
				l=obj2.collision.rayCast(ans1,t);
				if(l<-0.03){
					l=999;
				}
			}else{
				l=obj2.collision.rayCast(ans1,t);
			}
			if(l === Collider.INVALID){
				l = 999;
			}
			Vec3.madd(ans2,ans1,hitConstraint.axis[0],-l);

			Mat43.dotVec3(ans4,obj2.matrix,hitConstraint.pos2ex);
			Vec3.add(t,ans4,hitConstraint.axis[0]);
			if(obj1.collision.type==Collider.MESH){
				l2=obj1.collision.rayCast(ans4,t);
				if(l2<-0.03){
					l2=999;
				}
			}else{
				l2=obj1.collision.rayCast(ans4,t);
			}
			if(l2 === Collider.INVALID){
				l2 = 999;
			}
			
			if(l2<l){
				//めり込みが大きい方を採用
				Vec3.copy(ans2,ans4);
				Vec3.madd(ans1,ans2,hitConstraint.axis[0],l2);
				l=l2;
			}

			if(l>=0){
				//めり込んでいない場合は削除
				this.hitConstraints.splice(i,1);
				disableHitConstraints.push(hitConstraint);
				i--;
			}else{
				//持続処理
				this.registHitConstraint(obj1,ans1,obj2,ans2,hitConstraint);
			}
		}	
		for(i = this.rigidBodies.length;i--;){
			//重力
			var obj = rigidBodies[i];
			if(obj.fix)continue
			obj.v[1]-=this.GRAVITY*dt;
		}


		//繰り返しソルバ
		performance.mark("impulseStart");
		var repetition;
		var constraints = [];
		//拘束を一つの配列にまとめる
		Array.prototype.push.apply(constraints,this.hitConstraints);
		Array.prototype.push.apply(constraints,this.joints);
		var clothes=this.clothes;
		//Array.prototype.push.apply(constraints,this.clothes);
		

		for (var i = 0;i<constraints.length; i++) {
			//ウォームスタート処理
			constraints[i].calcConstraintPre();
		}

		for (repetition = 0; repetition < REPETITION_MAX; repetition++) {
			//繰り返し最大数まで繰り返して撃力を収束させる
			var impnum=0;
			for(i = rigidBodies.length;i--;){
				//現在の速度を保存
				var o = rigidBodies[i];
				if(!o.impFlg){continue;}
				Vec3.copy(o.oldv,o.v);
				Vec3.copy(o.oldrotV,o.rotV);
				impnum++;
			}

			for (var i = 0;i<constraints.length; i++) {
				constraints[i].calcConstraint();
			}
			
			//収束チェック
			var sum= 0;
			for(i = rigidBodies.length;i--;){
				var o = rigidBodies[i];
				if(!o.impFlg){continue;}
				Vec3.sub(dv,o.oldv,o.v);
				sum+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);
				Vec3.sub(dv,o.oldrotV,o.rotV);
				sum+=(dv[0]*dv[0]+dv[1]*dv[1]+dv[2]*dv[2]);
				
			}
			if ( sum<= 0.000001*impnum && repetition>1) {
				break;
			}
		}
		
		for (var i = 0;i<clothes.length; i++) {
			//ウォームスタート処理
			clothes[i].calcConstraintPre();
		}
		for(var j=0;j<4;j++){
			for (var i = 0;i<clothes.length; i++) {
				clothes[i].calcConstraint();
			}
		}

		this.repetition=repetition;
		performance.mark("impulseEnd");

		this.LINDAMP = Math.pow(1.0-0.04,dt);
		this.ANGDAMP = Math.pow(1.0-0.1,dt);
		for(i = rigidBodies.length;i--;){
			rigidBodies[i].update(dt);
		}
		for(i = this.clothes.length;i--;){
			this.clothes[i].update(dt);
		}

		Vec3.poolFree(5);
		return;
	}


	return ret
})()
let i=0;
OnoPhy.RIGID= i++; //剛体
OnoPhy.CLOTH = i++ ;//布およびソフトボディ（バネメッシュ）
OnoPhy.FACE = i++ ;//メッシュのうちの1フェイス
OnoPhy.Spring_MESH= i++; //バネメッシュ

export default OnoPhy;
var disablePhyFace=Cloth.disablePhyFace=[]; //接触時のダミー板
for(i=0;i<1024;i++){
	disablePhyFace.push(new PhyFace());
}

OnoPhy.DIMENSION=3; //次元
OnoPhy.Cloth= Cloth;
OnoPhy.SoftBody= SoftBody;
