var SubLayout={};

SubLayout.shinki_html =`
	<span column="name" class="shinki"></span>
	<span column="atk" class="atk status "></span>
<span column="def" class="def status "></span>
	<span column="spd" class="spd status "></span>
	<span column="lp" class="lp status  "></span>
	<span column="bst" class="bst status "></span>
	<span class="sep"></span>
	<span column="recover" class="recover status "></span>
	<span column="dash" class="dash status  "></span>
	<span class="sep"></span>
	<span column="dash_cost" class="dash_cost cost status "></span>
	<span column="jump_cost" class="jump_cost cost status "></span>
	<span column="guard_cost" class="guard_cost cost status "></span>
	<span column="hover_cost" class="hover_cost cost status "></span>
	<span class="sep"></span>
	<span column="cat1" class=" short cat status "></span>
	<span column="cat2" class=" short cat status "></span>
	<span column="cat3" class=" short cat status "></span>
	<span column="cat4" class=" short cat status "></span>
	<span column="cat5" class=" short cat status "></span>
	<span column="cat6" class=" short cat status "></span>
	<span column="cat7" class=" short cat status "></span>
	<span column="cat8" class=" short cat status "></span>
	<span column="cat9" class=" long cat status "></span>
	<span column="cat10" class="long cat status "></span>
	<span column="cat11" class="long cat status "></span>
	<span column="cat12" class="long cat status "></span>
	<span column="cat13" class="long cat status "></span>
	<span column="cat14" class="long cat status "></span>
	<span column="cat15" class="bougu cat status "></span>
`;

SubLayout.head_html =`
	<span>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div style="margin-left:10px;">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
	</span>
	<span>
		<div>
			<span class="atk status" column="atk"></span>
			<span class="def status" column="def"></span>
			<span class="spd status" column="spd"></span>
			<span class="lp status" column="lp"></span>
			<span class="bst status" column="bst"></span>
			<span class="sep"></span>
			<span column="recover" class="recover status "></span>
			<span column="dash" class="dash status  "></span>
			<span class="sep"></span>
			<span column="dash_cost" class="dash_cost cost status "></span>
			<span column="jump_cost" class="jump_cost cost status "></span>
			<span column="guard_cost" class="guard_cost cost status "></span>
			<span class="sep"></span>
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
		</div>
	</span>

`;
SubLayout.body_html =`
	<span>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div style="margin-left:10px;">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
	</span>
	<span class="atk status" column="atk"></span>
	<span class="def status" column="def"></span>
	<span class="spd status" column="spd"></span>
	<span class="lp status" column="lp"></span>
	<span class="bst status" column="bst"></span>
	<span class="sep"></span>
	<span column="recover" class="recover status "></span>
	<span column="dash" class="dash status  "></span>
	<span class="sep"></span>
	<span column="dash_cost" class="dash_cost cost status "></span>
	<span column="jump_cost" class="jump_cost cost status "></span>
	<span column="guard_cost" class="guard_cost cost status "></span>
	<span class="sep"></span>
	<span style="width:200px;">
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
	</span>

`;

SubLayout.arm_html =`
	<span>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div style="margin-left:10px;">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
	</span>
	<span class="atk status" column="atk"></span>
	<span class="def status" column="def"></span>
	<span class="spd status" column="spd"></span>
	<span class="lp status" column="lp"></span>
	<span class="bst status" column="bst"></span>
	<span class="sep"></span>
	<span column="recover" class="recover status "></span>
	<span column="dash" class="dash status  "></span>
	<span class="sep"></span>
	<span column="dash_cost" class="dash_cost cost status "></span>
	<span column="jump_cost" class="jump_cost cost status "></span>
	<span column="guard_cost" class="guard_cost cost status "></span>
	<span class="sep"></span>
	<span style="width:200px;">
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
	</span>

`;

SubLayout.leg_html =`
	<span>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div style="margin-left:10px;">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
	</span>
	<span class="atk status" column="atk"></span>
	<span class="def status" column="def"></span>
	<span class="spd status" column="spd"></span>
	<span class="lp status" column="lp"></span>
	<span class="bst status" column="bst"></span>
	<span class="sep"></span>
	<span column="recover" class="recover status "></span>
	<span column="dash" class="dash status  "></span>
	<span class="sep"></span>
	<span column="dash_cost" class="dash_cost cost status "></span>
	<span column="jump_cost" class="jump_cost cost status "></span>
	<span column="guard_cost" class="guard_cost cost status "></span>
	<span class="sep"></span>
	<span style="width:200px;">
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
	</span>

`;

SubLayout.rear_html =`
	<span>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div style="margin-left:10px;">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
		</div>
	</span>
	<span class="atk status" column="atk"></span>
	<span class="def status" column="def"></span>
	<span class="spd status" column="spd"></span>
	<span class="lp status" column="lp"></span>
	<span class="bst status" column="bst"></span>
	<span class="sep"></span>
	<span column="recover" class="recover status "></span>
	<span column="dash" class="dash status  "></span>
	<span class="sep"></span>
	<span column="dash_cost" class="dash_cost cost status "></span>
	<span column="jump_cost" class="jump_cost cost status "></span>
	<span column="guard_cost" class="guard_cost cost status "></span>
	<span column="hover_cost" class="hover_cost cost status "></span>
	<span column="flying" class="flying"></span>
	<span class="sep"></span>
	<span style="width:200px;">
			<span style="width:200px;">
				<div><span class="passive" column="passive"></span></div>
				<div><span class="active" column="active"></span></div>
			</span>
	</span>

`;

SubLayout.weapon_html =`
	<span>
		<div class="divname">
			<span class="rarelity" column="rarelity"></span>
			<span class="name" column="name"></span>
		</div>
		<div style="margin-left:10px;">
			<span class="part" column="part"></span>
			<span class="class" column="class"></span>
			<span class="category" column="category"></span>
			<span class="distance">
				<span column="distance"></span>
			</span>
		</div>
	</span>
	<span>
		<div>
			<span class="atk status" column="atk"></span>
			<span class="def status" column="def"></span>
			<span class="spd status" column="spd"></span>
			<span class="lp status" column="lp"></span>
			<span class="bst status" column="bst"></span>
			<span class="sep"></span>
			<span class="dash status" column="dash"></span>
			<span class="sep"></span>
			<span class="dash_cost cost status" column="dash_cost"></span>
			<span class="guard_cost cost status" column="guard_cost"></span>
		</div>
		<div class="guargediv">
			<span column="recast" class="guarge">
				<div class="guarge_title">リキャスト</div>
				<span class="guarge_parent">
					<div class="guarge_child" ></div>
				</span>
			</span>
			<span column="reload" class="guarge">
				<div class="guarge_title">リロード</div>
				<span class="guarge_parent">
					<div class="guarge_child" ></div>
				</span>
			</span>
			<span column="range" class="guarge">
				<div class="guarge_title">射程</div>
				<span class="guarge_parent">
					<div class="guarge_child" ></div>
				</span>
			</span>
		</div>
	</span>
	<span>
		<div><span class="active" column="active"></span></div>
		<div class="biko" column="biko"></div>
	</span>
`;

SubLayout.arr=[
	SubLayout.shinki_html
	,SubLayout.head_html
	,SubLayout.body_html
	,SubLayout.arm_html
	,SubLayout.leg_html
	,SubLayout.rear_html
	,SubLayout.weapon_html
]


SubLayout.guarge = function(e,parent){
	parent.querySelector("div.guarge_child").style.width=e[this.data] +"%";
	parent.parentNode.title=e;
	return null;
};
export default SubLayout ;
