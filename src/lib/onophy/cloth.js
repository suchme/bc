import {Vec2,Vec3,Vec4,Mat33,Mat43} from "../vector.js"
import PhyObj from "./phyobj.js"
import RigidBody from "./rigidbody.js"
import OnoPhy from "./onophy.js"
import Collider from "../collider/collider.js"
import Geono from "../geono.js"
import {AABB} from "../aabb.js";

var MIN = Math.min;
var MAX = Math.max;

var AIR_DAMPER=1;
var DIMENSION=3;
export default class Cloth extends RigidBody{
	//クロスシミュ

	constructor(v,e,f){
		super();
		this.type=OnoPhy.CLOTH;
		this.bold=0.015;
		this.points=[]; //頂点位置
		this.edges= []; //エッジ
		this.bends=[];
		this.faces = []; //面
		this.facesSort =[];

		this.structual_stiffness= 0;//構造
		this.bending_stiffness = 0; //まげ
		this.spring_damping = 5;//ばね抵抗
		this.air_damping = 0;//空気抵抗
		this.vel_damping = 0;//速度抵抗

		this.restitution=0;//反発係数
		this.friction=0.1;
		this.inv_pointMass;


		for(var i=0;i<v;i++){
			this.points.push(new Point());
			this.points[i].cloth=this;
		}
		for(var i=0;i<e;i++){
			this.edges.push(new Edge());
			this.edges[i].cloth=this;
		}
		for(var i=0;i<f;i++){
			this.faces.push(new Face());
			this.faces[i].cloth=this;
			this.facesSort.push(this.faces[i]);
		}
		
		this.aabb= new AABB();
	}

	addBend(point1,point2){
		var bends=this.bends;
		if(point1===point2){
			return 0;
		}
		var i,imax;
		for(i=0,imax=bends.length;i<imax;i++){
			if((bends[i].point1===point1 && bends[i].point2===point2)
			|| (bends[i].point1===point2 && bends[i].point2===point1)){
				return 0;
			}
		}
		for(i=0,imax=this.edges.length;i<imax;i++){
			if((this.edges[i].point1===point1 && this.edges[i].point2===point2)
			|| (this.edges[i].point1===point2 && this.edges[i].point2===point1)){
				return 0;
			}
		}
		var bend= new Edge();
		bends.push(bend);
		bend.cloth=this;
		bend.point1=point1;
		bend.point2=point2;
		return 1;
	}

	init(){
		var edges=this.edges;

		for(var i=0;i<edges.length;i++){
			for(var j=i+1;j<edges.length;j++){
				if(edges[i].point1 === edges[j].point1){
					this.addBend(edges[i].point2,edges[j].point2);
				}else if(this.edges[i].point1 === edges[j].point2){
					this.addBend(edges[i].point2,edges[j].point1);
				}else if(edges[i].point2 === edges[j].point1){
					this.addBend(edges[i].point1,edges[j].point2);
				}else if(this.edges[i].point2 === edges[j].point2){
					this.addBend(edges[i].point1,edges[j].point1);
				}
			}
		}
		for(var i =0;i<this.bends.length;i++){
			this.bends[i].len=Vec3.len(this.bends[i].point1.location
				,this.bends[i].point2.location);
		}
		this.inv_pointMass = 1/(this.mass/this.points.length);
	}

	rayCast(res,p0,p1){
		var faces =this.faces;
		var poses = this.points999;
		var min=9999999;

		for(var i=0;i<faces.length;i++){
			var face = faces[i];

			if(!AABB.hitCheckLine(face.aabb,p0,p1)){
				continue;
			}
			var t0=face.points[0].location;
			var t1=face.points[1].location;
			var t2=face.points[2].location;

			var l =Geono.TRIANGLE_LINE(face.points[0].location
						,face.points[1].location
						,face.points[2].location
						,p0,p1);
			if(l<min){
				min=l;
				res.face= face;
				res.p1= face.points[0];
				res.p2= face.points[1];
				res.p3= face.points[2];
			}

			if(face.idxnum===4){
				l =Geono.TRIANGLE_LINE(face.points[0].location
						,face.points[2].location
						,face.points[3].location
						,p0,p1);
				if(l<min){
					min=l;
					res.face= face;
					res.p1= face.points[0];
					res.p2= face.points[2];
					res.p3= face.points[3];
				}
			}
		}
		
		return min;
	}
	getPhyFace(p1,p2,p3,face,ans2){
		var phyFace = Cloth.disablePhyFace.pop();
		var v1=Vec3.poolAlloc();
		var v2=Vec3.poolAlloc();
		phyFace.cloth=this;
		phyFace.face = face;
		phyFace.p[0]=p1;
		phyFace.p[1]=p2;
		phyFace.p[2]=p3;

		//ポリゴン接点から各頂点の影響比率を求める
		Vec3.sub(v1,p2.location,p1.location);
		Vec3.sub(v2,p3.location,p1.location);
		Vec3.cross(v1,v1,v2);
		var p=[p1.location
			,p2.location
			,p3.location
			,p1.location
			,p2.location];
		for(var k=0;k<DIMENSION;k++){
			Vec3.sub(v2,p[k+2],p[k+1]);
			Vec3.cross(v2,v1,v2);
			var a=Vec3.dot(v2,p[k+1]);
			var b=Vec3.dot(v2,p[k]);
			var c=Vec3.dot(v2,ans2);

			phyFace.ratio[k]=(a-c)/(a-b);
		}
		
		Vec3.poolFree(2);
		return phyFace;
	}

	calcPre(onophy){
		//AABB計算
		this.aabb.min.set(this.points[0].location);
		this.aabb.max.set(this.points[0].location);
		for(var i=0;i<this.faces.length;i++){
			//ポリゴン毎のAABB計算
			var face = this.faces[i];
			if(face.idxnum===4){
				AABB.createFromPolygon(face.aabb
					,face.points[0].location
					,face.points[1].location
					,face.points[2].location
					,face.points[3].location);
			}else{
				AABB.createFromPolygon(face.aabb
					,face.points[0].location
					,face.points[1].location
					,face.points[2].location);
			}
			for(var j=0;j<DIMENSION;j++){
				face.aabb.min[j]-=this.bold;
				face.aabb.max[j]+=this.bold;
			}

			for(var j=0;j<DIMENSION;j++){
				this.aabb.min[j]=MIN(this.aabb.min[j],face.aabb.min[j]);
				this.aabb.max[j]=MAX(this.aabb.max[j],face.aabb.max[j]);
			}
		}
		this.facesSort.sort(function(a,b){return a.aabb.min[0]-b.aabb.min[0]});

		//剛体との衝突判定
		var list = onophy.collider.aabbSorts[0];
		var triangle = new Collider.Triangle();
		triangle.bold=this.bold;
		var ans1=Vec3.poolAlloc();
		var ans2=Vec3.poolAlloc();
		var v1=Vec3.poolAlloc();
		var v2=Vec3.poolAlloc();
		for(var i=0;i<list.length;i++){
			if(list[i].type===Collider.MESH){
			   continue;
			}   
			if(list[i].aabb.min[0]>this.aabb.max[0]){
				break;
			}
			if(!AABB.hitCheck(list[i].aabb,this.aabb)){
				continue;
			}

			for(var j=0;j<this.faces.length;j++){
				var face = this.faces[j];

				if(!AABB.hitCheck(face.aabb,list[i].aabb)){
					continue;
				}
				for(var k=0;k<face.idxnum-2;k++){
					Vec3.copy(triangle.poses[0],face.points[0].location);
					Vec3.copy(triangle.poses[1],face.points[1].location);
					Vec3.copy(triangle.poses[2],face.points[2].location);
					triangle.aabb = face.aabb;

					var l = Collider.calcClosest(ans1,ans2,list[i],triangle);
					if(l<0){
						var phyFace = this.getPhyFace(face.points[0],face.points[1+k],face.points[2+k],face,ans2); //衝突計算用の板ポリ
						onophy.registHitConstraint(list[i].parent,ans1,phyFace,ans2);
					}
				}
			}
		}

		this.inv_pointMass = 1/(this.mass/this.points.length);
		for(var i=0;i<this.edges.length;i++){
			//エッジ拘束
			this.edges[i].calcPre();
		}
		for(var i=0;i<this.bends.length;i++){
			this.bends[i].calcPre(1);
		}

		Vec3.poolFree(4);
	}

	calcCollision(target,onophy){
		//衝突判定

		if(!AABB.hitCheck(target.aabb,this.aabb)){
			return;
		}

		var triangle = new Collider.Triangle();
		var triangle2 = new Collider.Triangle();
		triangle.bold=this.bold;
		triangle2.bold=target.bold;
		var ans1=Vec3.poolAlloc();
		var ans2=Vec3.poolAlloc();

		var trueans1=Vec3.poolAlloc();
		var trueans2=Vec3.poolAlloc();
		var trueface,trueface2;
		var sflg1,sflg2;
		var ii=0;
		for(var i=0;i<this.facesSort.length;i++){
			var min=99999;
			var face = this.facesSort[i];
			//if(!AABB.hitCheck(face.aabb,target.aabb)){
			//	continue;
			//}
			triangle.aabb = face.aabb;
			for(var j=ii;j<target.facesSort.length;j++){
				var face2= target.facesSort[j]
				if(face.aabb.min[0]>face2.aabb.max[0]){
					ii=j;
					continue;
				}	
				if(face.aabb.max[0]<face2.aabb.min[0]){
					break;
				}	
				if(!AABB.hitCheck(face.aabb,face2.aabb)){
					continue;
				}
				triangle2.aabb = face2.aabb;

				for(var fan=0;fan<(face.idxnum-2);fan++){
					triangle.poses[0]=face.points[0].location;
					triangle.poses[1]=face.points[1+fan].location;
					triangle.poses[2]=face.points[2+fan].location;

					for(var fan2=0;fan2<(face2.idxnum-2);fan2++){
						triangle2.poses[0]=face2.points[0].location;
						triangle2.poses[1]=face2.points[1+fan2].location;
						triangle2.poses[2]=face2.points[2+fan2].location;

						var l = Collider.calcClosest(ans1,ans2,triangle,triangle2);
						if(l<min){
							min=l;
							trueface=face;
							trueface2=face2;
							sflg1=fan;
							sflg2=fan2;
							Vec3.copy(trueans1,ans1);
							Vec3.copy(trueans2,ans2);
						}
					}
				}
			}
			if(min<0){
				var face = trueface;
				var face2 = trueface2;
				var phyFace = this.getPhyFace(face.points[0],face.points[1+sflg1],face.points[2+sflg1]
					,face,trueans1);
				var phyFace2 = this.getPhyFace(face2.points[0],face2.points[1+sflg2],face2.points[2+sflg2]
					,face2,trueans2);
				onophy.registHitConstraint(phyFace,trueans1,phyFace2,trueans2);
			}
		}

		Vec3.poolFree(4);
	}
	calcConstraintPre(){
		var mass = (this.mass/this.points.length);
		for(var i=0;i<this.edges.length;i++){
			this.edges[i].calcConstraintPre(mass);
		}
	}
	calcConstraint(){
		var mass = (this.mass/this.points.length);
		for(var i=0;i<this.edges.length;i++){
			this.edges[i].calcConstraint(mass);
		}
	}
	update(dt){
		var mass = (this.mass/this.points.length);
		AIR_DAMPER=Math.pow(1-0.24*this.air_damping,dt);
		for(var i=0;i<this.points.length;i++){
			this.points[i].update(dt,mass);
		}
	}
};


var Point =  (function(){
	var Point = function(){
		this.v = new Vec3();
		this.oldv = new Vec3();
		this.location = new Vec3();
		this.rotV = new Vec3();
		this.rotq= new Vec4();
		this.fix = false;
	}
	var ret = Point;

	ret.prototype.update=function(dt){
		if(this.fix){
			return ;
		}

		var rq = Vec4.poolAlloc();
		var l=Vec3.scalar(this.rotV);
		if(l>0){
			var d=1/l;
			Vec4.fromRotVector(rq,l*dt,this.rotV[0]*d,this.rotV[1]*d,this.rotV[2]*d);
			Vec4.qdot(this.rotq,rq,this.rotq);
		}
		Vec4.poolFree(1);
		Vec3.madd(this.location,this.location,this.v,dt);
		Vec3.mul(this.v,this.v,AIR_DAMPER);
		this.v[1]-=this.cloth.onophy.GRAVITY*dt;
	}
	return ret;
})()
var  Edge =  (function(){
	var Edge = function(){
		this.point1 = null;
		this.point2 = null;
		this.impulse = 0;
		this.len;
		this.n = new Vec3();
		this.offset = 0;
		this.cloth=null;
	};
	var ret=Edge;

	ret.prototype.calcPre=function(flg){
		var dv = Vec3.poolAlloc();
		Vec3.sub(dv,this.point2.location,this.point1.location);
		var l = Vec3.scalar(dv);
		Vec3.nrm(this.n,dv);
		if(flg){
			l = -(this.len - l)*this.cloth.bending_stiffness; 
			Vec3.mul(dv,this.n,l*this.cloth.onophy.dt*this.cloth.inv_pointMass);

			if(!this.point1.fix){
				Vec3.add(this.point1.v,this.point1.v,dv);
			}
			if(!this.point2.fix){
				Vec3.sub(this.point2.v,this.point2.v,dv);
			}
		}else{
			this.offset = -(this.len - l)*this.cloth.structual_stiffness; //位置補正
		}

		Vec3.poolFree(1);
	}
	ret.prototype.calcConstraintPre=function(){
		var impulse = Vec3.poolAlloc();
		Vec3.mul(impulse,this.n,this.impulse*this.cloth.inv_pointMass);
		if(!this.point1.fix){
			Vec3.add(this.point1.v,this.point1.v,impulse);
		}
		if(!this.point2.fix){
			Vec3.sub(this.point2.v,this.point2.v,impulse);
		}
		Vec3.poolFree(1);
	}
	ret.prototype.calcConstraint=function(m){
		var dv = Vec3.poolAlloc();
		var impulse = Vec3.poolAlloc();
		var old = this.impulse;

		Vec3.sub(dv,this.point2.v,this.point1.v);
		this.impulse += (Vec3.dot(dv,this.n)+this.offset)*(m*m/(m+m));
		this.impulse*=0.98; //やわらか拘束

		Vec3.mul(impulse,this.n,(this.impulse-old)*this.cloth.inv_pointMass);

		if(!this.point1.fix){
			Vec3.add(this.point1.v,this.point1.v,impulse);
		}
		if(!this.point2.fix){
			Vec3.sub(this.point2.v,this.point2.v,impulse);
		}
		Vec3.poolFree(2);
	}
	return ret;
})();
class Face{
	constructor(){
		this.points = [null,null,null];
		this.aabb=new AABB();
		this.cloth=null;
	}
};

Cloth.Point = Point;
Cloth.Face = Face;
