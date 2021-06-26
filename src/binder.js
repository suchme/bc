//バインド
export default class Binder {
	constructor(){
		this.binds=[];
		this.args_root = window;
	}

	//初期化&バインド
	init(_args_root){
		if(_args_root){
			this.args_root = _args_root;
		}
		this.binds=[];

		var bindedNodes = document.querySelectorAll("*");
		bindedNodes.forEach((node)=>{
			for(var i=0;i<node.attributes.length;i++){
				var name = node.attributes[i].name;
				if(name.indexOf("bind:")!==0)continue;
				this.bind(node,name);
			
			};
		});
		
	}

	//ノードとバインド変数を渡してバインド情報を登録する
	bind(target,param){
		var bind={};
		bind.target = target;

		bind.param = param.replace("bind:","");
		bind.variable = bind.target.getAttribute(param).split(".");
		this.binds.push(bind);
	}

	//バインドされた変数に値をセットする
	setBindValue(bind,n){
		var val =this.getBindValue(bind,1); //対象の変数の親を取得
		val[bind.variable[bind.variable.length-1]]=n;
	}

	//バインドされた変数の値を取得
	getBindValue(bind,n){
		var value=this.args_root;
		for(var j=0;j<bind.variable.length-n;j++){
			value = value[bind.variable[j]];
			if(value == undefined){
				value=null;
				break;
			}
		}
		return value;
	}

	//バインドしたノードに変数の値をセット
	refresh(){
		for(var i=0;i<this.binds.length;i++){
			const bind = this.binds[i];
			var value = this.getBindValue(bind,0);
			if(bind.old_value  === value){
				continue;}
			var target = bind.target;
			if(bind.param !=="text"){
				target.setAttribute(bind.param,value);
				continue;
			}
			if(target.tagName==="INPUT" || target.tagName==="SELECT" || target.tagName==="TEXTAREA"){
				if(target.value !== value){
					target.value = value;
				}
			}else{
				if(value && (value instanceof HTMLElement || value.nodeName)){
					target.innerHTML="";
					target.appendChild(value);
				}else{
					//target.textContent= value;
					target.innerHTML= value;
				  }
			}
			bind.old_value = value;
		}
	}
}
