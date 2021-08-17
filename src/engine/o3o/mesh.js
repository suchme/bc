export default class Mesh{
	constructor(){
		//メッシュ情報
		this.name=""; //名前
		this.use_auto_smooth = 0;
		this.auto_smooth_angle = 0;
		this.vertices = [];//頂点
		this.colors=[];//頂点色
		this.shcoefs=[];//球面調和関数の係数
		this.shapeKeys = [];//シェイプキー
		this.faces = [];//面
		this.edges = [];//辺
		this.flg=0; //フラグ
		this.uv_layers=[];//uv情報
	};
};
