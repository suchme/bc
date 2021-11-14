import O3o from "./o3o.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
import SceneObjectInstance from "./sceneobjectinstance.js"
export default class O3oInstance{
	constructor(o3o,_objects){
		this.objectInstances=[];
		this.objectInstances_assoc={};
		var objects = o3o.objects;
		if(_objects){
			objects = _objects;
		}

		for(var i=0;i<objects.length;i++){
			//オブジェクトのインスタンスを作成
			var object=objects[i];
			object.idx=i;
			var instance = new SceneObjectInstance(object);
			instance.o3oInstance= this;
			this.objectInstances.push(instance);
			this.objectInstances[object.name]=instance;
		}

		//オブジェクトインスタンス初期化
		Mat44.setInit(ono3d.worldMatrix);
		this.calcMatrix(0,true);


		for(var i=0;i<objects.length;i++){
			//物理設定のあるオブジェクトは物理オブジェクト作成
			var object=objects[i];
			var instance = this.objectInstances[object.name];
			instance.phyObj= O3o.createPhyObj(object,instance);

		}

		for(var i=0;i<objects.length;i++){
			//ジョイント作成
			if(!objects[i].rigid_body_constraint)continue;
			var joint=createPhyJoint(objects[i],this.objectInstances);
			this.objectInstances[i].joint=joint;
		}
		this.o3o= o3o;

		o3o.scenes[0].setFrame(0);
		for(i=0;i<o3o.objects.length;i++){
			//メッシュ変形のバインド
			var object=o3o.objects[i];
			var instance = this.objectInstances[i];
			for(var j=0;j<object.modifiers.length;j++){
				if(object.modifiers[j].type==="MESH_DEFORM"){
					var ins2= this.objectInstances[object.modifiers[j].object.name];
					bind(instance,ins2,object.modifiers[j]);
				}
			}	
		}
		
	}
	searchObject(name){
		var children = this.objectInstances;
		var result = children.find((child)=>{return child.object.name === name;});
		if(result){
			return result;
		}
		children.forEach((child)=>{
			result = child.searchObject(name);
			if(result){
				return false;
			}
		});
		return result;
	}
	calcMatrix(dt,flg){
		for(var i=0;i<this.objectInstances.length;i++){
			this.objectInstances[i].resetMatrix();
		}
		for(var i=0;i<this.objectInstances.length;i++){
			this.objectInstances[i].calcMatrix(dt,flg);
		}

	}

	//コレクション内を描画
	drawCollections(target){
		var objects = this.o3o.getCollectionObjectList(target);

		objects.forEach((object)=>{
			if(object.hide_render){
				return;
			}
			var instance = this.objectInstances[object.name];
			if(instance){
				instance.draw();
			}
		});

	}

	draw(target){
		if(!target){
			//指定なしの場合は全オブジェクト描画
			var objects = this.o3o.objects;
			for(var i=0;i<objects.length;i++){
				if(objects[i].hide_render){
					continue;
				}
				var instance = this.objectInstances[objects[i].name];
				instance.draw();
			}
		}else{
			if(this.o3o.collections.hasOwnProperty(target)){
				//名称指定されている場合は一致してるコレクション以下を描画
				this.drawCollections(target);
			}else{
				//該当コレクションがない場合は同名のオブジェクトを描画
				var instance = this.objectInstances[target];
				instance.draw();
			}
			
		}
	}

	joinPhyObj(onoPhy){
		var objectInstances=this.objectInstances;
		var imat = new Mat43();
		for(var i=0;i<objectInstances.length;i++){
			if(objectInstances[i].phyObj){
				onoPhy.addPhyObj(objectInstances[i].phyObj);
			}
		}
		for(var i=0;i<objectInstances.length;i++){
			if(objectInstances[i].joint){
				var joint = objectInstances[i].joint;

				//接続差異行列設定
				Mat43.getInv(imat,joint.parent.matrix);
				Mat43.dot(joint.matrix,imat,objectInstances[i].matrix);

				Mat43.getInv(imat,joint.child.matrix);
				Mat43.dot(joint.matrix2,imat,objectInstances[i].matrix);

				onoPhy.addJoint(objectInstances[i].joint);
			}
		}
	}
}
	var bind=function(instance,ins2,modifier){
		var object = instance.object;
		var mod= new Mesh();

		mod.ratios=[];
		mod.vertices=Vertex.array(MAX_SIZE);
		mod.faces=Face.array(MAX_SIZE);
		mod.edges=Edge.array(MAX_SIZE);
		for(i=0;i<MAX_SIZE;i++){
			//mod.faces.push(new Face());
			//mod.edges.push(new Edge());
			mod.ratios.push(new Vec4());

		};
		ins2.freezeMesh(mod);
		instance.freezeMesh(bufMesh);
		var binddata=[];
		var ret1 = Vec3.poolAlloc();
		var ret2 = Vec3.poolAlloc();
		var BINDSIZE=2;
		for(var i=0;i<bufMesh.vertexSize;i++){
			var pos = bufMesh.vertices[i].pos;
			var binds=[];

			for(var j=0;j<mod.faceSize;j++){
				//近い面を探す
				var l= 99999999;
				for(var k=0;k<mod.faces[j].idxnum-2;k++){
					Geono.TRIANGLE_POINT(ret1,mod.vertices[mod.faces[j].idx[0]].pos
						,mod.vertices[mod.faces[j].idx[1+k]].pos
						,mod.vertices[mod.faces[j].idx[2+k]].pos
						,pos);
					l = Math.min(l,Vec3.len2(ret1,pos));
				}

				//頂点に既にバインドされている面より近い場合はバインドデータ付与
				var k=0;
				for(k=0;k<binds.length;k++){
					if(binds[k].weight>l){
						break;
					}
				}

				if(k<BINDSIZE){
					var bind={idx:-1,weight:99999,len:0,pweight:[0,0,0]};
					bind.idx = j;
					bind.weight=l;
					binds.splice(k,0,bind);
					binds.splice(BINDSIZE,binds.length-BINDSIZE);
				}

			}
			var sum=0;
			var v = Vec3.poolAlloc();
			for(var j=0;j<binds.length;j++){
				var bind = binds[j];
				//ウェイト変換
				if(bind.weight===0){
					//面との距離が0の場合はウェイト1で終了
					for(var k=0;k<bind.length;k++){
						binds[k].weight=0;
					}
					bind.weight=1;
					sum=1;
					break;
				}
				bind.weight=1/Math.sqrt(bind.weight);//距離の逆数をウェイトにする
				sum+=bind.weight;//総ウェイト

				//面との位置関係を求める
				var face =mod.faces[bind.idx];
				Vec3.cross2(ret1,mod.vertices[face.idx[0]].pos
					,mod.vertices[face.idx[1]].pos
					,mod.vertices[face.idx[2]].pos);
				Vec3.norm(ret1);
				Vec3.sub(ret2,pos,mod.vertices[face.idx[0]].pos);
				bind.len = Vec3.dot(ret1,ret2); //法線距離

				if(face.idxnum==4){
					Geono.calcSquarePos(bind.pweight,mod.vertices[face.idx[0]].pos
						,mod.vertices[face.idx[1]].pos
						,mod.vertices[face.idx[2]].pos
						,mod.vertices[face.idx[3]].pos,pos);
					bind.pweight[2]=bind.pweight[0]*bind.pweight[1];
				}else{
					Vec3.sub(v,mod.vertices[face.idx[2]].pos,mod.vertices[face.idx[1]].pos);
					Vec3.add(v,mod.vertices[face.idx[0]].pos,v);
					Geono.calcSquarePos(bind.pweight,mod.vertices[face.idx[0]].pos
						,mod.vertices[face.idx[1]].pos
						,mod.vertices[face.idx[2]].pos
						,v,pos);
					bind.pweight[2]=0;
				}
				bind.pweight[3]=bind.len;
			}
			Vec3.poolFree(1);

			sum=1/sum;
			for(var j=0;j<binds.length;j++){
				binds[j].weight*=sum;//ウェイトの総計1になるようスケーリング
			}
			binddata.push(binds);
		}
		modifier.binddata=binddata;

		var basePos=[];
		for(var i=0;i<mod.vertexSize;i++){
			basePos.push(new Vec3());
			Vec3.copy(basePos[i],mod.vertices[i].pos);
		}
		modifier.basePos=basePos;
		Vec3.poolFree(2);
	};

	var createPhyJoint =function(sceneObject,objectInstances){
		var search=function(name){
			//物理オブジェクト一覧から名前で探す
			for(var j=0;j<objectInstances.length;j++){
				if(name == objectInstances[j].object.name){
					return objectInstances[j].phyObj;
				}
			}
			return null;
		}
		var rbc = sceneObject.rigid_body_constraint; //剛体コンストレイント情報

		if(!rbc.enabled || !rbc.object1 || !rbc.object2){
			//ジョイント情報無しもしくは不十分な場合は無視
			return;
		}

		var joint = null;

		//ジョイント作成
		joint = new OnoPhy.Joint();//onoPhy.createJoint();
		
		//パラメータセット
		joint.breaking_threshold=rbc.breaking_threshold;
		joint.disable_collisions=rbc.disable_collisions;
		joint.enabled=rbc.enabled ;
		Vec3.copy(joint.limit_ang_lower,rbc.limit_ang_lower);
		Vec3.copy(joint.limit_ang_upper,rbc.limit_ang_upper);
		Vec3.copy(joint.limit_lin_lower,rbc.limit_lin_lower);
		Vec3.copy(joint.limit_lin_upper,rbc.limit_lin_upper);
		joint.motor_ang_max_impulse=rbc.motor_ang_max_impulse;
		joint.motor_ang_target_velocity=rbc.motor_ang_target_velocity;
		joint.motor_lin_max_impulse=rbc.motor_lin_max_impulse;
		joint.motor_lin_target_velocity=rbc.motor_lin_target_velocity;
		joint.object1=rbc.object1;
		joint.object2=rbc.object2;
		Vec3.copy(joint.spring_damping,rbc.spring_damping);
		Vec3.copy(joint.spring_stiffness,rbc.spring_stiffness);
		Vec3.copy(joint.spring_damping_ang,rbc.spring_damping_ang);
		Vec3.copy(joint.spring_stiffness_ang,rbc.spring_stiffness_ang);
		joint.use_breaking=rbc.use_breaking;
		Vec3.copy(joint.use_limit_ang,rbc.use_limit_ang);
		Vec3.copy(joint.use_limit_lin,rbc.use_limit_lin);
		joint.use_motor_ang=rbc.use_motor_ang;
		joint.use_motor_lin=rbc.use_motor_lin;
		Vec3.copy(joint.use_spring,rbc.use_spring);
		Vec3.copy(joint.use_spring_ang,rbc.use_spring_ang);

		//ジョイントタイプによって制限を設ける
		var flg=0;
		if(rbc.type =="FIXED"){
			flg=0x77;
		}else if(rbc.type=="POINT"){
			flg=0x07;
		}else if(rbc.type=="HINGE"){
			flg=0x57;
		}else if(rbc.type=="SLIDER"){
			flg=0x76;
		}else if(rbc.type=="PISTON"){
			flg=0x66;
		}
		for(var i=0;i<3;i++){
			if((flg>>i)& 0x1){
				joint.use_limit_lin[i]=1;
				joint.limit_lin_upper[i]=0;
				joint.limit_lin_lower[i]=0;
			}
			if((flg>>i) & 0x10){
				joint.use_limit_ang[i]=1;
				joint.limit_ang_upper[i]=0;
				joint.limit_ang_lower[i]=0;
			}
		}	

		if(rbc.type!="GENERIC_SPRING"){
			Vec3.set(joint.use_spring,0,0,0);
			Vec3.set(joint.use_spring_ang,0,0,0);
		}
		if(rbc.type=="MOTOR"){
			Vec3.set(joint.use_limit_lin,0,0,0);
			Vec3.set(joint.use_limit_ang,0,0,0);
			Vec3.set(joint.use_spring,0,0,0);
			Vec3.set(joint.use_spring_ang,0,0,0);
		}else{
			joint.use_motor_lin=0;
			joint.use_motor_ang=0;
		}

		//ジョイント接続剛体設定
		joint.object1 = search(joint.object1.name);
		joint.object2 = search(joint.object2.name);

		joint.parent=joint.object1;
		joint.child=joint.object2;
		var imat = new Mat43();

		//接続差異行列設定
		var instance = objectInstances[sceneObject.idx];
		Mat43.getInv(imat,joint.parent.matrix);
		Mat43.dot(joint.matrix,imat,instance.matrix);

		Mat43.getInv(imat,joint.child.matrix);
		Mat43.dot(joint.matrix2,imat,instance.matrix);
		
		
		return joint;
	}
