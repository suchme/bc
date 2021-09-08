
import TypedClass from "./typedclass.js"
export default class Edge extends TypedClass{
	constructor(buffer,offset){
		super();
		//辺
		if(!buffer){
			buffer=new ArrayBuffer(Edge.size);
			offset=0;
		}
		
		this.vIndices=new Int16Array(buffer,offset,2);
		this.fIndices=new Int16Array(buffer,offset+4,2);
		this.fIndices.set([-1,-1]);
//		this.vIndices[0] = -1; //頂点インデックス1
//		this.vIndices[1] = -1;//頂点インデックス2
//		this.fIndices[0] = -1;//面インデックス1
//		this.fIndices[1] = -1;//面インデックス2
	}
}
Edge.size=8;
