import Material from "./material.js"
import Ono3d from "../../lib/ono3d.js"
import SH from "../../lib/spherical_harmonics/sh.js";
import UvLayer from "./uvlayer.js"
import RotationMode from "./rotationmode.js"
import ObjectType from "./objecttype.js"
import Vertex from "./vertex.js"
import Face from "./face.js"
import Edge from "./edge.js"
import Mesh from "./mesh.js"
import Collider from "../../lib/collider/collider.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
import bufMesh from "./bufmesh.js"

var sphere = new Collider.Sphere();
var cuboid = new Collider.Cuboid();
var cylinder = new Collider.Cylinder();
var cone = new Collider.Cone();
var capsule = new Collider.Capsule();

var defaultMaterial=  new Material();

var deformMatricies=[];
for(var i=0;i<128;i++){
	deformMatricies.push(new Mat43());
}
var deformMesh = new Mesh();
	var materialTable=new Array(256);

const MAX_SIZE=4096;
deformMesh.ratios=[];
deformMesh.vertices=Vertex.array(MAX_SIZE);
deformMesh.faces=Face.array(MAX_SIZE);
deformMesh.edges=Edge.array(MAX_SIZE);

var table=new Array(64);

for(i=0;i<MAX_SIZE;i++){
	deformMesh.ratios.push(new Vec4());

};


var abs = Math.abs;


var groupMatricies = new Array(64)
		,groupMatFlg= new Array(64)
	;
	for(var i=groupMatricies.length;i--;)groupMatricies[i] = new Mat43();


	var genMatrix=function(mat,obj){
		if(obj.rotation_mode===RotationMode.QUATERNION){
			Mat43.fromLSR(mat,obj.location,obj.scale,obj.rotation);
		}else{
			Mat43.fromLSE(mat,obj.location,obj.scale,obj.rotation);
		}
	}
export default class SceneObjectInstance{
	constructor(object){
		this.object=object;
		this.matrix = new Mat43();
		this.boneMatrices=[];
		this.boneFlgs=[];
		this.children=[];
		if(object.objecttype===ObjectType.ARMATURE){
			var bones = object.data.bones;
			for(var i=0;i<bones.length;i++){
				this.boneMatrices.push(new Mat43());
				this.boneFlgs.push(false);
			}
		}
	}
	
	searchObject(name){
		if(!this.children)return false;
		var result = this.children.find((child)=>{return child.object.name === name;});
		if(result){
			return result;
		}
		this.children.forEach((child)=>{
			result = child.searchObject(name);
			if(result){
				return false;
			}
		});
		return result;
	}
	getTempCollision(groups){
		var collision;
		var obj = this.object;
		var scale=Vec3.poolAlloc();

		Vec3.set(scale,1,1,1);
		if(obj.type==="MESH"){
			var b = obj.bound_box;
			scale[0]=(b[3] - b[0])*0.5;
			scale[1]=(b[4] - b[1])*0.5;
			scale[2]=(b[5] - b[2])*0.5;
		}
		switch(obj.bound_type){
			case "SPHERE":
				collision = sphere;
				break;
		case "BOX":
			collision = cuboid;
			break;
		case "CYLINDER":
			collision = cylinder;
			break;
		case "CONE":
			collision = cone;
			break;
		case "CAPSULE":
			collision = capsule;
			break;
		}
		Mat43.copy(collision.matrix,this.matrix);
		var m = collision.matrix;
		for(var i=0;i<3;i++){
			for(var j=0;j<3;j++){
				m[i*3+j]*=scale[i];
			}
		}
		collision.groups=groups;
		collision.notgroups=0;
		collision.bold=0;

		switch(obj.bound_type){
			case "SPHERE":
				scale[0]=Math.sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2]);
				scale[1]=Math.sqrt(m[3]*m[3]+m[4]*m[4]+m[5]*m[5]);
				scale[2]=Math.sqrt(m[6]*m[6]+m[7]*m[7]+m[8]*m[8]);
				collision.bold=Math.max(Math.max(scale[0],scale[1]),scale[2]);
				break;
			case "CAPSULE":
				scale[0]=Math.sqrt(m[0]*m[0]+m[1]*m[1]+m[2]*m[2]);
				scale[1]=Math.sqrt(m[3]*m[3]+m[4]*m[4]+m[5]*m[5]);
				scale[2]=Math.sqrt(m[6]*m[6]+m[7]*m[7]+m[8]*m[8]);
				collision.bold = Math.max(scale[0],scale[2]);
				var a=(scale[1]-collision.bold)/scale[1];
				m[3]*=a;
				m[4]*=a;
				m[5]*=a;
				break;
		}

		collision.refresh();
		Vec3.poolFree(1);
		return collision;
	}
	hitCheck = function(collider,flg){
		var collision=this.getTempCollision(flg);
		return collider.checkHitAll(collision);
		
	}
	resetMatrix(){
		//オブジェクトの姿勢行列の計算済みフラグをオフにする
		this.flg=false;
		for(var i=0;i<this.boneFlgs.length;i++){
			this.boneFlgs[i]=false;
		}
	}
	calcBoneMatrix(n,dt,flg){
		if(this.boneFlgs[n]){
			//計算済み
			return;
		}

		var matrix = this.boneMatrices[n];
		var object = this.object;
		var bone = object.data.bones[n];
		var poseBone = object.pose.poseBones[n];

		genMatrix(matrix,poseBone); //ボーンの姿勢から行列を作成

		Mat43.dot(matrix,bone.matrix,matrix);//初期姿勢掛ける

		if(bone.parent){
			var m=bone.parent.id;
			this.calcBoneMatrix(m,dt,flg);
			Mat43.dot(matrix,this.boneMatrices[m],matrix); //親行列掛ける
		}
		
		if(object.poseBones){
			var poseBone_ = object.poseBones[n];
			for(var i=0;i<poseBone_.constraints.length;i++){
				var constraint =poseBone_.constraints[i];
				switch(constraint.type){
				case "COPY_ROTATION":
					var target = this.o3oInstance.objectInstances[constraint.target.idx];
					target.calcMatrix(dt,flg);

					Mat33.copy(matrix,target.matrix); //角度を強制的に設定
					break;

				}
			}
		}

		Mat43.dot(matrix,matrix,bone.imatrix); //初期姿勢逆行列

		poseBone.flg=true;
	}
	calcMatrix(dt,flg){
		if(this.flg){
			return;
		}
		var obj = this.object;
		var matrix = this.matrix;
		var phyObj = this.phyObj;
		var o3oInstance = this.o3oInstance;

		if(phyObj){
			if((obj.rigid_body.type !== "PASSIVE" && !flg) && phyObj.type===OnoPhy.RIGID){
				//fixでない剛体の場合はそれに合わせる
				Mat43.copy(matrix,phyObj.matrix);
				this.flg=true;
				return;
			}
		}

		if(obj.rotation_mode===RotationMode.QUATERNION){
			Mat43.fromLSR(matrix,obj.location,obj.scale,obj.rotation);
		}else{
			Mat43.fromLSE(matrix,obj.location,obj.scale,obj.rotation);
		}
		for(var i=0;i<this.boneMatrices.length;i++){
			this.calcBoneMatrix(i,dt,flg);
		}


		if(obj.parent){
			var parent=obj.parent;
			var parentInstance = o3oInstance.objectInstances[parent.idx];
			parentInstance.calcMatrix(dt,flg);

			if(obj.parent_bone){
				var i=this.parent_bone-1;
				this.matrix[11]-=parent.data.bones[i].length;
				Mat43.dot(matrix,parent.data.bones[i].matrix,mat);
				Mat43.dot(matrix,parentInstance.boneMatrices[i],matrix);
			}else{
				Mat43.dot(matrix,obj.iparentmatrix,matrix);
			}
			Mat43.dot(matrix,parentInstance.matrix,matrix);
		}else{
			Mat43.dotMat44Mat43(matrix,ono3d.worldMatrix,matrix);
		}

		if(phyObj){
			if((obj.rigid_body.type =="PASSIVE" || flg) && phyObj.type===OnoPhy.RIGID){
				Vec3.set(phyObj.v,0,0,0);
				Vec3.copy(phyObj.v,phyObj.location);
				Vec3.set(phyObj.rotV,0,0,0);

			
				Mat43.copy(phyObj.matrix,this.matrix);
				//Mat43.dotMat44Mat43(phyObj.matrix,ono3d.worldMatrix,this.matrix);
				Mat43.toLSR(phyObj.location,phyObj.scale,phyObj.rotq,phyObj.matrix);

				if(dt !=0){
					Vec3.sub(phyObj.v,phyObj.location,phyObj.v);
					Vec3.mul(phyObj.v,phyObj.v,1/dt);
				}else{
					Vec3.mul(phyObj.v,phyObj.v,0);
				}
				phyObj.calcPre();
			}

			if(phyObj.type===OnoPhy.CLOTH){

				var dst =bufMesh;
				copyMesh(dst,obj.data);
				var defMat = Mat43.poolAlloc();
		

				this.calcModifiers(dst);


				Mat43.dotMat44Mat43(defMat,ono3d.worldMatrix,this.matrix);

				var bufMeshVertices=dst.vertices;
				var mat0=defMat[0];
				var mat1=defMat[1];
				var mat2=defMat[2];
				var mat3=defMat[3];
				var mat4=defMat[4];
				var mat5=defMat[5];
				var mat6=defMat[6];
				var mat7=defMat[7];
				var mat8=defMat[8];
				var mat9=defMat[9];
				var mat10=defMat[10];
				var mat11=defMat[11];

				var vertices= bufMesh.vertices;
				var dst= bufMesh;

				var points=phyObj.points;
				for(var i=0;i<dst.vertexSize;i++){
					if(points[i].fix || flg){
						var pos=points[i].location;
						var x=vertices[i].pos[0];
						var y=vertices[i].pos[1];
						var z=vertices[i].pos[2];
						pos[0]=mat0*x + mat3*y + mat6*z + mat9;
						pos[1]=mat1*x + mat4*y + mat7*z + mat10;
						pos[2]=mat2*x + mat5*y + mat8*z + mat11;
					}
				}

				Mat43.poolFree(1);
			}
		}
		this.flg=true;
	}

	modMeshDeform(dst,mod){
		//メッシュデフォーム
		if(!mod.basePos){
			return 0;
		}
		var obj = this.object;

		var parentInstance = this.o3oInstance.objectInstances[mod.object.idx];

		//デフォーム親メッシュを計算
		parentInstance.freezeMesh(deformMesh);

		var dmv=deformMesh.vertices;
		var binddata=mod.binddata;
		var f=Vec4.poolAlloc();

		for(var i=0;i<deformMesh.faceSize;i++){
			//デフォーム親面ごとの係数計算
			var face = deformMesh.faces[i];
			var dmv0 = dmv[face.idx[0]].pos;
			var dmv1 = dmv[face.idx[1]].pos;
			var dmv2 = dmv[face.idx[2]].pos;
			var dmv3 = dmv[face.idx[3]].pos;
			var dm = deformMatricies[i];

			//平面方向
			Vec3.sub(f,dmv1,dmv0);
			dm[0]=f[0];
			dm[1]=f[1];
			dm[2]=f[2];
			
			if(face.idxnum==4){
				Vec3.sub(f,dmv2,f);
				Vec3.sub(f,f,dmv3);
				dm[6]=f[0];
				dm[7]=f[1];
				dm[8]=f[2];
				Vec3.sub(f,dmv3,dmv0);
				dm[3]=f[0];
				dm[4]=f[1];
				dm[5]=f[2];
			}else{
				Vec3.sub(f,dmv2,dmv0);
				dm[3]=f[0];
				dm[4]=f[1];
				dm[5]=f[2];
				//Vec3.set(deformbuf2[i],0,0,0);
			}


			//法線方向
			if(face.idx===4){
				Vec3.cross3(f,dmv0 ,dmv2 ,dmv1 ,dmv3);
			}else{
				Vec3.cross2(f,dmv0 ,dmv1 ,dmv2);
			}
			Vec3.norm(f);
			dm[9]=f[0];
			dm[10]=f[1];
			dm[11]=f[2];
		}
		for(var i=0;i<dst.vertexSize;i++){
			//デフォーム子の頂点計算
			var binds=binddata[i];//バインド情報
			var vertex = dst.vertices[i];
			Vec3.set(vertex.pos,0,0,0);
			for(var j=0;j<binds.length;j++){
				//バインド数分ループ
				var bind=binds[j];

				//バインド情報に係数をかけて座標を算出
				Mat43.dotVec4(f,deformMatricies[bind.idx],bind.pweight);
				Vec3.add(f,dmv[deformMesh.faces[bind.idx].idx[0]].pos,f);

				Vec3.madd(vertex.pos,vertex.pos,f,bind.weight); //重みを付けて加算
			}
		}

		Vec4.poolFree(1);
		return 1;

	}

	modMirror(dst,mod){
		//ミラーリングをフリーズ
		var obj = this.object;
		var bufMesh = dst;
		var bufMeshVertices =bufMesh.vertices
		var renderVertex;

		var dstvertices,srcvertices;
		var dstvertex,srcvertex;
		var vertexSize=bufMesh.vertexSize
		var mrr = 0;
		if(mod.use_x){ mrr=0};
		if(mod.use_y){ mrr=1};
		if(mod.use_z){ mrr=2};

		var uv_layerdata = null;
		if(bufMesh.uv_layerSize){
			//uv指定ありの場合はレイヤを設定(0番固定)
			uv_layerdata=bufMesh.uv_layers[0].data;
		}


		for(j =0;j<vertexSize;j++){
			//頂点をコピー
			srcvertex=bufMeshVertices[j];
			dstvertex=bufMeshVertices[j+vertexSize];

			dstvertex.pos[0]=srcvertex.pos[0];
			dstvertex.pos[1]=srcvertex.pos[1];
			dstvertex.pos[2]=srcvertex.pos[2];
			dstvertex.pos[mrr]*=-1;
			//dstvertex.groups=srcvertex.groups;
			dstvertex.groupWeights=srcvertex.groupWeights;
			for(var k=0;k<srcvertex.groups.length;k++){
				dstvertex.groups[k]=srcvertex.groups[k];
			//	dstvertex.groupWeights[k]=srcvertex.groupWeights[k];
			}
			
		}
		var dstFace,srcFace;
		var faceSize=bufMesh.faceSize;
		for(var j =0;j<faceSize;j++){
			//フェイスをコピー
			srcFace= bufMesh.faces[j]
			srcvertices=srcFace.idx;
			dstFace= bufMesh.faces[faceSize+j]
			dstFace.idxnum=srcFace.idxnum;
			dstvertices=dstFace.idx;
			for(var k=0;k<srcFace.idxnum;k++){
				var _k = srcFace.idxnum-k;
				if(k==0){_k=0};

				if(abs(bufMeshVertices[srcvertices[_k]].pos[mrr])>0.01){
					dstvertices[k]= srcvertices[_k] + vertexSize;
				}else{
					//座標が中心に近い場合は共有
					dstvertices[k] = srcvertices[_k];
				}
			}

			dstFace.material = srcFace.material;
			dstFace.mat= srcFace.mat;
			dstFace.fs= srcFace.fs;


		}
		for(var i = 0;i<bufMesh.uv_layerSize;i++){
			var dstdata=bufMesh.uv_layers[i].data;
			var d = faceSize * 2 - dstdata.length;
			for(var j=0;j<d;j++){
				dstdata.push([]);
			}

		}
		if(uv_layerdata){
			//uv情報をコピー
			var dstdata=uv_layerdata;

			for(var j = 0;j<faceSize;j++){
				srcFace= bufMesh.faces[j]
				for(var k=0;k<srcFace.idxnum;k++){
					var _k = srcFace.idxnum-k;
					if(k==0){_k=0};
					dstdata[j+faceSize][k*2] = dstdata[j][_k*2];
					dstdata[j+faceSize][k*2+1] = dstdata[j][_k*2+1];
				}
			}
		}
		var jj=0;
		for(var j =0;j<bufMesh.edgeSize;j++){
			var dst=bufMesh.edges[jj+bufMesh.edgeSize]
			var src=bufMesh.edges[j];
			if(abs(bufMeshVertices[src.vIndices[0]].pos[mrr])<0.01
			 && abs(bufMeshVertices[src.vIndices[1]].pos[mrr])<0.01){
				src.fIndices[1]=src.fIndices[0]+faceSize;

				continue;
			}
			dst.vIndices[0]=src.vIndices[0]+vertexSize;
			dst.vIndices[1]=src.vIndices[1]+vertexSize;
			dst.fIndices[0]=src.fIndices[0]+faceSize;
			if(src.fIndices[1]>=0){
				dst.fIndices[1]=src.fIndices[1]+faceSize;
			}else{
				dst.fIndices[1]=-1;
			}
			jj++;
		}
		bufMesh.edgeSize+=jj;

		for(j=0;j<obj.groups.length;j++){
			table[j]=j;
			var groupName=obj.groups[j];
			if(groupName.match(/L$/)){
				groupName=groupName.replace(/L$/,"R");
			}else if(groupName.match(/R$/)){
				groupName=groupName.replace(/R$/,"L");
			}else{
				continue;
			}

			for(k=0;k<obj.groups.length;k++){
				if(groupName===obj.groups[k]){
					table[j]=k;
					break;
				}
			}
		}
		for(k=0;k<vertexSize;k++){
			var vertex=bufMeshVertices[vertexSize+k];
			for(var l=0;l<8;l++){
				if(vertex.groups[l]<0)continue;
				vertex.groups[l]=table[vertex.groups[l]];
			}
		}
			

		
		bufMesh.faceSize+=faceSize;
		bufMesh.vertexSize+=vertexSize;
	}


	modArmature(dst,mod){
		//アーマチュア変形
		var bufMesh = dst;
		var bufMeshVertices =bufMesh.vertices
		var renderVertex;
		var groupMatrix;
		var groupName;
		var x,y,z;
		var obj = this.object;
		var objectInstances=this.o3oInstance.objectInstances;

		var ratio,pos,vertex;
		var groups=obj.groups;

		var bM = Mat43.poolAlloc();
		var bM2 = Mat43.poolAlloc();
		//var armature_instance= objectInstances[mod.object.name];
		var armature_instance= this.o3oInstance.searchObject(mod.object.name);
		if(!armature_instance)return;
		Mat43.getInv(bM2,armature_instance.matrix);
		Mat43.dot(bM,bM2,this.matrix);
		Mat43.getInv(bM2,bM);

		var bones = mod.object.data.bones;
		var boneMatrices=armature_instance.boneMatrices;



		for(var j=groups.length;j--;){
			groupMatFlg[j] = false;
			groupName=groups[j];
			groupMatrix = groupMatricies[j];
			for(var k=0,kmax=bones.length;k<kmax;k++){
				if(bones[k].name!=groupName)continue
				groupMatFlg[j] = true;
				Mat43.dot(groupMatrix,boneMatrices[k],bM);
				Mat43.dot(groupMatrix,bM2,groupMatrix);
				break
			}
		}
		var bV0=Vec3.poolAlloc();
		for(var k = 0;k<bufMesh.vertexSize;k++){
			pos = bufMeshVertices[k].pos
			vertex = bufMeshVertices[k];
			var vertexGroups = vertex.groups;

			x=0;
			y=0;
			z=0;
			var ratiosum=0;
			for(var j = vertexGroups.length;j--;){
				if(vertexGroups[j]<0)continue;
				if(!groupMatFlg[vertexGroups[j]]){
					continue;
				}
				ratio=vertex.groupWeights[j]
				Mat43.dotVec3(bV0,groupMatricies[vertexGroups[j]],pos)
				
				x +=  bV0[0] * ratio
				y +=  bV0[1] * ratio
				z +=  bV0[2] * ratio
				ratiosum+=ratio;
			}
			if(ratiosum>0){
				ratiosum=1.0/ratiosum;
				pos[0] =  x * ratiosum;
				pos[1] =  y * ratiosum;
				pos[2] =  z * ratiosum;
			}else{
				if(mod.vertex_group >=0){
					Mat43.dotVec3(pos,groupMatricies[mod.vertex_group],pos)
				}
			}
		}
		Vec3.poolFree(1);
		Mat43.poolFree(2);
	}
	calcModifiers(dst){
		//モディファイア適用
		var flg=0;
		var obj = this.object;
		for(var i=0,imax=obj.modifiers.length;i<imax;i++){
			var mod=obj.modifiers[i];
			if(mod.type!="MIRROR" && flg){
				continue;
			}
			if(mod.type=="MIRROR"){
				flg|=this.modMirror(dst,mod);
			}else if(mod.type=="ARMATURE"){
				flg|=this.modArmature(dst,mod);
			}else if(mod.type=="MESH_DEFORM"){
				flg|=this.modMeshDeform(dst,mod);
			}
		}
		return flg;
	}
	freezeMesh = function(dst){
		//モデファイアとワールド行列を反映
		var obj = this.object;
		copyMesh(dst,obj.data);
		

		var flg=false;

		var phyObj = null;

		phyObj = this.phyObj;
		
		flg|=this.calcModifiers(dst);

		if(phyObj){
			if(phyObj.type===OnoPhy.SPRING_MESH || phyObj.type===OnoPhy.CLOTH){
				for(var j=phyObj.points.length;j--;){
					Vec3.copy(dst.vertices[j].pos,phyObj.points[j].location);
				}
				flg =true;
			}
		}

		var defMat = Mat43.poolAlloc();
		if(!flg){
			//既に頂点単位で計算された場合はこの座標変換は行わない
			Mat43.dotMat44Mat43(defMat,ono3d.worldMatrix,this.matrix);

			var bufMeshVertices=dst.vertices;
			var mat0=defMat[0];
			var mat1=defMat[1];
			var mat2=defMat[2];
			var mat3=defMat[3];
			var mat4=defMat[4];
			var mat5=defMat[5];
			var mat6=defMat[6];
			var mat7=defMat[7];
			var mat8=defMat[8];
			var mat9=defMat[9];
			var mat10=defMat[10];
			var mat11=defMat[11];

			for(var i=0;i<dst.vertexSize;i++){
				var pos=bufMeshVertices[i].pos;
				var x=pos[0];
				var y=pos[1];
				var z=pos[2];
				pos[0]=mat0*x + mat3*y + mat6*z + mat9;
				pos[1]=mat1*x + mat4*y + mat7*z + mat10;
				pos[2]=mat2*x + mat5*y + mat8*z + mat11;
			}

			if(Mat43.determinant(defMat)<0){
				//フェイス反転している場合は戻す
				var faces = dst.faces;
				for(var i=0;i<dst.faceSize;i++){
					var idx=faces[i].idx;
					var buf = idx[0];
					idx[0] = idx[2];
					idx[2]= buf;
				}
			}
		}

		Mat43.poolFree(1);
	}

	drawStatic= function(environment,environment2,envratio){
		var oldIdx=ono3d.faces_index;
		this.draw(environment,environment2,envratio);
		var count = ono3d.faces_index-oldIdx;

		var faces=[];
		var renderFaces=ono3d.faces;
		for(var i=0;i<count;i++){
			var face = new Ono3d.Face();
			copyFace(face,renderFaces[i+oldIdx]);
			faces.push(face);

		}
		return faces;
	}
	draw= function(environment,environment2,envratio){
		//描画
		var obj = this.object;
		if(obj.type !== "MESH"){
			return null;
		}

		var o3o = obj.o3o;
		
		//マテリアルインデックステーブルにセット
		materialTable[0]=setMaterial(defaultMaterial,"defaultMaterial");
		var materials = o3o.materials;
		for(var i=0;i<materials.length;i++){
			materialTable[i+1]=setMaterial(materials[i],o3o.name+"_"+materials[i].name);
		}

		if(!environment){
			//環境情報がない場合はデフォルトをセット
			environment = ono3d.environments[0];
			envratio=0.0;
		}
		if(!environment2){
			environment2 = ono3d.environments[0];
		}

		this.freezeMesh(bufMesh); //モデファイア適用

		var bufMeshVertices=bufMesh.vertices;
		var renderVertices =ono3d.verticesFloat32Array;
		var rvIndex=ono3d.vertices_index;
		var renderFaces=ono3d.faces;
		var rfIndex=ono3d.faces_index;
		var rfCount=0;
		var renderMaterials=ono3d.materials;
		var face,renderFace;
		var smoothing=ono3d.smoothing;
		var offsetx=0,offsety=0;

		var uv;

		var uv_layerdata;
		var lightMapUvData;
		if(bufMesh.uv_layerSize){
			//uv指定ありの場合はレイヤを設定(0番固定)
			uv_layerdata=bufMesh.uv_layers[0].data;
			lightMapUvData=bufMesh.uv_layers[0].data;
		}
		if(bufMesh.uv_layerSize>=2){
			//uvが2つ以上ある場合は2個目も設定
			lightMapUvData=bufMesh.uv_layers[1].data;
		}


		//面の法線計算
		var vertices=bufMesh.vertices;
		var faces=bufMesh.faces;
		for(var i=0;i<bufMesh.faceSize;i++){
			var n = faces[i].normal;
			var idx=faces[i].idx;
			if(faces[i].idxnum==3){
				Vec3.cross2(n
					,vertices[idx[0]].pos
					,vertices[idx[1]].pos
					,vertices[idx[2]].pos);
			}else{
				Vec3.cross3(n
					,vertices[idx[0]].pos
					,vertices[idx[2]].pos
					,vertices[idx[1]].pos
					,vertices[idx[3]].pos);
			}
			Vec3.norm(n);
		}
		//if( ono3d.smoothing>0){
		//if( obj.data.use_auto_smooth ){
		if( true){
			//スムーシングする場合頂点法線セット

			for(var i = 0;i<bufMesh.vertexSize;i++){
				//Vec3.set(vertices[i].normal,0,0,0);
				vertices[i].normal.fill(0);
			}
			for(var i=0;i<bufMesh.faceSize;i++){
				var idx=faces[i].idx;
				var fn=faces[i].normal;
				var n=vertices[idx[0]].normal;
				Vec3.add(n,n,fn);
				n=vertices[idx[1]].normal;
				Vec3.add(n,n,fn);
				n=vertices[idx[2]].normal;
				Vec3.add(n,n,fn);
				if(faces[i].idxnum==4){
					n=vertices[idx[3]].normal;
					Vec3.add(n,n,fn);
				}
			}

			for(var i = bufMesh.vertexSize;i--;){
				Vec3.norm(vertices[i].normal);
			}
			smoothing=1;
		}else{
			smoothing=0;
		}

		var lightProbeEnv=environment.lightProbe;
		var bspTree=null;
		var shcoefs=null;
		if(!lightProbeEnv){
			lightProbeEnv=ono3d.environments[0].lightProbe;
		}

		if(lightProbeEnv){
			bspTree = lightProbeEnv.bspTree;

			var vec3 = new Vec3();
			Vec3.set(vec3,this.matrix[9],this.matrix[10],this.matrix[11]);
			var hitTriangle = bspTree.getItem(vec3);
			if(hitTriangle){
				shcoefs=lightProbeEnv.shcoefs;
				//for(var i = bufMesh.vertexSize;i--;){
				//	var vertex=vertices[i];

				//	var hitTriangle = bspTree.getItem(vertex.pos);
				//	vertex.hitTriangle=hitTriangle;
				//	if(!hitTriangle){
				//		continue;
				//	}

				//	var bsps=hitTriangle.bsps;
				//	for(var k=0;k<4;k++){
				//		bufMesh.ratios[i][k]=Vec3.dot(bsps[k].v,vertex.pos)-bsps[k].m;
				//	}
				//}

				
				for(var i=0;i<calcSHcoef.length;i++){
					Vec3.set(calcSHcoef[i],0,0,0);
				}
				var bsps=hitTriangle.bsps;
				var pIdx=hitTriangle.pIdx;
				for(var k=0;k<4;k++){
					var shcoef=shcoefs[pIdx[k]];
					var r=Vec3.dot(bsps[k].v,vec3)-bsps[k].m;
					for(var i=0;i<calcSHcoef.length;i++){
						Vec3.madd(calcSHcoef[i],calcSHcoef[i],shcoef[i],r);
					}
				}
			}
		}


		var ii=rfIndex;
		var jj=rvIndex*20;
		var svec=Vec3.poolAlloc();
		var tvec=Vec3.poolAlloc();
		var color=Vec3.poolAlloc();
		var normal = Vec3.poolAlloc();
		for(var i=0;i<bufMesh.faceSize;i++){
			//フェイスをレンダー用バッファに格納
			face=faces[i];
			var idx=face.idx;

			for(var j=0;j<face.idxnum-2;j++){
				//三角単位でレンダー用バッファに格納
				renderFace = renderFaces[ii];
				ii++;
				rfCount++;
			
				//renderFace.rf = Ono3d.RF_OUTLINE * (1-face.fs);

				//renderFace.smoothing = smoothing;
				//Vec3.copy(facenormal,face.normal);
				var facenormal=face.normal;
				//buff[envratioindex+vindex]=renderface.environmentRatio ;

				renderFace.material= ono3d.materials[materialTable[face.mat+1]];
				renderFace.environments[0] = environment;
				renderFace.environments[1] = environment2;
				renderFace.environmentRatio = envratio;

				uv=null;
				if(face.mat>=0 && uv_layerdata){
					//uv値セット　オフセット分もたす
					offsetx=renderFace.material.offsetx;
					offsety=renderFace.material.offsety;
					uv = uv_layerdata[i];
				}
				var uv2=null;
				if(lightMapUvData){
					uv2 = lightMapUvData[i];
				}


				Vec3.set(svec,-facenormal[1],facenormal[2],facenormal[0]);
				Vec3.set(tvec,facenormal[2],-facenormal[0],facenormal[1]);
				if(renderFace.material.hightMap){
					Ono3d.calcST(svec,tvec
						,vertices[idx[0]].pos
						,vertices[idx[1+j]].pos
						,vertices[idx[2+j]].pos
						,uv[0]
						,uv[1]
						,uv[(1+j)*2]
						,uv[(1+j)*2+1]
						,uv[(2+j)*2]
						,uv[(2+j)*2+1]
					)
				}
				renderFace.vertices[0]=rvIndex;
				renderFace.vertices[1]=rvIndex+1;
				renderFace.vertices[2]=rvIndex+2;

				//頂点
				var vertex=vertices[j];
				var nx=face.normal[0]*(1-smoothing);
				var ny=face.normal[1]*(1-smoothing);
				var nz=face.normal[2]*(1-smoothing);
				var vidx=[0,1+j,2+j];
				for(var k=0;k<3;k++){
					var id = idx[vidx[k]];
					var vertex=vertices[id];
					renderVertices[jj]=vertex.pos[0];
					renderVertices[jj+1]=vertex.pos[1];
					renderVertices[jj+2]=vertex.pos[2];
					renderVertices[jj+3]=normal[0]=vertex.normal[0]*smoothing + nx;
					renderVertices[jj+4]=normal[1]=vertex.normal[1]*smoothing + ny;
					renderVertices[jj+5]=normal[2]=vertex.normal[2]*smoothing + nz;
					renderVertices[jj+6]=svec[0];
					renderVertices[jj+7]=svec[1];
					renderVertices[jj+8]=svec[2];
					renderVertices[jj+9]=tvec[0];
					renderVertices[jj+10]=tvec[1];
					renderVertices[jj+11]=tvec[2];

					if(uv){
						renderVertices[jj+12]=uv[vidx[k]*2]+offsetx;
						renderVertices[jj+13]=uv[vidx[k]*2+1]+offsety;
					}
					renderVertices[jj+14]=renderFace.environmentRatio;
					if(uv2){
						renderVertices[jj+15]=uv2[vidx[k]*2]+offsetx;
						renderVertices[jj+16]=uv2[vidx[k]*2+1]+offsety;
					}
					//calcSH(color,normal,vertex,shcoefs,bufMesh.ratios[id]);
					SH.decode2xyz(color,calcSHcoef,normal[0],normal[1],normal[2]);
					renderVertices[jj+17]=color[0];
					renderVertices[jj+18]=color[1];
					renderVertices[jj+19]=color[2];

					//renderVertices.set(vertex.pos,jj);
					//renderVertices.set(normal,jj+3);
					//renderVertices.set(svec,jj+6);
					//renderVertices.set(tvec,jj+9);
					//renderVertices.set(color,jj+17);
					
					rvIndex++;
					jj+=20;
				}
			}
		}

		if( ono3d.rf  & Ono3d.RF_OUTLINE && 0){
			//アウトライン作成
			var bufFace,normal;
			var bM44 = Mat44.poolAlloc();
			Mat44.getInv(bM44,ono3d.viewMatrix);
			var cp0=bM44[12];
			var cp1=bM44[13];
			var cp2=bM44[14];
			Mat44.poolFree(1);
			for(var i=0;i<bufMesh.faceSize;i++){
				bufFace = faces[i];
				if(1-face.fs){
					normal=bufFace.normal;
					var idx=bufFace.idx;
					if((vertices[idx[0]].pos[0]-cp0)*normal[0]
					 + (vertices[idx[1]].pos[1]-cp1)*normal[1]
					 + (vertices[idx[2]].pos[2]-cp2)*normal[2]<0){
						bufFace.cul=1; //表
					}else{
						bufFace.cul=-1; //裏
					}	
				}else{
					bufFace.cul=0; //アウトライン非対象
				}

			}

			//アウトライン用マテリアル作成
			var renderMaterial = ono3d.materials[ono3d.materials_index];
			ono3d.materials_index++;
			var renderMateriala = ono3d.materials[ono3d.materials_index];
			ono3d.materials_index++;

			Vec3.copy(renderMaterial.baseColor, ono3d.lineColor);
			renderMaterial.opacity = 1.0;//ono3d.lineColor[3];
			renderMaterial.shader="lineshader";
			renderMaterial.bold = ono3d.lineWidth;
			Vec3.copy(renderMateriala.baseColor, ono3d.lineColor);
			renderMateriala.opacity = ono3d.lineColor[3]*0.99;
			renderMateriala.shader="lineshader";
			renderMateriala.bold = ono3d.lineWidth;

			var edges=bufMesh.edges;
			var lines_index=ono3d.lines_index;
			var renderLines=ono3d.lines;
			var vertex_current = ono3d.vertices_index;
			for(i=0;i<bufMesh.edgeSize;i++){
				//エッジをアウトラインとして描画するかどうかの判定
				var edge=edges[i];
				var renderMat = renderMaterial;

				if(edge.fIndices[0]<0)continue; //エッジが属する面が存在しない場合はスキップ
				if(edge.fIndices[1]<0){ //属面が1こだけの場合、その面が表でないならスキップ
					var mat0 = ono3d.materials[materialTable[faces[edge.fIndices[0]].mat+1]]
					if(faces[edge.fIndices[0]].cul<1)continue;
					if(mat0.opacity !== 1.0){
						renderMat = renderMateriala;
					}

				}else{ //属面が2つある場合、裏表の境界になる場合以外はスキップ
					if(faces[edge.fIndices[0]].cul
						* faces[edge.fIndices[1]].cul > -1)continue;
					var mat0 = ono3d.materials[materialTable[faces[edge.fIndices[0]].mat+1]]
					var mat1 = ono3d.materials[materialTable[faces[edge.fIndices[1]].mat+1]]
					if(mat0.opacity !== 1.0
					|| mat1.opacity !== 1.0){
						renderMat = renderMateriala;
					}
				}

				//線描画追加
				var renderLine =renderLines[lines_index];
				renderLine.material=renderMat;
				lines_index++;
				Vec3.copy(renderLine.pos[0],vertices[edge.vIndices[0]].pos);
				Vec3.copy(renderLine.pos[1],vertices[edge.vIndices[1]].pos);
			}
			ono3d.lines_index=lines_index;
			
		}


		ono3d.vertices_index=rvIndex;
		ono3d.faces_index+=rfCount;
		
		Vec3.poolFree(4);
		return;
	
	}

	createLightProbe(){
		this.freezeMesh(bufMesh);
		var vertexSize =bufMesh.vertexSize;

		var points=[];
		var p;
		for(var i=0;i<vertexSize;i++){
			p=new Vec3();
			Vec3.copy(p,bufMesh.vertices[i].pos);
			points.push(p);
		}

		return Engine.createLightProbe(points,this.object.data.shcoefs);
	}

}



var setMaterial=function(material,name){
	var renderMaterial;
	var material;
	var renderMaterials=ono3d.materials;
	var i=0;
	for(;i<ono3d.materials_index;i++){
		if(renderMaterials[i].name === name){
			return i;
		}
	}
	renderMaterial = renderMaterials[i];
	ono3d.materials_index++;

	renderMaterial.offsetx=0;
	renderMaterial.offsety=0;
	renderMaterial.name =name;
	Vec3.copy(renderMaterial.baseColor,material.baseColor);
	renderMaterial.opacity = material.opacity;
	renderMaterial.metallic= material.metallic;
	renderMaterial.specular= material.specular;
	renderMaterial.roughness= material.roughness;
	renderMaterial.ior = material.ior;
	renderMaterial.subRoughness = material.subRoughness;
	renderMaterial.emt = material.emt;
	

	renderMaterial.baseColorMap= material.baseColorMap; 
	renderMaterial.hightMap =material.hightMap;
	renderMaterial.hightMapPower =material.hightMapPower;
	renderMaterial.hightBase=material.hightBase;
	renderMaterial.pbrMap = material.pbrMap;
	renderMaterial.lightMap = material.lightMap;

	renderMaterial.shader = material.shader;

	return i;
}


var copyMesh= function(dst,src){
	dst.name=src.name;

	//頂点情報をコピー
	//var d=src.vertexSize - dst.vertices.length;
	//for(var i = 0;i<d;i++){
	//	//変数領域が足りない場合は追加
	//	dst.vertices.push(new Vertex());
	//}
	//for(var i = 0;i<src.vertexSize;i++){
	//	dst.vertices[i].pos.set(src.vertices[i].pos);
	//	for(var j=0;j<3;j++){
	//		dst.vertices[i].groups[j]= src.vertices[i].groups[j];
	//		dst.vertices[i].groupWeights[j]= src.vertices[i].groupWeights[j];
	//	}
	//}
	dst.vertices.buf.set(src.vertices.buf);
//		var aaa=new Int8Array(src.vertices[0].pos.buffer);
//		var bbb=new Int8Array(dst.vertices[0].pos.buffer);
//		bbb.set(aaa);
	dst.vertexSize=src.vertexSize;

	//辺情報をコピー
	//var d=src.edgeSize - dst.edges.length;
	//for(var i = 0;i<d;i++){
	//	//変数領域が足りない場合は追加
	//	dst.edges.push(new Edge());
	//}
	//for(var i = 0;i<src.edgeSize;i++){
	//	var srcEdge=src.edges[i];
	//	var dstEdge=dst.edges[i];
	//	dstEdge.vIndices[0]=srcEdge.vIndices[0];
	//	dstEdge.vIndices[1]=srcEdge.vIndices[1];
	//	dstEdge.fIndices[0]=srcEdge.fIndices[0];
	//	dstEdge.fIndices[1]=srcEdge.fIndices[1];
	//}
	dst.edges.buf.set(src.edges.buf);
	//aaa=new Int8Array(src.edges[0].vIndices.buffer);
	//bbb=new Int8Array(dst.edges[0].vIndices.buffer);
	//bbb.set(aaa);
	dst.edgeSize=src.edgeSize;

	//面情報をコピー
	//d=src.faceSize - dst.faces.length;
	//for(var i = 0;i<d;i++){
	//	//変数領域が足りない場合は追加
	//	dst.faces.push(new Face());
	//}
	for(var i = 0;i<src.faceSize;i++){
		var dstFace=dst.faces[i];
		var srcFace =src.faces[i];

		dstFace.material = srcFace.material;
		dstFace.mat= srcFace.mat;
		dstFace.idxnum=srcFace.idxnum;
		dstFace.fs = srcFace.fs;

//		for(var j=0;j<srcFace.idxnum;j++){
//			dstFace.idx[j]= srcFace.idx[j];
//		}
	}
	if(src.faces.length>0){
		dst.faces.buf.set(src.faces.buf);
	}
	//aaa=new Int8Array(src.faces[0].idx.buffer);
	//bbb=new Int8Array(dst.faces[0].idx.buffer);
	//bbb.set(aaa);

	dst.faceSize=src.faceSize;

	//uvをコピー
	var d=src.uv_layersSize - dst.uv_layers.length;
	for(var i = 0;i<d;i++){
		//変数領域が足りない場合は追加
		dst.uv_layers.push(new UvLayer());
	}
	for(var i = 0;i<src.uv_layerSize;i++){
		var srcdata=src.uv_layers[i].data;
		if(dst.uv_layers.length<=i){
			dst.uv_layers.push(new UvLayer());
		}
		var dstdata=dst.uv_layers[i].data;
		d = src.faceSize - dstdata.length;
		for(var j=0;j<d;j++){
			dstdata.push([]);
		}

		for(var j = 0;j<src.faceSize;j++){
			dstdata[j][0] = srcdata[j][0];
			dstdata[j][1] = srcdata[j][1];
			dstdata[j][2] = srcdata[j][2];
			dstdata[j][3] = srcdata[j][3];
			dstdata[j][4] = srcdata[j][4];
			dstdata[j][5] = srcdata[j][5];
			dstdata[j][6] = srcdata[j][6];
			dstdata[j][7] = srcdata[j][7];
		}
	}
	dst.uv_layerSize=src.uv_layerSize;
	
}

var calcSHcoef=[];
for(var i=0;i<9;i++){
	calcSHcoef.push(new Vec3());
}
var calcSH=function(color,normal,vertex,shcoefs,ratio){
	var hitTriangle = vertex.hitTriangle;
	if(!hitTriangle){
		Vec3.set(color,0.5,0.5,0.5);
		return;
	}
	if(shcoefs.length===0){
		Vec3.set(color,0.5,0.5,0.5);
		return;
	}

	var pIdx=hitTriangle.pIdx;
	for(var i=0;i<calcSHcoef.length;i++){
		Vec3.set(calcSHcoef[i],0,0,0);
	}
	for(var k=0;k<4;k++){
		var shcoef=shcoefs[pIdx[k]];
		var r=ratio[k];
		for(var i=0;i<calcSHcoef.length;i++){
			Vec3.madd(calcSHcoef[i],calcSHcoef[i],shcoef[i],r);
		}
	}

}
