
	//�I�u�W�F�N�g�}�l�[�W��
	var STAT_EMPTY=0
		,STAT_ENABLE=1
		,STAT_CREATE=2
	;
var objPool=[];
export default class ObjMan{
	constructor(){
		this.objs= []; 
		this.id=0;
	}

	createObj(c){
		if(!c){
			c=Engine.defObj;
		}
		var obj = null;
		if(objPool.length>0){
			obj = objPool[objPool.length-1];
			if(obj.stat<0){
				//�N�[���^�C���Ȃ͖̂���
				obj=null;
			}
		}
		if(!obj){
			//�v�[������Ƃ��Ă���Ȃ��ꍇ�͉����ǉ�����
			for(var i=0;i<16;i++){
				objPool.push(new Obj());
			}
		}
		//�v�[������I�u�W�F�N�g���ړ�
		obj = objPool.pop();
		this.objs.push(obj);

		if(this.objs.length>1024){
			//�s�{��
			alert("objs>1024!");
		}

		//�����l�Z�b�g
		Mat43.setInit(obj.matrix);
		obj.parent=null;
		Vec3.set(obj.scale,1,1,1);
		obj.angle=0;
		obj.t=0;
		obj.hp=1;
		obj.stat=STAT_CREATE;
		obj.pattern=0;
		obj.frame=0;
		obj.pos2=new Vec3();
		obj.func=c;

		//ID�Z�b�g
		obj.id=this.id;
		this.id++;

		obj.__proto__=c.prototype;

		obj.scene = this.scene;
		obj.init();

		return obj;
		
	}
	deleteObj(obj){
		for(var i=0;i<this.objs.length;i++){
			if(obj === this.objs[i]){
				//�N�[���^�C�������
				obj.stat=-10;
				//�v�[���Ɉړ�
				objPool.unshift(objs[i]);
				objs.splice(i,1);
				break;
			}
		}
	}
	update(){
		var objs = this.objs;
		for(var i=0;i<this.objs.length;i++){

			if(objs[i].stat===STAT_CREATE){
				objs[i].stat=STAT_ENABLE;
			}

			if(objs[i].stat===STAT_ENABLE){
				objs[i].t++;
				objs[i].frame++;
			}
		}
		for(var i=0;i<objPool.length;i++){
			if(objPool[i].stat<0){
				objPool[i].stat++;
			}else{
				break;
			}
		}

	}
	
	move(){
		var objs = this.objs;
		for(i=0;i<objs.length;i++){
			if(objs[i].stat!==STAT_ENABLE)continue;
			objs[i].move();
		}
	}

};
