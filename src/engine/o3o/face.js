
import TypedClass from "./typedclass.js"
export default class Face extends TypedClass{
	constructor(buffer,offset){
		super();
		//面
		if(!buffer){
			buffer=new ArrayBuffer(Face.size);
			offset=0;
		}
		//this.uv = new Array(8); //uv値(そのうち消す)
		this.idx = new Int16Array(buffer,offset,4);//[ -1 , -1 , -1 , -1]; //頂点インデックス
		this.idx.set([-1,-1,-1,-1]);
		this.normal = new Float32Array(buffer,offset+8,3);// new Vec3(); //法線
		this.material = null ; //マテリアル
		this.flg=0;//フラグ
		this.fs=0; //フラグ2
		this.mat=-1;
		this.idxnum=3;//頂点数
	}
};
Face.size=28
