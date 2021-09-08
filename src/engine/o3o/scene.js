
import O3o from "./o3o.js"
import ObjectType from "./objecttype.js"
export default class Scene{
	constructor(){
		//シーン
		this.name=""; //名前
		this.frame_start=0; //開始フレーム
		this.frame_end=0;//終了フレーム
		this.objects= []; //シーンに存在するオブジェクト
		this.world = {};
	}

	setFrame(frame){
		var objects = this.objects;
		var o3o = this.o3o;
		if(o3o){
			for(var i=o3o.materials.length;i--;){
				////マテリアルのUVアニメーション
				//var material=o3o.materials[i];
				//for(var j=material.texture_slots.length;j--;){
				//	var texture_slot = material.texture_slots[j];
				//	if(texture_slot.action){
				//		addaction(texture_slot,"0",texture_slot.action,frame);
				//	}
				//}
			}
		}

		for(var i=0;i<objects.length;i++){
			objects[i].flg=false;
		}

		for(var i=0;i<objects.length;i++){
			//オブジェクト(アーマチュア及びメッシュ)のアニメーション
			if(objects[i].action){
				//対象オブジェクトに関連するアクションを計算
				O3o.addaction(objects[i],"",objects[i].action,frame)
			}
			//objects[i].calcMatrix(frame);

			if(objects[i].objecttype===ObjectType.ARMATURE && objects[i].action){
				//もしアーマチュアの場合は、ボーンの計算を行う
				objects[i].pose.setAction(objects[i].action,frame);
			}
		}

	}
}
