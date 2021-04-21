//バインド
export default class Binder {
	constructor(){
		this.binds=[];
		this.args_root = window;
	}
	init(_args_root){
		if(_args_root){
			this.args_root = _args_root;
		}
		this.binds=[];
		var bindedNodes = document.querySelectorAll("#form [bind]");
		for(var i=0;i<bindedNodes.length;i++){
			this.bind(bindedNodes[i]);
		}
	}

	//bindが指定されたノードを渡してバインド情報を登録する
	bind(target){
		var bind={};
		bind.target = target;
		bind.variable = bind.target.getAttribute("bind").split(".");
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
