$(document).ready(function(){
	commonJs();
	main_auto();
	tab();
	acod();
	slick();
	subLocationAdd();
	datepicker();
	quick();
});
var posY;
$(document).on('click', '.qna_tbl tbody tr .open_qna', function(){	//
	if($(this).parent().parent('tr').hasClass('open')){
		$(this).parent().parent().next('tr').hide();
		$(this).parent().parent('tr').removeClass('open');
	} else {
		$(this).parent().parent('tr').addClass('open');
		$(this).parent().parent().next('tr').show();
	}
});
// 팝업 닫기
$(document).on('click','.pop_close', function(){
	$(this).closest('.popup, .layer, [class*="pop_prevType"]').hide();
	$('html').removeAttr('style');
	//console.log(posY);
	$('html').scrollTop(posY);
	$('.quick_menu').css('margin-left','-600px');
	if($('.r_box').length > 0){
		var p = $('.r_box').css('right');
		var p = Number(p.replace('px' ,'' ));
		if (p == 0){
			var	p = 0;
		}else{
			var	p = p - 17;
		}
		$('.r_box').css('right', p +'px' );
	}
});

$(function(){

	/* 2020-03-02 login pw 아이콘 보이게
	$('.inputbox.pw input').on('keyup focusout', function(event){
		if(event.type === 'keyup'){
			$(this).addClass('eye');
		}
		if(event.type === 'focusout'){
			$(this).removeClass('eye');
		}
	})
	*/
});

// 상세 스크롤 픽스
function wingMove(){
	$('.r_box').each(function(){
		var st = $('html,body').scrollTop(),
			sp = $('.rail_wrap').offset().top,
			top = st - sp;
			rbox_h = $('.r_box').height(),
			rbox_pos = parseInt($('.r_box').css('top').replace('px','')),
			max = $('.rail_wrap').height() - rbox_h,
			r_pos = $('.rail_wrap').offset().left;
		if(st <= sp){
			//$('.r_box').removeAttr('style');
			$('.r_box').css({
				position:'absolute',
				right:0,
				top:0
			});
			$('.idx_tab > ul.clear').removeAttr('style');
		}else if(st > sp && top <= max){
			$('.r_box').css({
				position:'fixed',
				right: r_pos,
				top: 0
			});
			$('.idx_tab > ul.clear').css({
				position:'fixed',
		//		left: r_pos + '756px',
				top:0,
				'z-index' : '3',
				background : '#fff'
			});
		}else{
			$('.r_box').css({
				position:'absolute',
				top:max,
				right:0
			});
			$('.idx_tab > ul.clear').removeAttr('style');
		}
	});
}

function popupOpen(e){	// 팝업
	posY = $(window).scrollTop();
	//console.log(posY);
	$('.popup.'+e).show();
	$('html').css({
		'height': '100%',
		'overflow': 'hidden',
		'padding-right': '17px',
		'box-sizing' : 'border-box',
		'-webkit-box-sizing': 'border-box',
		'-moz-box-sizing': 'border-box',
	});
	$('.quick_menu').css({
		'margin-left': '-608px'
	});
	if($('.r_box').length > 0){
		var p = $('.r_box').css('right');
		var p = Number(p.replace('px' ,'' ));
		if (p == 0){
			var	p = 0;
		}else{
			var	p = p + 17;
		}
		//console.log(p);
		$('.r_box').css('right', p +'px' );
	}
}

function popupClose(e){	// 팝업
	$('.popup.'+e).hide();
	$('html').removeAttr('style');
	//console.log(posY);
	$('html').scrollTop(posY);
	$('.quick_menu').css('margin-left','-600px');
	if($('.r_box').length > 0){
		var p = $('.r_box').css('right');
		var p = Number(p.replace('px' ,'' ));
		if (p == 0){
			var	p = 0;
		}else{
			var	p = p - 17;
		}
		//console.log(p);
		$('.r_box').css('right', p +'px' );
	}

}

//2020-02-13추가
function main_auto(){
	roll = setInterval(function(){
		$('.mainslide02 .arrows .next').click();
	},3000);
}
function commonJs(){

	//메인슬라이드
	$('.mainslide02 .arrows a').click(function(){
		$('.mainslide02 .slidArea li').animate().stop();
		if($(this).hasClass('next')){
			if($('.slidArea li').last().hasClass('on')){
				$('.slidArea li').first().addClass('on').fadeIn(100,function(){
					$(this).siblings().fadeOut(100).removeClass('on');
				});
			}else{
				//$('.slidArea li.on').fadeOut().removeClass('on').next().fadeIn().addClass('on');
				$('.slidArea li.on').fadeOut(100,function(){
					$(this).removeClass('on').next().fadeIn().addClass('on');
				});
			}
		}else{
			if($('.slidArea li').first().hasClass('on')){
				$('.slidArea li').last().addClass('on').fadeIn(100,function(){
					$(this).siblings().fadeOut(100).removeClass('on');
				});
			}else{
			//$('.slidArea li.on').fadeOut().removeClass('on').prev().fadeIn().addClass('on');
			$('.slidArea li.on').fadeOut(100,function(){
					$(this).removeClass('on').prev().fadeIn().addClass('on');
				});
			}
		}
		clearInterval(roll);
		main_auto();
	});
	//2020-02-13추가
	//메인슬라이드
	$('.con_gnb .hid_menu a').hover(function(){
		$('.mainslide02 .slidArea li').animate().stop();
		var name = $(this).data('name'),
			name = Number(name);
		//console.log(name);
		$('.slidArea li').eq(name).fadeIn(100,function(){
			$(this).siblings().fadeOut(100).removeClass('on');
		}).addClass('on');
		clearInterval(roll);
	},function(){
		clearInterval(roll);
		main_auto();
	});
	//main_auto();

	/*$('.menu_open').on('click', function(){	// 전체메뉴
		if($('.allmenu').is(':visible')){
			$('.allmenu').hide();
		}else{
			$('.allmenu').show();
		}
	});*/

	$('.category_close').on('click', function(){
		$('.allmenu').hide();
	});
	// 전체메뉴
	$('.category_sub > li > a').on('mouseover focus', function(){
		$(this).parent().addClass('open').siblings().removeClass('open');
		if($('.category_sub > li').hasClass('open')){
			$('.category_sub > li').on('mouseleave', function(){
				$(this).removeClass('open');
			});
		}
	});
	
	// 20.12.30 이승준 : 엔터키제어 함수 추가
	$('.count_up, .count_down').keydown(function(e){
		if(e.keyCode == 13) {
			return false;
		}
	});

//	$('.count_up').on('click',function(){	// 상품 갯수 +
	
//		var stat = $(this).siblings('.count').val();
//		var num = parseInt(stat);
//		num++;
//		$(this).siblings('.count').val(num);
//	});
//
//	$('.count_down').click(function(){	// 상품 갯수 --
//		var stat = $(this).siblings('.count').val();
//		var num = parseInt(stat);
//		num--;
//		if(num<=1){
//			num =1;
//		}
//		$(this).siblings('.count').val(num);
//	});
//	
	// main gnb
	$('.con_gnb').ready(function(){
		var   gnb_a = ('.con_gnb > li > a');
				gnb_li = ('.con_gnb > li');
				gnb_w = ('.con_gnb');

		$(gnb_a).on('mouseover focus', function(){
			$(this).parent().addClass('on');

			if($(this).parent().hasClass('on')){
				$(this).parent().siblings().removeClass('on');
			} else{
			   $(this).parent().removeClass('on');
			}
		});
		$(gnb_w).mouseleave(function(){
			$(gnb_li).removeClass('on');
		});
	});

	$('.top').on('click', function(){// 퀵 top btn
		$('html, body').stop().animate({ scrollTop : '0' },500);
	});

	$('.detail_more').on('click',function(){	// 상품 검색 조건 더보기
		var text = $('.detail_more span');
		$(this).parent().toggleClass('open');
		if($(this).parent().hasClass('open')){
			$(text).text('닫기');
		} else{
			$(text).text('더보기');
		}
	});

	$('.sort_view .t_cell a.list').on('click',function(){	// 상품 정렬
		$(this).addClass('on').siblings().removeClass('on');
		$(this).parents('.sort_view').addClass('listType');
		if($('.sort_view').hasClass('listType')){
			$('.sort_view .t_cell a.card').click(function(){
				$(this).addClass('on').siblings().removeClass('on');
				$(this).parents('.sort_view').removeClass('listType');
			});
		}
	});

	$(".address_list input[type='radio']").change(function() {	// 배송지 주소록
		if (this.checked) {
			$('tr.checked').removeClass('checked');
			$(this).parent().parent().addClass('checked');
		} else {
			$('tr.checked').removeClass('checked');
		}
	});

	$('.cmmnt_txt .btn').on('click',function(){	// 댓글 더 보기
		$(this).parent().toggleClass('open');
		if($(this).parent().hasClass('open')){
			$(this).text('-닫기');
		} else{
			$(this).text('+더보기');
		}
	});

	$('.graph_box .btn.small').on('click',function(){	// 상품상세 상품평
		if(!$(this).closest('.graph_box').hasClass('open')){
			$(this).closest('.graph_box').addClass('open').siblings().removeClass('open');
			$(this).closest('.graph_box').siblings().find('.btn.small').text('자세히보기');
			$(this).text('닫기');
		} else{
			$(this).closest('.graph_box').removeClass('open');
			$(this).text('자세히보기');
		}
	});

	//// 서브 상단 로케이션
	//$('.location_l > ul > li:has(.lct_menu)').addClass("lctn");
	//$('.location_l ul li.lctn a').on('click',function(){
		//$(this).parent().toggleClass('open');
	//});

	// 첨부파일
	if($('.filebox').hasClass('filebox')){
		var fileTarget = $('.filebox .upload-hidden');
		fileTarget.on('change', function(){
			if(window.FileReader){
				var filename = $(this)[0].files[0].name;
			} else {
				var filename = $(this).val().split('/').pop().split('\\').pop();
			}
			$(this).siblings('.file_name').val(filename);
		});
	}

	// login  휴대폰/이메일 찾기
	$(".radio_tab input[type='radio']").change(function() {
		$(this).closest('.radio_tab').toggleClass('rdo_tab');
	});

	// login  휴대폰/이메일 찾기
	$(".radio_card li").first().addClass('on');
	$(".radio_card li input[type='radio']").change(function() {
		$(this).parent().addClass('on').siblings().removeClass('on');
	});



	// 하루만에두리 장바구니담기 버튼
	$('.cart_add').click(function(){
		$(this).closest('.goods_intro').find('.cart_confirm').toggle();
	});
	$('.cart_confirm a').click(function(){
		$(this).closest('.cart_confirm').hide();
	});
	
	// 상세 팝업 추가 : 210406
	$('.pop_list a.link').on('click', function(){
		$(this).parent().next('.layer').css({'display' : 'block'});
	}); 

	// 상세 팝업
	$('.table_dl dd a.btn.link').on('click', function(){
		$(this).next('.layer').css({'display' : 'block'});
	});
	// cp샵 상세 팝업
	$('.cp_shop_tit a.btn.link').on('click', function(){
		$(this).parent().parent().next('.layer').css({'display' : 'block'});
	});

	$('.layer_close').on('click', function(){
		$(this).closest('.layer').css({'display' : 'none'});
	});

	 //tooltip
	$('.tooltip > span').on('click', function(){
		$(this).parent().addClass('on');
		if($('.tooltip').hasClass('on')){
			 $('.tooltip_inner .t_close').click(function(){
				$(this).closest('.tooltip').removeClass('on');
			});
		}
	});

	// 장바구니
	$('.price_bx .arr').on('click', function(){
		$(this).parent().parent().toggleClass('next');
	})

	$('.qna_tbl tbody tr .open_qna').click(function(){		 // table qna
		if($(this).parent().parent('tr').hasClass('open')){
			$(this).parent().parent().next('tr').hide();
			$(this).parent().parent('tr').removeClass('open');
		} else {
			$(this).parent().parent('tr').addClass('open');
			$(this).parent().parent().next('tr').show();
		}
	});

	//탑메뉴 고정시키키 210914
	$(window).scroll(function(){

	var documentTop = $(document).scrollTop();

	    var topH = $(".header").height();
	    var hdH1 = $(".location_l").height();
	    var hdH2 = $(".cp_shop_tit").height();
	    var hdH3 = $(".select_link").height();
	    var hdH4 = $(".gray_box").height();
	    var hdH5 = $(".event_img").height();

	    var naviTop = 0;
	    if($("#planGoodsTab").length > 0){
	    	naviTop = $("#planGoodsTab").offset().top;
	    }else{
	    	naviTop = (topH + hdH1 + hdH2 + hdH3 + hdH4 + hdH5 + 350);
	    }

	    if(documentTop < naviTop){
	        $('.sort_table.top_table').css('margin-top','70px');
	        $('.sort_table.top_table .clear').removeClass("fixed").css({
	            position:"relative",
	            top:"0",
	            left:"0",
	            right:"0"
	        });
	    }else if(documentTop > naviTop){
	        $('.sort_table.top_table').css('margin-top','120px');
	        $('.sort_table.top_table .clear').addClass("fixed").css({
	            position:"fixed",
	            top:"0",
	            left:"0",
	            right:"0"
	        });
	    }
	});

	//스크롤시 상단 고정영역
	$(window).on("scroll touchmove",function(){
	    var nowScrTop = $(window).scrollTop();
	    var topH = $('.header .top').outerHeight();
	    var searchH = $('.header .searchBox').outerHeight();

	    var containerH01 = $('.container .goodsInfo').outerHeight();
	    var containerH02 = $('.container #planDetailItem .detailTop').outerHeight();

	    var naviTop = (topH + searchH);
	    //console.log(naviTop , nowScrTop );
	    if( nowScrTop > naviTop){
	        $('.navi').addClass('fixed');
	    }else{
	        $('.navi').removeClass('fixed');
	    }

	    var naviSpecialTop = (naviTop + containerH01 + containerH02);
	    if( nowScrTop > naviSpecialTop){
	        $('.tabArea .scrolled').addClass('fixed');
	    }else{
	        $('.tabArea .scrolled').removeClass('fixed');
	    }
	});

	//preview image 상품평 작성 사진등록
	var imgTarget = $('.preview_image .upload-hidden');

	imgTarget.on('change', function(){
		var parent = $(this).parent();
		parent.children('.upload-display').remove();
		$(this).closest('.preview_image').addClass('on');

		if(window.FileReader){
			//image 파일만
			if (!$(this)[0].files[0].type.match(/image\//)) return;

			var reader = new FileReader();
			reader.onload = function(e){
				var src = e.target.result;
				parent.prepend('<div class="upload-display"><div class="upload-thumb-wrap"><img src="'+src+'" class="upload-thumb"></div></div>');
				if($(reader).has('on')){
					$('.btn-delete').on('click', function(){
						$(this).closest('.preview_image').removeClass('on');
					});
				}
			}
			reader.readAsDataURL($(this)[0].files[0]);
		}
		else {
			$(this)[0].select();
			$(this)[0].blur();
			var imgSrc = document.selection.createRange().text;
			parent.prepend('<div class="upload-display"><div class="upload-thumb-wrap"><img class="upload-thumb"></div></div>');

			var img = $(this).siblings('.upload-display').find('img');
			img[0].style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enable='true',sizingMethod='scale',src=\""+imgSrc+"\")";
		}
	});

	$('.all_more > .btn_more').on('click', function(){
		$(this).parent().addClass('open');
		$(this).next().css('z-index', '10000');
	});
	$('.hid_more > .hid_close').on('click', function(){
		$(this).closest('.all_more').removeClass('open');
	});

	// FOPPD02M01 td 옵션 전체보기
	$('.allview').on('click', function(){
		$(this).toggleClass('on');
		$(this).parent().siblings().find('.hid_opt').toggleClass('open');
	});

	$('.big').each(function(){
		$('.btn_rvs').click(function(){
			$(this).parent().siblings('.txt_input').show();
		});
	});
	//2020-04-06 마이페이지 달력 클릭시 기간 효과제거
	//$(document).on('click','.date_input .inputbox',function(){
		//$('.sort_box > .sort_date .on').removeClass('on');
	//});
	//$('.sort_box > .sort_date .btn').click(function(){
		//$('.sort_box > .sort_date .btn.on').removeClass('on');
		//$(this).addClass('on');
	//});

	//2020-04-09 상품평 작성 별점 추가
	$(document).on('click','.gradeSet .stars a',function(){
		var tidx = $(this).index(),
			thisA = $(this);

		if($(this).hasClass('on')){
			$(this).removeClass('on').siblings().removeClass('on');
			$(this).parent().siblings('p').html('없음');
		}else{
			$(this).siblings().removeClass('on');
			$(this).addClass('on').prevAll().addClass('on');

			if(thisA.closest('.gradeSet').hasClass('Type1')){
				switch( tidx ){
					case 0 : thisA.parent().siblings('p').html('매우불만'); break;
					case 1 : thisA.parent().siblings('p').html('불만'); break;
					case 2 : thisA.parent().siblings('p').html('보통'); break;
					case 3 : thisA.parent().siblings('p').html('만족'); break;
					case 4 : thisA.parent().siblings('p').html('매우만족'); break;
				}
			}else if(thisA.closest('.gradeSet').hasClass('Type2')){
				switch( tidx ){
					case 0 : thisA.parent().siblings('p').html('매우느림'); break;
					case 1 : thisA.parent().siblings('p').html('느림'); break;
					case 2 : thisA.parent().siblings('p').html('보통'); break;
					case 3 : thisA.parent().siblings('p').html('빠름'); break;
					case 4 : thisA.parent().siblings('p').html('매우빠름'); break;
				}
			}else if(thisA.closest('.gradeSet').hasClass('Type3')){
				switch( tidx ){
					case 0 : thisA.parent().siblings('p').html('매우비쌈'); break;
					case 1 : thisA.parent().siblings('p').html('비쌈'); break;
					case 2 : thisA.parent().siblings('p').html('보통'); break;
					case 3 : thisA.parent().siblings('p').html('저렴'); break;
					case 4 : thisA.parent().siblings('p').html('매우저렴'); break;
				}
			}
		}
	});
	$('.top_banner .topbanner_close').click(function(){
		$(this).parent().hide();
		quick();
	});
	$('.btn.comment').click(function(){
		if($(this).hasClass('open')){
			$(this).removeClass('open').html('전체보기');
			$(this).closest('.cmmnt_wright').children('.cmmt_after').hide();
		}else{
			$(this).addClass('open').html('숨기기');
			$(this).closest('.cmmnt_wright').children('.cmmt_after').show();
		}
	});

} // ee

function tab(){
	$(window).scroll(wingMove);
	$('.idx_tab > ul > li > a, .run > li > a').on('click', function(){		// tab
		var idx = $(this).parent().index(),
			cont = document.getElementsByClassName('tab_cont')[idx];
		$(this).parent().addClass('on').siblings().removeClass('on');
		$(cont).addClass('on').siblings().removeClass('on');

		if($('.idx_tab').hasClass('idx_tab')){
			$('html,body').animate({scrollTop:idx_top},0);
			wingMove();
			//	tabMove();
		}
	});
	$('.has_sub li > a').on('click', function(){
		if($(this).parent('li').hasClass('open')){
			$(this).parent().removeClass('open');
		} else {
			$(this).parent('li').addClass('open');
			$(this).parent('li').siblings().removeClass('open');
		}
	});

	if($('.idx_tab').hasClass('idx_tab')){
		idx_top = $('.idx_tab').offset().top;
	}
	// 팝업 탭
	var tabArea = $(".tabArea");
	if (tabArea.length > 0) {
		var tabMenu = tabArea.find("ul.tabMenu > li"),
			tabCon = tabArea.find("div.tabCon");

		tabMenu.removeClass("on").eq(0).addClass("on");
		tabCon.hide().eq(0).show();

		tabMenu.on("click", "a", function(){
			var currIdx = $(this).parent().index();

			tabMenu.removeClass("on").eq(currIdx).addClass("on");
			tabCon.hide().eq(currIdx).show();

			return false
		});
	}

	// 결제 탭
	var radioTab = $(".tabArea > .tabinner");	// 결제방법
	$(".radio_tab > li > input[type='radio']").change(function() {
		if (this.checked) {
			$(this).parent().parent().siblings('.tabinner').hide();
			//radioTab.hide();
			radioTab.eq($(".radio_tab > li > input[type='radio']").index(this)).show();
		}
	});

	$(document).on('click','.tabUl a',function(){
		var idx = $(this).parent().index();
		$(this).parent().addClass('on').siblings().removeClass('on');
		$(this).closest('.tabBox').children('.tabCont').eq(idx).addClass('on').siblings().removeClass('on');

		/*if($(this).parent().hasClass('last')){
			$(this).closest('.tabBox').children('.tabCont').last().addClass('on').siblings().removeClass('on');
		}else if($(this).parent().hasClass('pass')){
		}else{
			$(this).closest('.tabBox').children('.tabCont').eq(idx).addClass('on').siblings().removeClass('on');
		}*/
	});

	$('.payment_choice li a').click(function(){
		$(this).parent().addClass('on').siblings().removeClass('on');
	});

	if($('.category_bx').length > 0){
		$('.category_bx .ver_lnb li a').click(function(){
			var idx = $(this).parent().index();

			$(this).parent().addClass('on').siblings().removeClass('on');
			$(this).closest('.category_bx').children('.lnb_con').eq(idx).addClass('on').siblings().removeClass('on');

		});
	}

} // tab

function acod(){
	//아코디언
	$('.acod dt > a').on('click', function(){
		if(!$('.acod dd').is(':animated')){
			if(!$(this).parent().hasClass('on')){
				$('.acod dt').removeClass('on');
				$('.acod dd').slideUp();
				$(this).parent().addClass('on').next('dd').slideDown();
			}else{
				$(this).parent().removeClass('on');
				$('.acod dd').slideUp();
			}
		}
	});

	$(document).on('click', '.qna_tbl tbody tr .open_qna', function(){	//
		if($(this).parent().parent('tr').hasClass('open')){
			$(this).parent().parent().next('tr').hide();
			$(this).parent().parent('tr').removeClass('open');
		} else {
			$(this).parent().parent('tr').addClass('open');
			$(this).parent().parent().next('tr').show();
		}
	});

	// 마이패이지_주문관리 상세보기 토글 슬라이드 2020-03-18
	$('.slide_more').on('click', function(){
		if(!$('.slide_con').is(':animated')){
			if(!$(this).parent('.slide_tp').hasClass('open')){
				$(this).parent('.slide_tp').addClass('open');
				$(this).parent().next('.slide_con').slideDown(500);
			}
			else{
				$(this).parent('.slide_tp').next('.slide_con').slideUp(500);
				$(this).parent('.slide_tp').removeClass('open');
			}
		}
	});

	//2020-04-10 주문/결제 특별포인트 아코디언
	$(document).on('click', '.acodBtn', function(){	//
		if($(this).hasClass('open')){
			$(this).removeClass('open');
			$(this).closest('tr').next('.acodTr').hide().removeClass('on');
		} else {
			$(this).addClass('open');
			$(this).closest('tr').next('.acodTr').show().addClass('on');
		}
	});

	//220406 PC 특별포인트 화면처리
	$('.simp_sub_lbl').on('change', 'input', function(){
		if(this.checked || !$(this).hasClass('checked')){
			$(this).parents().siblings(".simp_sub_ip").find("input").prop("readonly", false);
			$(this).addClass('checked').prop("checked", true);
		}else{
			$(this).parents().siblings(".simp_sub_ip").find("input").prop("readonly", true);
			$(this).removeClass('checked');
			$(this).parents().siblings(".simp_sub_ip").find(".inputbox input").val('0');
		}
	});

}	// acod

function slick(){	// slick slide
	$('.slider_2').length && $('.slider_2').slick({	// slide 2
		swipe:false,
		infinite:false,
		dots: true,
		arrows: false,
		slidesToShow:2,
		slidesToScroll:1
	})
	
	$('.slider_2_auto').length && $('.slider_2_auto').slick({	// slide 2
		swipe:false,
		infinite:true,
		dots: true,
		arrows: false,
		autoplay:true,
		autoplaySpeed:3000,
		slidesToShow:2,
		slidesToScroll:1
	})

	$('.slider_3').length && $('.slider_3').slick({// slide 3
		swipe:false,
		infinite:true,
		dots:true,
		arrows: false,
		autoplay:true,
		autoplaySpeed:3000,
		slidesToShow: 3,
		slidesToScroll: 3
	});

	$('.slider_4:not(.goods_no_slide.cols4)').length && $('.slider_4').slick({// slide 4
		swipe:false,
		infinite:true,
		dots:true,
		arrows:false,
		autoplay:true,
		autoplaySpeed:3000,
		slidesToShow:1,
		slidesToScroll:1
	});

	$('.slider_6').length && $('.slider_6').slick({// slide 6
		swipe:false,
		infinite:false,
		dots:true,
		arrows:false,
		slidesToShow:1,
		slidesToScroll:1
	});

	$('.slider_8').length && $('.slider_8').slick({// slide 8
		swipe:false,
		infinite:false,
		dots:true,
		arrows:false,
		slidesToShow:1,
		slidesToScroll:1
	});

	$('.slider_4all').length && $('.slider_4all').slick({// slide 4
		swipe:false,
		infinite:true,
		dots:true,
		arrows:false,
		autoplay:true,
		autoplaySpeed:4000,
		slidesToShow:4,
		slidesToScroll:4
	});

	$('.mainslide').length && $('.mainslide').slick({// mainslide
		swipe:false,
		infinite:true,
		dots:false,
		slidesToShow:1,
		slidesToScroll:1,
		autoplay:true,
		autoplaySpeed:3000,
		fade:true,
		cssEase:'linear'
	});

	$('.vertical_slide').length && $('.vertical_slide').slick({// quick slide
		swipe:false,
		infinite:false,
		dots: false,
		vertical: true,
		slidesToShow: 2,
		slidesToScroll: 2
	});

	$('.left_slider').length && $('.left_slider').slick({// sub main slide left
		swipe:false,
		infinite:true,
		autoplay: true,
		slidesToShow: 1,
		autoplaySpeed: 3000,
		dots: true,
		arrows:true,
		dotsClass: 'custom_paging',
		customPaging: function (slider, i) {
			return (i + 1) + '/' + slider.slideCount;
		}
	});

	$('.slider_for').slick({		// 상품상세
		swipe:false,
		autoplay: false,
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: true,
		fade: false,
		dots: false,
		asNavFor: '.slider_nav',
		lazyLoad: 'ondemand'
   });
   $('.slider_nav').slick({	// 상품상세 navi
	    swipe:false,
		autoplay: false,
		slidesToShow: 5,
		slidesToScroll: 1,
		arrows: false,
		dots: false,
		asNavFor: '.slider_for',
		focusOnSelect:true,
		lazyLoad: 'ondemand'
   });

	$('.slider_paging').length && $('.slider_paging').slick({// sub main slide left
		swipe:false,
		infinite:false,
	//	autoplay: true,
	//	autoplaySpeed: 3000,
		slidesToShow:1,
		slidesToScroll:1,
		dots: true,
		arrows:true,
		dotsClass: 'custom_paging',
		customPaging: function (slider, i) {
			return (i + 1) + '/' + slider.slideCount;
		}
	});
	$('.slick_slide').length && $('.slick_slide').slick({// mro
		swipe:false,
		infinite:true,
		autoplay: true,
		slidesToShow: 1,
		autoplaySpeed: 3000,
		dots: true,
		arrows:false,
	});

	$('.goods_no_slide.cols4.slider_4').length && $('.slider_4').slick({// slide 4
		swipe:false,
		infinite:false,
		dots:false,
		arrows:true,
		slidesToShow:4,
		slidesToScroll:4
	});
	
	$('.present_slide.slider_5').slick({
		swipe: false,
		infinite: false,
		dots: false,
		arrows: true,
		slidesToShow: 5,
		slidesToScroll: 1
	});
}	// slick

function slick_reset(){
	$('.slider_2').slick('unslick');
	$('.slider_3').slick('unslick');
	$('.slider_4').slick('unslick');
	$('.slider_6').slick('unslick');
	$('.slider_8').slick('unslick');
	$('.mainslide').slick('unslick');
	$('.vertical_slide').slick('unslick');
	$('.left_slider').slick('unslick');
	$('.slider_for').slick('unslick');
	$('.slider_nav').slick('unslick');
	$('.slider_paging').slick('unslick');
	$('.slick_slide').slick('unslick');
	$('.slider_4all').slick('unslick');
	$('.present_slide.slider_5').slick('unslick');
	
	$('.slider_2_auto').slick('unslick');
}

function subLocationAdd(){
	// 서브 상단 로케이션
	$('.location_l > ul > li:has(.lct_menu)').addClass("lctn");
	$('.location_l ul li.lctn a').each(function(){
		$(this).click(function(){
			if($(this).closest('li.lctn').hasClass('open')){
				$('.location_l .lctn.open').removeClass('open');
			}else{
				$('.location_l .lctn.open').removeClass('open');
				$(this).closest('li.lctn').addClass('open');
			}
		});
	});
	$('body').click(function(event){
		var $target = $(event.target);
		if($target.is(':not(.location_l ul li.lctn a)')){
			$('.location_l ul li.lctn').removeClass('open');
		}
	})
}

function datepicker(){
	$(".datepicker").datepicker({		// datepicker
		//buttonImage: '../../images/icon/date.png',
		buttonImage: '//img.ezwelfare.net/welfare_market/onnuri/images/icon/date.png',
		showOn: "both",
		dateFormat:'yy-mm-dd',
		showOtherMonths: true,
		showMonthAfterYear: true,
		monthNames: [ '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월' ],
		dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
		dayNamesShort: ['일','월','화','수','목','금','토'],
		dayNamesMin: ['일','월','화','수','목','금','토'],
		yearSuffix: '년',
	//	minDate: 0
	});
}


function quick(){
	$('.quick_menu').each(function(){
		var	sp = $('.quick_menu').offset().top,
			h_h = $('.header').height(),
			h_h = h_h + $('.header').offset().top,
			q_h = $('.quick_pos').height();

		//console.log(hq_h, q_h);

		var hq_h = h_h + 30;

		if($('.quick_pos').length){
			var q_h = q_h + $('.quick_pos').offset().top;
			var hq_h = 0;
			var hq_h = q_h + 30;
		}

		//console.log(hq_h, q_h);

		$(".quick_menu").css({'position' : 'absolute', 'top' : hq_h });

		var hq_h = q_h + 30,
			hq_h2 = h_h + 30;

		$(window).scroll(function(){   //quick
			var	q_h = $('.quick_pos').height();

			if($('.quick_pos').hasClass('quick_pos')){
				var q_h = q_h + $('.quick_pos').offset().top;
				var hq_h = 0;
				var hq_h = q_h + 30;

				if($(this).scrollTop() > hq_h){
					$(".quick_menu").css({'position' : 'fixed', 'top' : '30px'});
				} else {
					$(".quick_menu").css({'position' : 'absolute', 'top' : hq_h + 'px'});
				}
			}else{
				if($(this).scrollTop() > sp){
					$(".quick_menu").css({'position' : 'fixed', 'top' : '30px'});
				} else {
					$(".quick_menu").css({'position' : 'absolute', 'top' : hq_h2 + 'px'});
				}
			}
		});
	});
}
//$(document).on( 'DOMMouseScroll mousewheel', function ( event ) {
    //if(event.originalEvent.deltaY > 0) {

        //console.log("up");
        ////return false;
    //}
    //if(event.originalEvent.deltaY < 0) {

        //console.log("down");
        ////return false;
    //}
    ////return false;
//});
$(document).ready(function(){
	$(document).on("mouseenter", ".goodsList .prod_over", function(){
		$(this).parent().parent().find(".exp_area").addClass("img_over");
		$(this).parent().parent().find(".exp_area").addClass("on");
		$(".goodsList .exp_area").on("click", function(){
			if($("#zzimTxPop").hasClass("hover") == true) {
				$(this).addClass("on");
			};
		});
	});

	$(document).on("mouseenter", ".goodsList .exp_area", function(){
		$(this).addClass("img_over");
		$(this).addClass("on");
		$(".goodsList .exp_area").on("click", function(){
			if($("#zzimTxPop").hasClass("hover") == true) {
				$(this).addClass("on");
			};
		});
	});

	$(document).on("mouseleave", ".goodsList .prod_over", function(){
		$(this).parent().parent().find(".exp_area").removeClass("img_over");
		if($("#zzimTxPop").hasClass("hover") == false) {
			$(".prd .exp_area").removeClass("on");
		};
	});

	$(document).on("mouseleave", ".goodsList .exp_area", function(){
		$(this).removeClass("img_over");
		$(this).removeClass("on");
		$(".goodsList .exp_area").on("click", function(){
			if($("#zzimTxPop").hasClass("hover") == true) {
				$(this).addClass("on");
			};
		});
	});
});