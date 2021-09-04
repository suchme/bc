
import InterpolationMode from "./interpolationmode.js"
import RepeatMode from "./repeatmode.js"
export default class Fcurve{
	constructor(){
		//キーフレーム
		this.target ="";//ターゲット(ボーン名かマテリアル番号)
		this.type =""; //
		this.idx=0; //
		this.interpolatemode=InterpolationMode.LINER; //補完タイプ
		this.repeatmode = RepeatMode.NONE;//繰り返しタイプ
		this.keys = []; //キー時間
		this.params = []; //キーパラメータ
	}
}
