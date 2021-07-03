//バインド

class Bind{
	constructor(node,variable){
		this.node=node;
		this.attribute_name="";
		this.variable=variable;
	}

	getBindValue(n){
		//バインドされた変数の値を取得
		var bind = this;
		var value=this.binder.args_root;
		for(var j=0;j<bind.variable.length-n;j++){
			value = value[bind.variable[j]];
			if(value == undefined){
				value=null;
				break;
			}
		}
		return value;
	}

	feedBackValue(){
		//バインド変数にコントロールの値をセットする
		var val =this.getBindValue(1); //対象の変数の親を取得
		val[this.variable[this.variable.length-1]]=this.node.value;
		this.old_value=null;
	}

	refresh(){
		//バインドされた変数の値をノード属性にセット
		var bind = this;
		var value = this.getBindValue(0);
		if(bind.old_value  === value){
			return;
		}
		var node = bind.node;
		node.setAttribute(bind.attribute_name,value);

		if(bind.attribute_name !=="content"){
			return;
		}
		switch(node.tagName){
			case "INPUT":
			case "SELECT":
			case "TEXTAREA":
			if(node.value !== value){
				node.value = value;
			}
			break;
		default:
			if(value && (value instanceof HTMLElement || value.nodeName)){
				node.innerHTML="";
				node.appendChild(value);
			}else{
				node.textContent= value;
			}
		}
		bind.old_value = value;
	}
}

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
		

		var func =()=>{
			this.refresh();
			window.requestAnimationFrame(func);
		}
		func();
	}

	//ノードとバインド変数を渡してバインド情報を登録する
	bind(node,attribute_name){
		var bind=new Bind();
		bind.node = node;

		bind.attribute_name = attribute_name.replace("bind:","");
		bind.variable = bind.node.getAttribute(attribute_name).split(".");
		bind.args_root = this.args_root;
		bind.binder=this;
		this.binds.push(bind);
	}

	//バインドしたノードに変数の値をセット
	refresh(){
		for(var i=0;i<this.binds.length;i++){
			this.binds[i].refresh();
		}

	}
}
