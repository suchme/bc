module.exports = {
entry: "./src/index.js",
output:{
path:  __dirname + "/docs"
,filename:  	"index.js",
},
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
 mode: "development",
 // mode: "production",

  // ローカル開発用環境を立ち上げる
  // 実行時にブラウザが自動的に localhost を開く
  devServer: {
    open: true,
	port:8081,
	host: '0.0.0.0',
	static: {
		directory: "docs",
	}
  },
  module: {
    rules: [
      {
        // 拡張子 .js の場合
        test: /\.js$/,
        use: [
          {
            // Babel を利用する
            loader: "babel-loader",
            // Babel のオプションを指定する
            options: {
              presets: [
                // プリセットを指定することで、ES2020 を ES5 に変換
                "@babel/preset-env",
              ],
  "plugins": [
    "@babel/plugin-proposal-class-properties"
  ]
            },
          },
        ],
      }
	,{
        test: /\.css/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
          }
        ]
      }
      ,{
        test: /\.(png|jpg|gif|svg)$/
        ,type: "asset/inline"
      }
    ],
  },
  // ES5(IE11等)向けの指定
  target: ["web", "es5"],
};
