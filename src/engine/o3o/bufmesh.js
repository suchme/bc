
import Vertex from "./vertex.js"
import Face from "./face.js"
import Edge from "./edge.js"
import Mesh from "./mesh.js"

import {Vec2,Vec3,Vec4,Mat33,Mat43,Mat44} from "../../lib/vector.js"
const MAX_SIZE=4096;
	var bufMesh=new Mesh(); //メッシュバッファ
	bufMesh.ratios=[];
	bufMesh.vertices=Vertex.array(MAX_SIZE);
	bufMesh.faces=Face.array(MAX_SIZE);
	bufMesh.edges=Edge.array(MAX_SIZE);
	for(var i=0;i<MAX_SIZE;i++){
		//bufMesh.faces.push(new Face());
		//bufMesh.edges.push(new Edge());
		bufMesh.ratios.push(new Vec4());

	};

export default bufMesh;
