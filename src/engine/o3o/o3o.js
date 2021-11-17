"use strict"

import Ono3d from "../../lib/ono3d.js"
import Engine from "../engine.js"
import OnoPhy from "../../lib/onophy/onophy.js"
import Geono from "../../lib/geono.js"
import Collider from "../../lib/collider/collider.js"
import AssetManager from "../assetmanager.js"
import Rastgl from "../../lib/rastgl.js"
import Util from "../../lib/util.js"
import SH from "../../lib/spherical_harmonics/sh.js";

import Material from "./material.js"
import Armature from "./armature.js"
import UvLayer from "./uvlayer.js"
import Bone from "./bone.js"
import Envirnoment from "./environment.js"
import Light from "./light.js"
import Mesh from "./mesh.js"
import Pose from "./pose.js"
import PoseBone from "./posebone.js"
import ObjectType from "./objecttype.js"
import RigidBody from "./rigidbody.js"
import Scene from "./scene.js"
import RigidBodyConstraint from "./rigidbodyconstraint.js"
import SceneObject from "./sceneobject.js"
import Action from "./action.js"
import Fcurve from "./fcurve.js"
import RotationMode from "./rotationmode.js"
import InterpolationMode from "./interpolationmode.js"
import FcurveMode from "./fcurvemode.js"
import RepeatMode from "./repeatmode.js"
import ReflectionProbe from "./reflectionprobe.js"
import TypedClass from "./typedclass.js"
import Vertex from "./vertex.js"
import Face from "./face.js"
import Edge from "./edge.js"
import O3oInstance from "./o3oinstance.js"
import SceneObjectInstance from "./sceneobjectinstance.js"
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
import bufMesh from "./bufmesh.js"

	var ono3d = null;
	var basecolorShader;

	var loadTexture=function(path,func){
		//return engine.loadEnvTexture(path);
		//return AssetManager.texture(path,func);
		return AssetManager.texture(path,(image)=>{
			var gl = Rastgl.gl;
			gl.disable(gl.BLEND);
			gl.disable(gl.DEPTH_TEST);


			gl.bindFramebuffer(gl.FRAMEBUFFER, Rastgl.frameBuffer);
			gl.viewport(0,0,image.width,image.height);
			Ono3d.postEffect(image,0,0 ,1,1,Engine.basecolorShader); 
			gl.bindTexture(gl.TEXTURE_2D, image.glTexture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			Ono3d.copyImage(image,0,0,0,0,image.width,image.height);

			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			
		});
	}



	//fカーブのモードを数値コードに変換するテーブル
	var fcurveConvert = {};
	fcurveConvert["rotation_quaternion"]=FcurveMode.ROT_QUAT;
	fcurveConvert["rotation_euler"]=FcurveMode.ROT_EULER;
	fcurveConvert["location"]=FcurveMode.LOCATION;
	fcurveConvert["scale"]=FcurveMode.SCALE;
	fcurveConvert["offset"]=FcurveMode.OFFSET;
	fcurveConvert["value"]=FcurveMode.SHAPEKEY;

export default class O3o{

	constructor(){
		//モデルデータ
		this.scenes =[] ; //シーン情報
		this.collections=[];
		this.objects = []; //オブジェクト情報
		this.objects_name_hash= []; 
		this.materials = []; //マテリアル
		this.meshes = []; //メッシュ
		this.meshes_name_hash = []; //メッシュ(名前ハッシュ)
		this.armatures = [];//スケルトン
		this.actions = []; //アニメーション
		this.lights = []; //照明

		this.environments=[];
		this.reflectionProbes= []; //反射プローブ

	}

	getCollectionObjectList(collection_name){
		var objects=[];
		var collection = this.collections[collection_name];
		if(!collection)return objects;


		collection.children.forEach((value)=>{
			//入れ子の場合
			var children = this.getCollectionObjectList(value);
			objects= objects.concat(children);
		});

		collection.objects.forEach((e)=>{
			
			objects.push(this.objects_name_hash[e]);
		});
		//objects = objects.concat(collection.objects);
		return objects;

	}



	createInstance(){ 
		return new O3oInstance(this);
	}
	
};

O3o.setOno3d = function(a){
	ono3d=a;
	window.ono3d = a;
}
	var onloadfunc= function(o3o,url,buf){
		var i,imax,j,jmax
		//if(buf.substring(0,11) ==="Metasequoia"){
		//}else if(buf.substring(0,16) ==='{"format":"Ono3d'){
			loadO3o(o3o,url,buf)
		//}else{
		//	return
		//}

		var res =  /.*\//.exec(url)
		var currentdir=""
		var texture
		if(res) currentdir = res[0]
		o3o.name=url
		res= /[^\/]*$/.exec(url)
		if(res)o3o.name=res[0]


		var loadMap = function(_path,flg){
			if(_path ==="")return null;

			var res =/[^\\\/]*$/.exec(_path)
			var path = currentdir + res[0];
			var func= function(image){
				var gl = Rastgl.gl;
				gl.bindTexture(gl.TEXTURE_2D, image.glTexture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
				//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			};

			if(flg){
				return AssetManager.bumpTexture(path,func);
			}else{
				return loadTexture(path,func);

			}
		}

		o3o.objects.forEach((e)=>{
			o3o.objects_name_hash[e.name] = e;
		});
		o3o.meshes.forEach((e)=>{
			o3o.meshes_name_hash[e.name] = e;
		});

		for(i=o3o.scenes.length;i--;){
			var scene = o3o.scenes[i]
			for(j=scene.objects.length;j--;){
				scene.objects[j] = o3o.objects.find(function(a){return a.name === this;},scene.objects[j]);
			}

			if(scene.world.envTexture){
				var res =/[^\\\/]*$/.exec(scene.world.envTexture)
				var path = currentdir + res[0];
				scene.world.envTexture = Engine.loadEnvTexture(path);
			}
		}

		//loadtexture
		for(i=o3o.materials.length;i--;){
			var material= o3o.materials[i];
			material.baseColorMap = loadMap(material.baseColorMap,0);
			material.pbrMap = loadMap(material.pbrMap,0);
			material.hightMap = loadMap(material.hightMap,1);
			material.lightMap = loadMap(material.lightMap,0);

			if(material.shader !== ""){
				if(ono3d.shaders[material.shader]){
					continue;
				}
				var currentpath = Util.getCurrent();
				var filename = material.shader;
				ono3d.shaders[filename]=Ono3d.loadShader(currentdir +filename + ".shader");
			}
		}
		

		//edge
		var addEdge=function(edges,v0,v1,f){
			var i,imax
			for(i=0,imax=edges.length;i<imax;i++){
				if((edges[i].vIndices[0]===v0 && edges[i].vIndices[1]===v1)
				|| (edges[i].vIndices[0]===v1 && edges[i].vIndices[1]===v0)){
					if(edges[i].fIndices[0]<0){
						edges[i].fIndices[0]=f
					}else{
						edges[i].fIndices[1]=f
					}
					return 0
				}
			}
			var edge = new Edge()
			edge.vIndices[0]=v0
			edge.vIndices[1]=v1
			edge.fIndices[0]=f
			edge.fIndices[1]=-1;
			edges.push(edge)
			return 1
		}
		for(i=0;i<o3o.meshes.length;i++){
			var faces=o3o.meshes[i].faces
			var edges;
			if(o3o.meshes[i].edges){
				edges=o3o.meshes[i].edges;
			}else{
				edges=[];
				o3o.meshes[i].edges=edges;
			}
			for(j=0,jmax=faces.length;j<jmax;j++){
				var face=faces[j];
				if(face.idx[3]>=0){
					face.idxnum=4;
				}else{
					face.idxnum=3;
				}

				for(var k=0;k<face.idxnum-1;k++){
					addEdge(edges,face.idx[k],face.idx[k+1],j)
				}
				addEdge(edges,face.idx[face.idxnum-1],face.idx[0],j)
			}
			o3o.meshes[i].edgeSize=edges.length;
			var edges2=Edge.array(o3o.meshes[i].edgeSize);
			for(j=0;j<edges.length;j++){
				var t=edges2[j].vIndices;
				new Int8Array(t.buffer,t.byteOffset).set(new Int8Array(edges[j].vIndices.buffer));
			}
			o3o.meshes[i].edges=edges2;
		}

		var bind=function(object,modifier){
			var mod= new Mesh();
			freezeMesh(mod,modifier.object);
			freezeMesh(bufMesh,object);
			var binddata=[];
			var O3o1 = Vec3.poolAlloc();
			var O3o2 = Vec3.poolAlloc();
			var BINDSIZE=2;
			for(var i=0;i<bufMesh.vertexSize;i++){
				var pos = bufMesh.vertices[i].pos;
				var binds=[];

				for(var j=0;j<mod.faceSize;j++){
					//近い面を探す
					var l= 99999999;
					for(var k=0;k<mod.faces[j].idxnum-2;k++){
						Geono.TRIANGLE_POINT(O3o1,mod.vertices[mod.faces[j].idx[0]].pos
							,mod.vertices[mod.faces[j].idx[1+k]].pos
							,mod.vertices[mod.faces[j].idx[2+k]].pos
							,pos);
						l = Math.min(l,Vec3.len2(O3o1,pos));
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
					Vec3.cross2(O3o1,mod.vertices[face.idx[0]].pos
						,mod.vertices[face.idx[1]].pos
						,mod.vertices[face.idx[2]].pos);
					Vec3.norm(O3o1);
					Vec3.sub(O3o2,pos,mod.vertices[face.idx[0]].pos);
					bind.len = Vec3.dot(O3o1,O3o2); //法線距離

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

	}
	O3o.load=function(url,callback){
		var o3o=new O3o();
		Util.loadText(url,function(buf){
			if(!buf){
				//失敗時
				if(callback){
					callback(null);
				}
			}else{
				onloadfunc(o3o,url,buf)
				if(callback){
					callback(o3o);
				}
			}
		});
		
		return o3o;
	}


	var classes ={};
	//classes["materials"]=Material;
	//classes["meshes"]=Mesh;
	//classes["vertices"]=Vertex;
	//classes["faces"]=Face;
	classes["armatures"]=Armature;
	classes["actions"]=Action;
	classes["objects"]=SceneObject;
	classes["scenes"]=Scene;
	classes["lights"]=Light;
	classes["reflectionprobes"]=ReflectionProbe;
	classes["bones"]=Bone;
	classes["uv_layers"]=UvLayer;
	classes["fcurves"]=Fcurve;
	var setdata2 = function(dst,src){
		for(var member in src){
			var srcdata=src[member];
			var dstdata=dst[member];
			if(srcdata == null)continue;
			var to= typeof srcdata;
			if(to == "string" || to == "number"){
				dst[member]=srcdata;
			}else if(dstdata instanceof Int8Array || dstdata instanceof Int16Array){
				for(var i=0;i<srcdata.length;i++){
					dstdata[i]=srcdata[i]|0;
				}
			}else if(dstdata instanceof Float32Array){
				for(var i=0;i<srcdata.length;i++){
					dstdata[i]=srcdata[i];
				}
			}else if(dstdata instanceof Array && srcdata.length > 0){
					
				if(typeof srcdata[0] == "string" || typeof srcdata[0] == "number"){
						dst[member] = srcdata;
				}else if(classes[member]){
					for(var i=0;i<srcdata.length;i++){
						var obj = new (classes[member]);
						setdata2(obj,srcdata[i]);
						dstdata.push(obj);
					}
				}else if(dstdata.length>0){
					for(var i=0;i<srcdata.length;i++){
						setdata2(dstdata[i],srcdata[i]);
					}
				}else{
					dst[member] = srcdata;
				}
			}else{
				dst[member] = srcdata;
			}
			
		}
	}

	var loadO3o = function(o3o,url,buf){
		var res =  /.*\//.exec(url)
		var currentdir="./"
		if(res) currentdir = res[0]

		var raw=JSON.parse(buf);

		var size=raw.materials.length;
		for(var i=0;i<size;i++){
			o3o.materials.push(new Material);
		}
		size=raw.meshes.length;
		for(var i=0;i<size;i++){
			var rawdata=raw.meshes[i];
			var mesh= new Mesh();
			o3o.meshes.push(mesh);

			mesh.vertices=Vertex.array(rawdata.vertices.length);
			mesh.faces=Face.array(rawdata.faces.length);
		}

		setdata2(o3o,raw);

		for(var type in o3o){
			if(type==="collections")continue;
			//1層目のオブジェクトには親のリンク作っとく
			var arrays=o3o[type];
			if(arrays instanceof Array){
				for(var i=0;i<arrays.length;i++){
					arrays[i].o3o=o3o;
				}
			}
		}


		//オブジェクトを連想配列

		for(j=o3o.objects.length;j--;){
			//o3o.objects[o3o.objects[j].name]=o3o.objects[j] ;
		}

		//アクションを連想配列
		for(j=o3o.actions.length;j--;){
			o3o.actions[o3o.actions[j].name]=o3o.actions[j] ;
		}

		//コレクションを設定
		for(var key in o3o.collections){
			var obj = o3o.collections[key];
			for(var i=0;i<obj.children.length;i++){
				obj.children[i]= o3o.collections[obj.children[i]];
			}
			//for(var i=0;i<obj.objects.length;i++){
			//	obj.objects[i]= o3o.objects[obj.objects[i]];
			//}
			
		};

		//オブジェクトのdataをアドレスに変換
		var typedatas={
			"MESH":{objecttype:ObjectType.MESH,target:"meshes"}
			,"ARMATURE":{objecttype:ObjectType.ARMATURE,target:"armatures"}
			,"LIGHT":{objecttype:ObjectType.LIGHT,target:"lights"}
			,"LIGHT_PROBE":{objecttype:ObjectType.REFLECTIONPROBE,target:"reflectionProbes"}
		};
		var scene,name,object,objects
		for(j=o3o.objects.length;j--;){
			object=o3o.objects[j]
			var typedata = typedatas[object.type];
			if(typedata){
				object.objecttype=typedata.objecttype;
				object.data=o3o[typedata.target].find(function(a){return a.name === this;},object.data)
			}else{
				object.objecttype="";
				object.data=null;
			}

			object.parent=o3o.objects.find(function(a){return a.name === this;},object.parent)

			for(k=0;k<object.modifiers.length;k++){
				object.modifiers[k].object=o3o.objects.find(function(a){return a.name === this;},object.modifiers[k].object)
				var  name=object.modifiers[k].vertex_group;
				object.modifiers[k].vertex_group=-1;
				for(var l=0;l<object.groups.length;l++){
					if(object.groups[l]===name){
						object.modifiers[k].vertex_group=l;
						break;
					}
				}
			}
			object.action=o3o.actions.find(function(a){return a.name === this;},object.action)

			if(object.rigid_body_constraint){
				object.rigid_body_constraint.object1
					= o3o.objects.find(function(a){return a.name === this;},object.rigid_body_constraint.object1);
				object.rigid_body_constraint.object2
					= o3o.objects.find(function(a){return a.name === this;},object.rigid_body_constraint.object2);

			}
		}

		for(var i=0;i< o3o.meshes.length;i++){
			var mesh=o3o.meshes[i];

			for(var j=0;j< mesh.vertices.length;j++){
				//ウェイト自動設定
				var vertex=mesh.vertices[j];
				if(vertex.groupWeights.length==0){
					for(var i=0;i<vertex.groups.length;i++){
						vertex.groupWeights.push(1.0/vertex.groups.length);
					}
				}
			}
			mesh.vertexSize=mesh.vertices.length;


			for(var j=0;j< mesh.faces.length;j++){
				//三角ポリか四角ポリか
				var face = mesh.faces[j];
				for(var k=0;k<4;k++){
					if(face.idx[k]<0)break
				}
				face.idxnum=k
			}
			mesh.faceSize=mesh.faces.length;

			mesh.uv_layerSize=mesh.uv_layers.length;

			if(mesh.double_sided){
				mesh.flg&=~Ono3d.RF_DOUBLE_SIDED;
				mesh.flg|=Ono3d.RF_DOUBLE_SIDED;
				delete mesh.double_sided;
			}
		}
	
		for(var i=0;i< o3o.actions.length;i++){
			var action = o3o.actions[i];
			for(var j=0;j< action.fcurves.length;j++){
				//フレームとパラメータ値を分ける
				var fcurve=action.fcurves[j];
				var keys = fcurve.keys;
				delete fcurve.keys;
				fcurve.keys=[];
				fcurve.params=[];
				for(var k=0;k< keys.length;k++){
					fcurve.keys.push(keys[k].f);
					fcurve.params.push(keys[k].p);
				}
				fcurve.type = fcurveConvert[fcurve.type]; //文字列をコードに変換
			}
		}
	


		for(j=o3o.objects.length;j--;){
			var object=o3o.objects[j];
			if(object.type==="ARMATURE"){
				object.pose = new Pose(object.data);
				object.pose.object=object;

				if(object.poseBones){
					for(var k=0;k<object.poseBones.length;k++){
						var poseBone = object.poseBones[k];
						if(poseBone.constraints){
							for(var l=0;l<poseBone.constraints.length;l++){
								var constraint = poseBone.constraints[l]
								constraint.target=o3o.objects.find(function(a){return a.name === this;},constraint.target)
							}
						}else{
							poseBone.constraints=[];
						}

					}
				}
			}

		}
		var count=0
		for(var i=o3o.meshes.length;i--;){
			mesh = o3o.meshes[i]
			//マテリアルのポインタ設定
			for(j=mesh.faces.length;j--;){
				var face =mesh.faces[j]
				face.material = o3o.materials[face.mat]
			}
			
		}
	
		//骨の名称をアドレスに変更
		for(var i=o3o.armatures.length;i--;){
			var armature=o3o.armatures[i]
			for(j=armature.bones.length;j--;){
				var bone = armature.bones[j]
				Mat43.getInv(bone.imatrix,bone.matrix)
				var a=new Mat43();
				Mat43.dot(a,bone.matrix,bone.imatrix);
				for(k=armature.bones.length;k--;){
					if(bone.parent === armature.bones[k].name){
						bone.parent = armature.bones[k] 
						break
					}
				}
				bone.id=j;
			}
		}
		
		for(var j=o3o.objects.length;j--;){
			object=o3o.objects[j]
			if(object.parent){
				if(object.parent_bone){
					for(var i=0;i<object.parent.data.bones.length;i++){
						if(object.parent_bone == object.parent.data.bones[i].name){
							object.parent_bone = i+1;
						}
					}
				}
			}
		}


		return o3o
	}
	
	var addaction = O3o.addaction= function(obj,name,action,frame){
		var a,b,c
			,tim,ratio
			,fcurve
			,keys
			,mat43
			,paramA,paramB
			,quat = Vec4.poolAlloc();
		;

		frame=frame%action.endframe;

		for(var i=0,imax=action.fcurves.length;i<imax;i++){
			if(action.fcurves[i].target !== name)continue;
			fcurve=action.fcurves[i]
			keys=fcurve.keys;
			tim=frame

			a=0;b=fcurve.keys.length-1
			switch(fcurve.repeatmode){
			case RepeatMode.NONE:
				if(tim<keys[a])tim=keys[a]
				if(tim>keys[b])tim=keys[b]
				break
			case RepeatMode.LOOP:
				if(tim<keys[a])tim=keys[b]-(keys[a]-tim)%(keys[b]-keys[a])
				if(tim>keys[b])tim=keys[a]+(tim-keys[b])%(keys[b]-keys[a])
				break
			case RepeatMode.LINER:
				break
			}
			while (a < b) {
				c = (a + b) >>1;
				if (keys[c] <= tim){
					a = c + 1;
				}else{
					b = c;
				}
			}
			if(tim === keys[a]){
				ratio=0;
				paramA=fcurve.params[a]
				paramB=paramA;//fcurve.params[a]
			}else{
				if(a>0)a--
				ratio=(tim-keys[a])/(keys[a+1]-keys[a])
				ratio=ratio*ratio*(3-2*ratio);
				paramA=fcurve.params[a]
				paramB=fcurve.params[a+1]
			}
			if(fcurve.type==FcurveMode.ROT_QUAT){
				Vec4.slerp(obj.rotation,paramA,paramB,ratio)
			}else{
				var target;
				switch(fcurve.type){
				case FcurveMode.ROT_EULER:
					target=obj.rotation;
					break;
				case FcurveMode.SCALE:
					target=obj.scale;
					break;
				case FcurveMode.LOCATION:
					target=obj.location;
					break;
				case FcurveMode.OFFSET:
					target=obj.offset;
					break;
				}
				target[fcurve.idx]= (paramB-paramA)*ratio + paramA
			}
		}

		Vec4.poolFree(1);
	}


	var copyFace = function(dst,src){
		dst.vertices[0]=src.vertices[0];
		dst.vertices[1]=src.vertices[1];
		dst.vertices[2]=src.vertices[2];
		dst.environments[0]=src.environments[0];
		dst.environments[1]=src.environments[1];
		dst.environmentRatio=src.environmentRatio;
		dst.material=src.material;
	}
	O3o.drawStaticFaces = function(faces){
		var idx= ono3d.faces_index;

		var renderFaces=ono3d.faces;
		for(var i=0;i<faces.length;i++){
			copyFace(renderFaces[idx+i],faces[i]);
		}
		ono3d.faces_index+=faces.length;
		return ;
	}


	O3o.createCollision = function(obj){
		var collision=null;
		var shape = obj.bound_type;
		if(obj.rigid_body.type){
			shape = obj.rigid_body.collision_shape;
		}
		if(shape == "SPHERE"){
			collision = new Collider.Sphere();
		}else if(shape=="BOX"){
			collision = new Collider.Cuboid();
		}else if(shape=="CYLINDER"){
			collision = new Collider.Cylinder();
		}else if(shape=="CONE"){
			collision = new Collider.Cone();
		}else if(shape=="CAPSULE"){
			collision = new Collider.Capsule();
		}else if(shape=="CONVEX_HULL"){
			var mesh = obj.data;
			collision = new Collider.ConvexHull();
			for(var i=0;i<mesh.vertices.length;i++){
				collision.poses.push(new Vec3());
			}
		}else if(shape=="MESH"){
			var mesh = obj.data;
			collision = new Collider.Mesh();
			for(var i=0;i<mesh.vertices.length;i++){
				collision.poses.push(new Vec3());
			}
			for(var i=0;i<mesh.faces.length;i++){
				var triangle = new Collider.Triangle();
				triangle.poses[0] = collision.poses[mesh.faces[i].idx[0]];
				triangle.poses[1] = collision.poses[mesh.faces[i].idx[1]];
				triangle.poses[2] = collision.poses[mesh.faces[i].idx[2]];
				collision.triangles.push(triangle);
			}
		}
		if(collision){
			collision.name = obj.name;
			collision.groups = obj.rigid_body.collision_groups;
		}
		return collision;

	}
	O3o.createPhyObj = function(obj,instance){
		var mesh,obj
		,phyobj= null
		,vertices
		var renderVertices =bufMesh.vertices;
		var renderVertex;
		var renderFaces =bufMesh.faces;
		var renderFace;
		var idx;
		

		var mod;
		if(obj.rigid_body.type){
			var rigid=obj.rigid_body;
			var shape = rigid.collision_shape;
			phyobj = new OnoPhy.RigidBody();
			//phyobj=onoPhy.createRigidBody();

			var collision = O3o.createCollision(obj);
			phyobj.collision=collision;
			if(collision){
				//onoPhy.collider.addCollision(collision);
				if(collision.type ===Collider.MESH || collision.type ===Collider.CONVEX_HULL){
					phyobj.mesh = obj.data;
				}
				collision.parent=phyobj;
				var b = obj.bound_box;
				phyobj.collisionSize[0]=(b[3] - b[0])*0.5;
				phyobj.collisionSize[1]=(b[4] - b[1])*0.5;
				phyobj.collisionSize[2]=(b[5] - b[2])*0.5;
			}

			if(rigid.type ==="ACTIVE"){
				phyobj.fix=false;
			}
			phyobj.friction=rigid.friction;
			phyobj.restitution=rigid.restitution;
			phyobj.mass = rigid.mass;
			phyobj.name=obj.name;
			Mat43.toLSR(phyobj.location,phyobj.scale,phyobj.rotq,instance.o3oInstance.objectInstances[obj.idx].matrix);

		}
		for(var i=0;i<obj.modifiers.length;i++){
			mod = obj.modifiers[i];
			if(mod.type==="CLOTH" || mod.type==="SOFT_BODY"){
				mesh = obj.data;
				instance.freezeMesh(bufMesh);

				if(mod.type==="CLOTH"){
					phyobj = new OnoPhy.Cloth(bufMesh.vertexSize
						,bufMesh.edgeSize
						,bufMesh.faceSize);
					phyobj.air_damping=mod.air_damping;
					phyobj.mass=mod.mass;
					phyobj.speed=1.0;
					phyobj.structual_stiffness= mod.structual_stiffness;//構造
					phyobj.bending_stiffness = mod.bending_stiffness; //まげ
					phyobj.spring_damping = mod.spring_damping;//ばね抵抗
					phyobj.air_damping = mod.air_damping;//空気抵抗
					phyobj.vel_damping = mod.vel_damping;//速度抵抗
				}else{
					phyobj = new OnoPhy.SoftBody(bufMesh.vertexSize
						,bufMesh.edgeSize
						,bufMesh.faceSize);

					phyobj.friction=mod.friction;//摩擦
					phyobj.mass=mod.mass; //質量
					phyobj.speed=1.0; //スピード
					phyobj.pull= mod.pull;//ばね定数引き
					phyobj.push= mod.push; //ばね定数押し
					phyobj.damping= mod.damping;//ダンパ
					phyobj.bending_stiffness = mod.bend;//構造
				}	

				//onoPhy.clothes.push(phyobj);


				//点
				vertices = bufMesh.vertices;
				for(j=0;j<bufMesh.vertexSize;j++){
					Vec3.copy(phyobj.points[j].location,vertices[j].pos);
					phyobj.points[j].id=j;
					for(var k=0;k<vertices[j].groups.length;k++){
						if(vertices[j].groups[k]<0)break;
						if(obj.groups[vertices[j].groups[k]]=== mod.pin){
							phyobj.points[j].fix=true;
							break;
						}
					}
				}
				//面
				for(j=0;j<bufMesh.faceSize;j++){
					var face=renderFaces[j];
					phyobj.faces[j].idxnum=face.idxnum;
					if(face.idxnum>= 3){
						for(var k=0;k<face.idxnum;k++){
							phyobj.faces[j].points[k] = phyobj.points[face.idx[k]];
						}
					}
				}

				//エッジ
				for(var j =0;j<bufMesh.edgeSize;j++){
					var edge=bufMesh.edges[j];
					phyobj.edges[j].point1 = phyobj.points[edge.vIndices[0]];
					phyobj.edges[j].point2 = phyobj.points[edge.vIndices[1]];
				}
				for(var j =0;j<phyobj.edges.length;j++){
					phyobj.edges[j].len=Vec3.len(phyobj.edges[j].point1.location
						,phyobj.edges[j].point2.location);
				}

				phyobj.init();
				
			}
		}
		if(phyobj){
			obj.phyObject= phyobj;
			phyobj.name=obj.name;
			phyobj.parent=obj;
			phyobj.refreshCollision();
			phyobj.refreshInertia();
		}

		return phyobj;
	}



	O3o.setEnvironments=function(scene){
		var m=Mat43.poolAlloc();

		var environment;

		for(var i=0;i<scene.objects.length;i++){
			//ライト設定
			var object = scene.objects[i];
			if(object.type!=="LIGHT")continue;
			environment = ono3d.environments[0];
			
			var ol = object.data;
			var light;
			if(ol.type==="SUN"){
				light = environment.sun;
			}else{
				light = environment.area;
			}
			light.power=1;
			Vec3.copy(light.color,ol.color);

			Mat43.fromLSE(m,object.location,object.scale,object.rotation); //ライトの姿勢行列
			Mat44.dotMat43(light.matrix,ono3d.worldMatrix,m); //ワールド行列で変換
			Mat43.fromRotVector(m,Math.PI*0.5,1,0,0);  //ライトはデフォルト姿勢で下向きなので補正
			Mat44.dotMat43(light.matrix,light.matrix,m);

			ono3d.setOrtho(10.0,10.0,0.1,80.0)
			var mat44 = ono3d.viewMatrix;
			Mat44.getInv(mat44,light.matrix);
			Mat44.dot(light.viewmatrix,ono3d.projectionMatrix,mat44);//影生成用のビュー行列

		}
		Mat43.poolFree(1);
	}






// ------------------------  インスタンス ---------------------

