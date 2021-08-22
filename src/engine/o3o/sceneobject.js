
import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
import RigidBody from "./rigidbody.js"
import RigidBodyConstraint from "./rigidbodyconstraint.js"
import RotationMode from "./rotationmode.js"
export default class SceneObject{
	constructor(){
		this.name="";//オブジェクト名
		this.type=""; //オブジェクト種類
		this.hide_render=0; //レンダリングするかどうか
		this.data=""; //内容(メッシュとかアーマチュア)
		this.modifiers=[]; //モディファイア

		this.location=new Vec3(); //平行移動
		this.scale=new Vec3(); //スケール
		this.rotation_mode=RotationMode.EULER_XYZ;//角度形式(デフォルトはオイラー角XYZ)
		this.rotation=new Vec4();//回転オイラー角かクォータニオン

		this.bound_box = [];//バウンディングボックス
		this.bound_type= "";//バウンディング形

		this.parent=""; //親オブジェクト
		this.iparentmatrix=new Mat43(); //親とのオフセット行列
		this.parent_bone=null; //親骨オブジェクト
		this.pose = null;

		this.action=""; //関連付けられたアニメーション
		this.groups=[]; //頂点グループ

		this.rigid_body = new RigidBody(); //剛体設定
		this.rigid_body_constraint = new RigidBodyConstraint();//剛体コンストレイント設定

		this.flg=false;//既に合成行列が計算されているかどうかのフラグ

		this.poseBones=null;
		this.static=0;
	}

};
