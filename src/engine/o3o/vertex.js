
import TypedClass from "./typedclass.js"
export default class Vertex extends TypedClass{
	constructor(buffer,offset){
		super();
		if(!buffer){
			buffer=new ArrayBuffer(Vertex.size);
			offset=0;
		}
		//頂点
		//12+12+3+12=39バイト
		this.pos = new Float32Array(buffer,offset,3);//new Vec3(); //座標
		this.normal = new Float32Array(buffer,offset+12,3);//new Vec3(); //法線
		this.groupWeights = new Float32Array(buffer,offset+24,3);//[1,0,0]; //グループウェイト
		this.groupWeights.set([1,0,0]);
		this.groups =new Int8Array(buffer,offset+36,3);//[-1,-1,-1]; //グループ
		this.groups.set([-1,-1,-1]);
	};
}
Vertex.size=40;
